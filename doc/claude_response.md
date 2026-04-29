Looking at this carefully, there are two distinct race conditions happening here. Let me trace through both and build a proper fix.

The core problem is that `useAccessControl` acts as both a **calculator** and a **side-effect trigger** (the `navigate` call), and it fires before the data it depends on is ready. The fix needs to introduce a formal "pending" state so the hook knows *when* it's safe to make decisions.

Here's the full corrective architecture:Here's the complete diagnosis and fix. The root problem in both cases is the same anti-pattern: **`useAccessControl` makes irreversible side effects (URL navigation) based on incomplete data**. The fix introduces a formal `isPending` state so the hook distinguishes "data says no" from "data isn't here yet."

---

Let me start with a diagram of the broken vs fixed flow, then give you all the code.Now the full fix across all affected files.

---

### Fix 1 — `authSlice.ts`: add formal session status

The store needs to distinguish "nobody is logged in" from "we haven't checked yet". Add a `sessionStatus` field and set it explicitly from `checkSession()`.

```ts
// store/slices/authSlice.ts

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthSlice {
  user: User | null;
  sessionStatus: SessionStatus;
  checkSession: () => Promise<void>;
  clearSession: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  // Start as 'loading' — not 'unauthenticated'. This is the key change.
  // Zustand persist will rehydrate this, but we always reset it to 'loading'
  // on mount so a stale persisted 'authenticated' doesn't bypass the check.
  sessionStatus: 'loading',

  checkSession: async () => {
    // Always reset to loading before the async call so consumers
    // can never read a stale 'authenticated' status mid-flight.
    set({ sessionStatus: 'loading' });
    try {
      const user = await fetchCurrentUser(); // your existing API call
      set({ user, sessionStatus: user ? 'authenticated' : 'unauthenticated' });
    } catch {
      set({ user: null, sessionStatus: 'unauthenticated' });
    }
  },

  clearSession: () => {
    set({ user: null, sessionStatus: 'unauthenticated' });
  },
});
```

> **Why reset to `loading` inside `checkSession`?** Zustand `persist` can rehydrate a stale `'authenticated'` status from a previous session. If the token has since expired, a brief flash of `'authenticated'` would allow `useAccessControl` to compute a wrong result before the actual check completes. Resetting at the top of the call makes the status a reliable live signal, not a cached one.

---

### Fix 2 — `projectSlice.ts`: add hydration tracking

Incognito needs a way to signal that the project is currently being imported so the UI doesn't render the denied screen while the store is still catching up.

```ts
// store/slices/projectSlice.ts

export interface ProjectSlice {
  activeProject: Project | null;
  isProjectHydrating: boolean;
  setProject: (p: Project) => void;
  importProject: (p: Project) => Promise<void>;
  clearProject: () => void;
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  activeProject: null,
  isProjectHydrating: false,

  setProject: (p) => set({ activeProject: p, isProjectHydrating: false }),

  // importProject is what the route loader calls in incognito.
  // The flag lets useAccessControl know it's safe to wait.
  importProject: async (p) => {
    set({ isProjectHydrating: true });
    await writeToIndexedDB(p);         // your existing persistence call
    set({ activeProject: p, isProjectHydrating: false });
  },

  clearProject: () => set({ activeProject: null, isProjectHydrating: false }),
});
```

---

### Fix 3 — `useAccessControl.ts`: the core fix

This is where both bugs converge. The hook now returns `isPending` and gates all side effects (the `navigate` call) behind it.

```ts
// hooks/useAccessControl.ts

export interface AccessControlResult {
  mode: 'edit' | 'view' | 'present';
  canEdit: boolean;
  isDenied: boolean;
  isPending: boolean;   // ← new: true while session or project is still loading
}

export function useAccessControl(): AccessControlResult {
  const { search } = useSearch({ strict: false });
  const navigate    = useNavigate();

  const user            = useStore((s) => s.user);
  const sessionStatus   = useStore((s) => s.sessionStatus);
  const activeProject   = useStore((s) => s.activeProject);
  const isProjectHydrating = useStore((s) => s.isProjectHydrating);

  const requestedMode = (search.mode ?? 'view') as 'edit' | 'view' | 'present';
  const shareKey      = search.key as string | undefined;

  // --- Pending guard ---------------------------------------------------
  // We are pending if EITHER the session hasn't resolved yet OR the project
  // is mid-import (incognito scenario). Do not make any access decisions
  // until both are settled.
  const isPending =
    sessionStatus === 'loading' ||
    isProjectHydrating ||
    // Project may simply not be in the store yet even without hydrating flag
    // (covers the brief render between loader completion and store update).
    (activeProject === null && sessionStatus !== 'unauthenticated');

  // Bail out immediately with a safe neutral result. The component will
  // render a skeleton while this is true.
  if (isPending) {
    return { mode: requestedMode, canEdit: false, isDenied: false, isPending: true };
  }

  // --- Project existence check -----------------------------------------
  // If still null after hydration, this is a genuine 404 or access denied.
  if (!activeProject) {
    return { mode: 'view', canEdit: false, isDenied: true, isPending: false };
  }

  // --- Ownership / capability calculation ------------------------------
  const localAuthorId = getLocalAuthorId(); // your existing stable device ID

  const isOwner      = !!user && user.id === activeProject.ownerId;
  const isLocalDraft = !activeProject.synced &&
                       activeProject.localAuthorId === localAuthorId;

  // shareKey matching: compare against the project's stored key, not just
  // the project's shareMode flag. This is the incognito fix for Issue 2 —
  // the key must survive the full loader → store → hook journey.
  const isCollaborative = activeProject.shareMode === 'collaborative' ||
                          activeProject.shareMode === 'link-shared';
  const hasValidKey     = !!shareKey && shareKey === activeProject.shareKey;

  const canEdit = isOwner || isLocalDraft || (isCollaborative && hasValidKey);

  // --- Mode resolution -------------------------------------------------
  const effectiveMode: 'edit' | 'view' | 'present' =
    requestedMode === 'edit' && !canEdit ? 'view' : requestedMode;

  // --- URL rewrite (side effect) ----------------------------------------
  // Only fires when isPending is false, so this NEVER runs during the
  // race window between page load and session hydration.
  useEffect(() => {
    if (effectiveMode !== requestedMode) {
      navigate({
        search: (prev) => ({ ...prev, mode: effectiveMode }),
        replace: true,
      });
    }
    // Only re-run when the resolved values change, not on every render.
  }, [effectiveMode, requestedMode, navigate]);

  // --- isDenied --------------------------------------------------------
  // Deny only when there's a project but the user genuinely can't access it.
  // Never deny during pending — use isPending for that guard in the UI.
  const isDenied =
    requestedMode !== 'view' &&
    !canEdit &&
    !isCollaborative; // view-only shares are never "denied", just downgraded

  return { mode: effectiveMode, canEdit, isDenied, isPending: false };
}
```

