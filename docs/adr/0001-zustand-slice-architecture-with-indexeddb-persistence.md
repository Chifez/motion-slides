# ADR 001: Zustand Slice Architecture with Debounced IndexedDB Persistence

## Status
**Accepted** (2026-08-18)

## Context & Problem Statement
MotionSlides is an interactive presentation and diagramming studio requiring high-frequency canvas interactions (60fps drag, multi-select transforms, pan/zoom, live layout calculation). State updates occur tens to hundreds of times per second during mouse interactions.

We need a state management architecture that:
1. Handles complex multi-domain state (projects, slides, elements, canvas, presentations, git branching, auth, undo/redo snapshots, AI execution state).
2. Prevents full-tree re-renders on fine-grained element position or property changes.
3. Persists presentation documents locally in the browser for offline-first resilience without causing main-thread stuttering or dropped frames during 60fps animations.
4. Provides deterministic synchronization with cloud storage (PostgreSQL/Drizzle) using monotonic timestamps and Last-Write-Wins (LWW) conflict resolution.

## Decision Drivers
- **Render Performance**: Canvas drag/resize gestures must not trigger global store re-evaluations.
- **Persistence Latency**: Serializing a large AST to IndexedDB on every mouse move frame freezes the UI thread.
- **Modular Maintainability**: Avoid 5,000-line monolithic store definitions; split state logic by architectural domain.
- **State Hydration Integrity**: Prevent race conditions where UI or network loaders execute before IndexedDB has hydrated local state.

## Decision Outcome
We adopted a **Modular Zustand Slice Pattern** backed by custom **Debounced IndexedDB Persistence** via `idb-keyval` and **Hydration Gating**:

1. **Slice Architecture**: All domain state is split into standalone slice creators (`createProjectSlice`, `createSlideSlice`, `createElementSlice`, `createCanvasSlice`, `createSnapshotSlice`, `createGitSlice`, etc.) located in `apps/web/src/store/slices/`.
2. **Unified Bounded Store**: Slices are combined into a single typed store (`useEditorStore`) in `apps/web/src/store/editor-store.ts`.
3. **Atomic Selectors**: Components must subscribe to granular slices of state using atomic selectors (or `useShallow`), e.g., `useEditorStore((s) => s.activeProjectId)`.
4. **Optimized Debounced Persistence**: `optimizedStorage` wraps `idb-keyval`. During active drag/resize operations (`isDragging === true`), disk persistence is bypassed. Disk writes are debounced with a 500ms sliding window to keep the main thread fluid.
5. **Hydration Gating**: State initialization exports a `storeHydrationPromise` that guarantees stores are fully rehydrated from IndexedDB before any dependent background queries or router loaders execute.

---

## Negative Space & Forbidden Alternatives

The following tools, paradigms, and patterns are **STRICTLY FORBIDDEN** in this repository:

| Forbidden Alternative | Reason for Rejection & Threat to Architecture |
| :--- | :--- |
| **Redux / Redux Toolkit** | Excessive boilerplate, immutable tree cloning overhead on 60fps mouse drag events, poor ergonomics for compound slice assembly. |
| **Jotai / Recoil / MobX** | Atom fragmentation makes holistic scene graph serialization, time-travel undo snapshots, and monotonic cloud synchronization brittle and error-prone. |
| **Synchronous `localStorage`** | 5MB storage limit is insufficient for multi-slide asset-rich presentations. Synchronous I/O blocks the main render thread on every tick. |
| **Monolithic Store Files** | Defining all actions and state properties in a single gigantic file without slice encapsulation violates separation of concerns and leads to circular type dependencies. |
| **Whole-Store Destructuring** | `const { slides, activeSlideIndex } = useEditorStore()` subscribes the component to every state mutation across all slices, destroying render performance. |
| **Direct State Mutation Outside Actions** | Directly writing to store properties outside defined slice action functions bypasses invariant validation, snapshot tracking, and dirty markers. |

---

## Agent Guardrails (Automated Enforcement Rules)

AI Agents modifying this codebase must adhere to the following strict guardrails:

1. **No Monolithic Store Additions**:
   - New global state domains MUST be created as a new slice file in `apps/web/src/store/slices/<domain>-slice.ts` and merged into `useEditorStore`.
2. **Mandatory Atomic Selectors**:
   - ❌ `const { elements, selectedIds } = useEditorStore()`
   - ✅ `const elements = useEditorStore((s) => s.elements)`
   - ✅ `const { width, height } = useEditorStore(useShallow((s) => ({ width: s.canvasWidth, height: s.canvasHeight })))`
3. **Actions as Domain Events**:
   - Do not write generic CRUD setters (e.g., `setElements(newArray)`). Encapsulate domain logic inside semantic actions (e.g., `updateElementPosition`, `groupSelectedElements`).
4. **Persistence Gating During High-Frequency Gestures**:
   - Any state update loop linked to `onPointerMove`, `onDrag`, or `requestAnimationFrame` MUST toggle `isDragging: true` or execute without immediate persistence serialization.
5. **Hydration Check**:
   - Asynchronous initializations that read project data on startup MUST await `storeHydrationPromise` before evaluating empty state fallbacks.

---

## Consequences & Trade-offs

### Positive
- **Guaranteed 60fps Performance**: Zero disk I/O blocking during drag, resize, and marquee select gestures.
- **Type Safety**: End-to-end TypeScript inference across all slice states and composite actions.
- **Time-Travel Snapshots**: Clean integration with `snapshot-slice.ts` for instant undo/redo functionality.

### Negative
- **Manual Hook Composition**: Developers must explicitly configure composite types in `editor-store.ts`.
- **Selector Discipline Required**: Omitting selectors in components can inadvertently trigger widespread re-renders.

---

## References & Code Artifacts
- Store Definition: [apps/web/src/store/editor-store.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/store/editor-store.ts)
- Slices Directory: [apps/web/src/store/slices/](file:///c:/Users/c/Desktop/motionslides/apps/web/src/store/slices/)
- Storage Adapter: [apps/web/src/lib/storage.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/storage.ts)
