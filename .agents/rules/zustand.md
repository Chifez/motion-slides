# Zustand Slice Architecture

1. **The Slice Pattern**: Never build a monolithic store. Global state must be modularized into domain-specific slices (e.g., `createProjectSlice`, `createAuthSlice`) and combined via a single bounded store (e.g., `editorStore`).
2. **Atomic Selectors**: ALWAYS use fine-grained selectors when reading state inside components:
   - ✅ `const activeProjectId = useEditorStore((s) => s.activeProjectId)`
   - ❌ `const { activeProjectId } = useEditorStore()` (This destructs the whole store and causes massive unnecessary re-renders).
   - Use `useShallow` when selecting multiple values.
3. **Actions as Events**: Define actions as business events (e.g., `addSlide`) rather than simple setters (`setSlides`). Keep actions encapsulated inside the store, not in UI components.
4. **Hydration Gating**: Before executing data fetching that depends on local state, ensure the store is fully hydrated by awaiting `storeHydrationPromise`.