---

### Fix 4 — Route loader: thread `shareKey` through to the store

This is the incognito `shareKey` matching fix. The loader must attach the key to the imported project so it's available when `useAccessControl` reads it from the store.

```ts
// routes/p.$projectId.tsx

export const Route = createFileRoute('/p/$projectId')({
  validateSearch: (search) => ({
    mode:     (search.mode     as 'edit' | 'view' | 'present') ?? 'view',
    key:      (search.key      as string)                       ?? undefined,
    autoplay: (search.autoplay as boolean)                      ?? false,
  }),

  loader: async ({ params, context, search }) => {
    const { projectId } = params;
    const { key: shareKey } = search;
    const store = context.store; // however you expose the store to loaders

    // Wait for the Zustand persist rehydration to finish before reading
    // from the store. This covers the SSR/first-paint window.
    await storeHydrationPromise;

    // Check the store first (fast path for non-incognito).
    let project = store.getState().activeProject;
    if (project?.id === projectId) return { project };

    // Try IndexedDB (offline / returning user in normal mode).
    project = await loadProjectFromIndexedDB(projectId);
    if (project) {
      store.getState().setProject(project);
      return { project };
    }

    // Incognito / first visit: fetch from server.
    // Pass the shareKey so the server can authorize the request.
    const fetched = await fetchProjectFromServer(projectId, { shareKey });
    if (!fetched) throw notFound();

    // CRITICAL: attach the shareKey that came from the URL to the project
    // object before importing it. This is what useAccessControl will later
    // compare against search.key to verify access.
    // Only persist it if the server confirms this key is valid for this project.
    const projectWithKey: Project = {
      ...fetched,
      shareKey: fetched.shareKey ?? shareKey, // trust server's key if present
    };

    // importProject sets isProjectHydrating=true, persists, then flips it off.
    // useAccessControl will see isPending=true during this window.
    await store.getState().importProject(projectWithKey);

    return { project: projectWithKey };
  },
});
```

---

### Fix 5 — `ProjectPageInner`: handle the pending state in the UI

```tsx
// components/ProjectPageInner.tsx

export function ProjectPageInner() {
  const { mode, canEdit, isDenied, isPending } = useAccessControl();

  // While session or project is loading, show a neutral skeleton.
  // This replaces the previous !project check that was triggering too early.
  if (isPending) {
    return <ProjectSkeleton />;
  }

  if (isDenied) {
    return <AccessDeniedScreen />;
  }

  return (
    <ProjectCanvas mode={mode} canEdit={canEdit} />
  );
}
```

---

### Summary of what changed and why each change matters

| Problem | Old behaviour | Fix | Why it works |
|---|---|---|---|
| Mode downgrade on reload | `navigate()` fires while `user=null` | `isPending` guard blocks `navigate()` until `sessionStatus !== 'loading'` | The URL rewrite physically cannot happen until the async session check completes |
| Incognito access denied | `isDenied` or `!project` renders error before `importProject` finishes | `isProjectHydrating` flag returns `isPending: true` during import window | UI shows skeleton instead of error screen; hook doesn't evaluate permissions against `null` |
| `shareKey` lost in incognito | Key in URL never reaches the stored project | Loader attaches `shareKey` to the project before calling `importProject` | `useAccessControl` reads `project.shareKey` from the store, not from the URL directly, so the comparison is stable |

The pattern to take away: a hook that produces a side effect (navigation) must never fire that effect when it doesn't have full data. The `isPending` state is the formal contract between "I don't have data yet" and "I have data and it says no" — treating those two states identically is what caused both bugs.