# MotionSlides — IDE Implementation Guide
## Codebase Improvement Plan (React 19 & Architecture)

This document is a step-by-step guide for applying the audit findings across the codebase.
Work through each phase in order — later phases depend on earlier ones being stable.

---

## Ground Rules (Apply to Every Change)

- **Never** refactor and fix a bug in the same commit. One concern per PR.
- **Never** use `useEditorStore()` without a selector unless you are explicitly destructuring a stable action (setters don't cause re-renders, state values do).
- **Never** call `useEditorStore.getState()` during render — only inside event handlers, effects, or Zustand middleware.
- **Always** verify a component's re-render behaviour in React DevTools Profiler before and after a selector refactor.
- **Always** run the full TypeScript check after each phase — do not leave type errors for later.

---

## Phase 1 — Selector Refactor (P0 · Do This First)

**Why first:** Every other improvement is undermined by god-subscriptions causing cascading re-renders. Fix the foundation before layering new patterns on top.

**Files to touch:**
- `CanvasElement.tsx`
- `CanvasStage.tsx`
- `EditorToolbar.tsx`

### Rule

Every `useEditorStore()` call that destructures more than one value must be split into targeted selectors **or** wrapped with `useShallow` if the values are genuinely always needed together.

```ts
// ❌ Never do this for state values
const { selectedElementIds, activeSlide, isPresenting, tool } = useEditorStore()

// ✅ Option A — targeted selectors (preferred, most granular)
const selectedElementIds = useEditorStore(s => s.selectedElementIds)
const tool = useEditorStore(s => s.tool)

// ✅ Option B — useShallow when values are always consumed together
import { useShallow } from 'zustand/react/shallow'
const { selectedElementIds, tool } = useEditorStore(
  useShallow(s => ({ selectedElementIds: s.selectedElementIds, tool: s.tool }))
)
```

### Actions (setters) are exempt

Zustand action references are stable — they do not cause re-renders. You may destructure multiple actions in one call.

```ts
// ✅ Fine — actions are stable references
const { setSelectedElement, deleteElement, duplicateElement } = useEditorStore()
```

### For `CanvasElement.tsx` specifically

This component renders once per element and is the most render-sensitive component in the codebase. Every selector here must be scoped to that element's ID:

```ts
// ❌ Subscribes to the entire elements map
const { elements } = useEditorStore()
const element = elements[props.id]

// ✅ Only re-renders when this specific element changes
const element = useEditorStore(s => s.elements[props.id])
```

---

## Phase 2 — Render-Time Store Update (P1) [PARTIALLY COMPLETED ✅]

**File:** `p.$projectId.tsx`

### The pattern to remove

```ts
// ❌ Updating the store during render — React will double-invoke this in StrictMode
const storeIsReadOnly = useEditorStore(s => s.isReadOnly)
if (storeIsReadOnly !== isReadOnly) {
  setReadOnly(isReadOnly)
}
```

### The fix

`isReadOnly` is derived from URL params and project data — it belongs in `useAccessControl`, not in the store. Components that need it should read from the hook directly. Do not sync derived values back into Zustand.

```ts
// In ProjectPageInner — remove the sync block entirely.
// Components that need isReadOnly should call useAccessControl() themselves,
// or receive it as a prop from ProjectPageInner.

// If a non-React context (e.g. a Zustand action) genuinely needs isReadOnly,
// pass it as an argument at the call site rather than storing it:
const { canEdit } = useAccessControl()
// ...
onSave={() => saveAction({ canEdit })}
```

### Checklist for this phase
- [x] Remove the `if (storeIsReadOnly !== isReadOnly) setReadOnly(isReadOnly)` block from `ProjectPageInner` (Moved to `useEffect` for stability)
- [ ] Remove `setReadOnly` from the store if it has no other callers
- [ ] Audit all components that currently read `isReadOnly` from the store — migrate them to `useAccessControl()`
- [x] Confirm no render-time store writes remain anywhere in the route tree
- [x] **CRITICAL:** Preserve the `project` guard in `useAccessControl` navigation effect to prevent hydration crashes.

---

## Phase 3 — React 19 Actions in Forms (P1)

**File:** `AuthModal.tsx`

### Pattern to remove

```ts
// ❌ Manual async state in forms
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try { ... } catch (err) { setError(...) } finally { setLoading(false) }
}
```

### The React 19 replacement

```ts
import { useActionState } from 'react'

// useActionState(action, initialState) — handles pending + error automatically
const [state, submitAction, isPending] = useActionState(
  async (prevState: FormState, formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    try {
      await signIn(email, password)
      return { error: null }
    } catch (err) {
      return { error: (err as Error).message }
    }
  },
  { error: null }
)
```

```tsx
// In JSX — use the native form action, no onSubmit handler needed
<form action={submitAction}>
  <input name="email" type="email" />
  <input name="password" type="password" />
  <SubmitButton />
  {state.error && <p>{state.error}</p>}
</form>

// Separate component reads isPending from context — no prop drilling
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>{pending ? 'Signing in...' : 'Sign In'}</button>
}
```

### Rules for this phase
- `useFormStatus` must be inside a child component of the `<form>` — it cannot be in the same component as the form itself.
- `useActionState` replaces `useState` for `loading` and `error` — remove both after migration.
- Do not mix the old `onSubmit` + `e.preventDefault()` pattern with the new `action` prop.

---

## Phase 4 — Remove Legacy `useEffect` Data Fetching (P2)

**File:** `useIconLibrary.ts`

### Pattern to remove

```ts
// ❌ Manual fetch in useEffect with manual cache
const [icons, setIcons] = useState(null)
const [loading, setLoading] = useState(false)
const cacheRef = useRef({})

useEffect(() => {
  if (cacheRef.current[query]) { setIcons(cacheRef.current[query]); return }
  setLoading(true)
  fetch(`/api/icons?q=${query}`)
    .then(r => r.json())
    .then(data => { cacheRef.current[query] = data; setIcons(data) })
    .finally(() => setLoading(false))
}, [query])
```

### Preferred fix — TanStack Query (already in the project)

```ts
import { useQuery } from '@tanstack/react-query'

export function useIconLibrary(query: string) {
  return useQuery({
    queryKey: ['icons', query],
    queryFn: () => fetch(`/api/icons?q=${query}`).then(r => r.json()),
    staleTime: 1000 * 60 * 10, // icons don't change — cache aggressively
  })
}
```

TanStack Query gives you caching, deduplication, background refetch, and loading/error states for free. Remove the manual `useRef` cache — it's now redundant.

### Alternative — React 19 `use()` for simple one-shot fetches

Only use this pattern for data that is fetched once and never refetched (e.g. static config):

```ts
// Create the promise outside the component (module scope or passed as prop)
const iconsPromise = fetch('/api/icons').then(r => r.json())

function IconPicker() {
  const icons = use(iconsPromise) // Suspense-compatible
  // ...
}
```

---

## Phase 5 — Architecture Patterns (Senior Improvements)

These do not fix bugs — they reduce complexity and make the codebase extensible. Do these last, one component at a time.

---

### 5A — Registry Pattern for `InspectorPanel.tsx`

Replace long `if/else` or `switch` blocks with a component registry. New element types become a one-line addition.

```ts
// registry.ts — add new types here, never touch InspectorPanel again
const INSPECTOR_SECTIONS: Record<string, React.ComponentType<SectionProps>> = {
  text: TextSection,
  code: CodeSection,
  shape: ShapeSection,
  image: ImageSection,
}

// InspectorPanel.tsx
const Section = INSPECTOR_SECTIONS[element.type]
if (!Section) return <UnsupportedElementSection />
return <Section content={element.content} onUpdate={update} />
```

**Do not** put the registry map inline in `InspectorPanel.tsx` — keep it in a separate `registry.ts` file so it can be imported independently for testing.

---

### 5B — Headless Hook for `ShareMenu.tsx`

Extract the state machine logic out of the component into a `useShareMenu(project)` hook. The component becomes pure UI.

```ts
// useShareMenu.ts — owns all logic
export function useShareMenu(project: Project) {
  const isSyncing = useEditorStore(s => s.isSyncing)
  const updateProject = useEditorStore(s => s.updateProject)

  const shareState: ShareState = !project.synced
    ? { status: 'unsynced' }
    : isSyncing
      ? { status: 'syncing' }
      : { status: project.visibility }

  const copyLink = async (type: 'edit' | 'view') => { ... }
  const toggleSharing = () => { ... }
  const toggleCollaborative = () => { ... }
  const rotateKey = async () => { ... }

  return { shareState, copyLink, toggleSharing, toggleCollaborative, rotateKey }
}

// ShareMenu.tsx — owns only Framer Motion and JSX
export function ShareMenu({ project }: Props) {
  const { shareState, copyLink, toggleSharing, ... } = useShareMenu(project)
  // pure render — no logic
}
```

> [!IMPORTANT]
> **Logic Preservation**: When refactoring to a headless hook, you **MUST** preserve the `syncProjects()` calls in `toggleSharing`, `toggleCollaborative`, and `rotateKey`. These were added to resolve a critical race condition.

---

### 5C — Fix `getState()` During Render in `PresentationOverlay.tsx`

```ts
// ❌ Non-reactive — won't update when transitions change
const transitions = useEditorStore.getState().getPlaybackTransitions()

// ✅ Reactive selector
const transitions = useEditorStore(s => s.getPlaybackTransitions())

// Or extract into a custom hook if used in multiple places
export function useProjectTransitions() {
  return useEditorStore(s => s.getPlaybackTransitions())
}
```

---

### 5D — Compound Components for `AIChat`

Only do this if `AIChat` currently passes more than ~5 props between sub-components or has prop drilling more than 2 levels deep. If not, skip — compound components add indirection that isn't always worth it.

```tsx
// Instead of <AIChat messages={...} onSend={...} isLoading={...} inputValue={...} ... />
<AIChat>
  <AIChat.MessageList />
  <AIChat.Input />
  <AIChat.StatusBar />
</AIChat>
```

Use a React context inside `AIChat` to share state between sub-components without props.

---

## Execution Order Summary

```
Phase 1 — Selector refactor         (CanvasElement, CanvasStage, EditorToolbar)
    ↓
Phase 2 — Remove render-time writes  (p.$projectId.tsx)
    ↓
Phase 3 — React 19 Actions           (AuthModal.tsx)
    ↓
Phase 4 — Remove useEffect fetching  (useIconLibrary.ts)
    ↓
Phase 5A — Registry pattern          (InspectorPanel.tsx)
Phase 5B — Headless hook             (ShareMenu.tsx)
Phase 5C — Reactive getState fix     (PresentationOverlay.tsx)
Phase 5D — Compound components       (AIChat — optional)
```

Phases 5A–5D can be done in parallel since they touch different files.

---

## What Not to Do

- **Do not** jump to Phase 5 before Phase 1 — architectural improvements on top of broken selectors just move the performance problem around.
- **Do not** use `useActionState` for non-form async flows (data fetching, editor saves) — it is designed for form submissions only.
- **Do not** replace `useEffect` fetching with `use(promise)` for data that needs to be refetched — use TanStack Query instead.
- **Do not** add Compound Component pattern to components that don't have prop drilling — it adds complexity without benefit.
- **Do not** leave `useEditorStore.getState()` calls in render paths — they are non-reactive and will cause stale UI bugs that are very hard to trace.