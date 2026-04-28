# MotionSlides Sharing Architecture — Implementation Plan

## Overview

Three problems to fix, in priority order:

1. **Share Menu UI state desync** — UI allows copying links that don't work
2. **Premature link sharing** — guests get 404 because the owner hasn't synced yet
3. **Stale collaborative access** — guests retain edit access after owner revokes it

The guiding principle across all three: **gate sharing on the owner's side, not the guest's side.**

---

## Phase 1 — Share Menu Overhaul

### 1.1 Replace boolean flags with a state machine

Model the share menu as a single explicit state instead of multiple independent booleans drifting out of sync.

```ts
type ShareState =
  | { status: 'unsynced' }       // never reached Postgres — block sharing entirely
  | { status: 'syncing' }        // re-syncing — allow copy, surface soft warning
  | { status: 'private' }        // sharing off
  | { status: 'link-shared' }    // view-only link active
  | { status: 'collaborative' }  // edit link active

function getShareState(project: Project, isSyncing: boolean): ShareState {
  if (!project.synced) return { status: 'unsynced' }
  if (isSyncing) return { status: 'syncing' }
  return { status: project.visibility }
}
```

The entire Share Menu UI derives from this one value — no independent toggle state, no conditional booleans.

### 1.2 Sync status UX rules

| Project State | UI Behaviour |
|---|---|
| `!project.synced` (never uploaded) | Disable share button. Show "Syncing to cloud…" |
| `project.synced && isSyncing` (re-syncing) | Allow copy. Show soft toast: "Link copied — project is still syncing, it may take a moment for guests to open it." |
| `project.synced && !isSyncing` | Normal share flow |

Never block the copy action for a project that has already synced once. Surface latency as information, not as an error.

### 1.3 Lock the Collaborative link behind its toggle

The "Collaborative Edit" link and copy button must be visually disabled (`opacity-40`, `pointer-events-none`, `disabled`) unless `project.visibility === 'collaborative'`. Do not show it as active just because link sharing is on.

### 1.4 Rotate shareKey on every toggle-on

When an owner disables link sharing and re-enables it, generate a new `shareKey` UUID. Reusing the old key means anyone with the previous link retains access indefinitely, silently defeating the revocation.

```ts
function enableLinkSharing(project: Project) {
  return {
    ...project,
    visibility: 'link-shared',
    shareKey: crypto.randomUUID(), // always rotate
  }
}
```

---

## Phase 2 — useAccessControl Hardening

### 2.1 canEdit derivation

`canEdit` must be derived purely from data — never from the URL `mode` param. The mode param controls UI presentation only.

```ts
const isOwner = project.ownerId === currentUser?.id
const isLocalDraft = !project.synced && project.localAuthorId === localId
const isCollaborative = project.visibility === 'collaborative'
const hasValidKey = searchParams.key === project.shareKey

const canEdit =
  isOwner ||
  isLocalDraft ||
  (isCollaborative && hasValidKey)
```

### 2.2 Graceful mode downgrade

Never show an error when a view-only fallback is possible. If a guest arrives with `?mode=edit` but only has view access, silently downgrade.

```ts
const effectiveMode =
  searchParams.mode === 'edit' && !canEdit ? 'view' : searchParams.mode
```

Make `effectiveMode` the single source of truth consumed by all components. No component should read the raw `searchParams.mode` directly. When a downgrade occurs, update the URL silently:

```ts
useEffect(() => {
  if (effectiveMode !== searchParams.mode) {
    router.navigate({ search: s => ({ ...s, mode: effectiveMode }), replace: true })
  }
}, [effectiveMode])
```

This prevents the "bookmarked `?mode=edit`" confusion where the URL contradicts the actual access level.

### 2.3 Server-side write validation (non-negotiable)

Client-side `canEdit` is UX only — it controls which panels render. It is not a security boundary. Every write operation must be validated server-side:

- Check `ownerId` or (`visibility === 'collaborative'` && valid `shareKey`) on every mutation
- Return `403` on failure
- On receiving a `403`, the client should reactively call `setReadOnly(true)` to strip edit UI without a full reload

This covers the case where an owner revokes collaborative access while a guest has the project open.

---

## Phase 3 — Loader Reliability

### 3.1 Primary fix: gate on the owner's side

The loader retry is a band-aid if used as the main fix. The real solution is Phase 1.2 — the share button is disabled until `project.synced` is true, so by the time any guest has a valid link, the project is guaranteed to exist in Postgres. The loader stays simple.

### 3.2 Defensive retry as fallback only

Keep a lightweight retry for genuine transient failures (network blip, cold server start) — not as the primary defence against sync latency.

```ts
loader: async ({ params, deps }) => {
  await storeHydrationPromise
  const store = useEditorStore.getState()

  const existsLocally = store.projects.some(p => p.id === params.projectId)
  if (existsLocally) {
    store.loadProject(params.projectId)
    return
  }

  const { getRemoteProjectAction } = await import('@/lib/actions/project')

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const remoteProject = await getRemoteProjectAction({
        data: { projectId: params.projectId, shareKey: deps.key }
      })

      if (remoteProject) {
        store.importProject(remoteProject as any)
        store.loadProject(params.projectId)
        return
      }
    } catch (err) {
      console.error(`Loader attempt ${attempt} failed:`, err)
    }

    if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt)) // 1s, 2s backoff
  }

  store.loadProject(params.projectId) // resolves to null → "not found" UI
}
```

---

## Edge Cases to Address

| Edge Case | Risk | Fix |
|---|---|---|
| Stale collaborative access in open tab | Guest retains `canEdit` after owner revokes | Server-side write validation + 403 → `setReadOnly` |
| shareKey reuse after toggle | Old link holders regain access after revocation | Always rotate `shareKey` on toggle-on (Phase 1.4) |
| `?mode=edit` bookmark after downgrade | URL contradicts access level, confuses user | Silent URL rewrite via `router.navigate` (Phase 2.2) |
| Local draft ID collision | Two machines share same draft ID, wrong user gets `isLocalDraft: true` | Use UUID at creation time, never sequential IDs |
| Offline owner, online guest | Guest reads stale Postgres data with no indication | Show "last synced at" timestamp in share UI |

---

## Implementation Order

```
Phase 1 — Share Menu (UI + shareKey rotation)
  └── Blocks Phase 3 from being needed as a primary fix

Phase 2 — useAccessControl (canEdit logic + URL downgrade)
  └── Can be done in parallel with Phase 1

Phase 3 — Loader defensive retry
  └── Do last — simplest change, least leverage on its own

Server-side write validation
  └── Required before shipping collaborative edit to production
```

---

## What Not to Do

- **Do not** use loader retry as the primary fix for sync latency — it moves the problem to the guest's side and adds 3s of delay before failure
- **Do not** read `searchParams.mode` raw in components — always consume `effectiveMode`
- **Do not** reuse `shareKey` across visibility toggle cycles
- **Do not** treat client-side `canEdit` as a security boundary for collaborative writes