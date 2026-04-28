# Code Review — useAccessControl, ShareMenu & Server Actions

## Summary

The architecture is sound and the three files are largely correct. There are two real bugs that need fixing, one security hole, and a handful of minor issues. Everything else is good to ship.

---

## `useAccessControl.ts`

### 🔴 Bug 1 — `canEdit` conflates capability with current mode

**Severity: Serious** — This will break owner access in view/present mode.

```ts
// ❌ What the IDE wrote
canEdit: canEdit && effectiveMode === 'edit',
isReadOnly: !(canEdit && effectiveMode === 'edit'),
```

`canEdit` is a **capability** — "is this user allowed to edit?" — not a description of what they're currently viewing. If an owner switches to `?mode=view` to preview their presentation, this returns `canEdit: false`, which could block them from switching back or from write operations that check `canEdit`.

```ts
// ✅ Fix — keep capability and mode separate
canEdit,
isReadOnly: !canEdit,
```

The mode controls which UI panels render. `canEdit` controls whether writes are permitted. They are orthogonal.

---

### 🔴 Bug 2 — `isLocalDraft` is missing the author check

**Severity: Security hole** — Any unsynced local copy grants full edit access regardless of who created it.

```ts
// ❌ What the IDE wrote
const isLocalDraft = !project.synced
```

If two machines somehow end up with the same `projectId` in IndexedDB (import, bug, collision), any unsynced local copy grants full edit access. The check needs the local author identity:

```ts
// ✅ Fix
const localAuthorId = useEditorStore.getState().localAuthorId
const isLocalDraft = !project.synced && project.localAuthorId === localAuthorId
```

---

### 🟡 Minor — `useEditorStore` called twice

Two separate subscriptions to the same store — causes an unnecessary extra subscription and re-render.

```ts
// ❌ Two separate subscriptions
const { user } = useEditorStore()
const { activeProject } = useEditorStore()

// ✅ One
const { user, activeProject } = useEditorStore()
```

---

### 🟡 Minor — `autoplay` type inconsistency in null-project branch

The return type declares `autoplay: boolean | null` but the no-project early return sends back `autoplay: false`. Prefer `null` — it's more honest since you genuinely don't know the intent when there's no project.

```ts
// ❌
autoplay: false,

// ✅
autoplay: null,
```

---

### ✅ Corrected `useAccessControl.ts` in full

```ts
import { useMemo, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useSearch, useNavigate } from '@tanstack/react-router'

export type AccessMode = 'edit' | 'view' | 'present'

export interface AccessControl {
  mode: AccessMode
  canEdit: boolean
  isReadOnly: boolean
  autoplay: boolean | null
  isAuthenticated: boolean
  isDenied: boolean
}

export function useAccessControl(): AccessControl {
  const search = useSearch({ from: '/p/$projectId' }) as any
  const navigate = useNavigate()

  // Single store subscription
  const { user, activeProject, localAuthorId } = useEditorStore()
  const project = activeProject()

  const access = useMemo(() => {
    const requestedMode = (search.mode as AccessMode) || 'edit'
    const requestedKey = search.key as string
    const autoplayParam = search.autoplay
    const autoplay = autoplayParam === 'true' ? true : autoplayParam === 'false' ? false : null

    if (!project) {
      return {
        mode: 'view' as AccessMode,
        canEdit: false,
        isReadOnly: true,
        autoplay: null,
        isAuthenticated: !!user,
        isDenied: false, // let the !project check in the page handle the UI
      }
    }

    const isOwner = !!user && project.ownerId === user.id
    const isCollaborative = project.visibility === 'collaborative'
    const isLinkShared = project.visibility === 'link-shared'
    const isPublic = project.visibility === 'public'

    // Requires matching localAuthorId to prevent draft collision between devices
    const isLocalDraft = !project.synced && project.localAuthorId === localAuthorId

    const hasValidKey = requestedKey === project.shareKey

    // Access denial — guests with no valid path to the project
    let isDenied = false
    if (!isOwner && !isLocalDraft) {
      if (isPublic) {
        isDenied = false
      } else if (isLinkShared || isCollaborative) {
        if (!hasValidKey) isDenied = true
      } else {
        isDenied = true // private project
      }
    }

    // canEdit is a capability derived purely from data — never from the URL mode
    const canEdit = isOwner || isLocalDraft || (isCollaborative && hasValidKey)

    // Graceful mode downgrade — never show an error when view is possible
    const effectiveMode: AccessMode =
      requestedMode === 'edit' && !canEdit ? 'view' : requestedMode

    return {
      mode: effectiveMode,
      canEdit,              // capability — independent of current mode
      isReadOnly: !canEdit, // write guard for store/server operations
      autoplay,
      isAuthenticated: !!user,
      isDenied,
    }
  }, [project, user, localAuthorId, search.mode, search.key, search.autoplay])

  // Silent URL rewrite when mode is downgraded, so the URL reflects reality
  useEffect(() => {
    if (access.mode !== search.mode) {
      navigate({
        search: (s: any) => ({ ...s, mode: access.mode }),
        replace: true,
      })
    }
  }, [access.mode, search.mode, navigate])

  return access
}
```

---

## `ShareMenu.tsx`

### 🔴 Bug — Edit link is missing the `shareKey`

**Severity: Breaks collaborative edit for every guest.**

```ts
// ❌ What the IDE wrote
let url = `${baseUrl}/p/${project.id}?mode=${type}`
if (type === 'view') {
  url += `&key=${project.shareKey}`
}
```

The `key` is only appended for view links. But `useAccessControl` requires `hasValidKey = requestedKey === project.shareKey` to grant collaborative edit access. A guest opening the edit link without a key will have `hasValidKey: false`, `canEdit: false`, and get silently downgraded to view mode — with no error, just broken access.

```ts
// ✅ Fix — always include the key for any shared link
const url = `${baseUrl}/p/${project.id}?mode=${type}&key=${project.shareKey}`
```

---

### ✅ Everything else in ShareMenu is correct

- The `ShareState` machine is clean and correctly derived
- `unsynced` disables sharing; `syncing` allows copy with a soft warning — matches the plan exactly
- `shareKey` is rotated on every toggle-on via `crypto.randomUUID()`
- The collaborative toggle is correctly gated: the edit link section is `pointer-events-none` unless `isCollaborative`
- `handleRotateKey` correctly calls the server action and patches local state on success

---

## `project.ts` (Server Actions)

### ✅ `syncProjectsAction` — security model is correct

The `onConflictDoUpdate` `set` clause correctly excludes `ownerId`, `shareKey`, and `visibility`. A collaborative guest can push slide content but cannot hijack ownership or change permissions. The LWW (Last Write Wins) timestamp check (`updatedAt < incoming.updatedAt`) is the right approach for a local-first sync model.

### 🟡 Minor — Silent no-op on ownership rejection

`onConflictDoUpdate` silently skips the update if the `where` clause isn't met — the comment in the code acknowledges this. Currently the action returns `success: true` even when a write was silently rejected due to failed ownership checks. This is fine for now, but worth a TODO for when you need auditability:

```ts
// TODO: Check rows affected to distinguish "synced" from "rejected by ownership check"
// Drizzle doesn't surface this directly — would need a raw SQL count or a separate SELECT.
```

### ✅ `rotateShareKeyAction` — correct

Owner-only guard via `eq(projects.ownerId, session.user.id)` in the `where` clause. Safe.

### ✅ `getRemoteProjectAction` — correct

Access control order is right: public → owner → shareKey. Throws on denial rather than returning null, which is the correct behaviour for the loader's retry logic to distinguish "not found yet" from "access denied".

### ✅ `deleteRemoteProjectAction` — correct

Owner-only guard is in place. Safe.

---

## Fix Priority

| # | File | Issue | Severity |
|---|---|---|---|
| 1 | `ShareMenu.tsx` | Edit link missing `shareKey` | 🔴 Breaks collaborative edit |
| 2 | `useAccessControl.ts` | `isLocalDraft` missing author check | 🔴 Security hole |
| 3 | `useAccessControl.ts` | `canEdit` tied to `effectiveMode` | 🔴 Breaks owner in view mode |
| 4 | `useAccessControl.ts` | Double `useEditorStore` subscription | 🟡 Minor |
| 5 | `useAccessControl.ts` | `autoplay: false` in null branch | 🟡 Minor |
| 6 | `project.ts` | Silent no-op on sync rejection | 🟡 Future TODO |