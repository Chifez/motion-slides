---
trigger: always_on
---

# Exhaustive React & React 19 Architecture Rules

These rules define the senior-level standard for writing React code in this codebase.

## 1. The Strict Rules of `useEffect`
`useEffect` is the most abused hook in React. You must follow these rules strictly:
- **Never use `useEffect` for derived state.** If a value can be calculated from existing props or state, calculate it during render.
  - ❌ `useEffect(() => { setFullName(first + last) }, [first, last])`
  - ✅ `const fullName = first + last;`
- **Never use `useEffect` for user events.** If an action happens because of a user interaction (e.g., clicking a button, submitting a form), handle it in the event handler, NOT in an effect.
- **Always handle race conditions in async effects.** If an effect fetches data, you MUST use an AbortController or a boolean flag (`let ignore = false`) in the cleanup function to prevent stale data overwrites.
- **Return explicit cleanups.** If an effect sets up a subscription, timer, or event listener, it MUST return a cleanup function.
- **Check for better alternatives**: before using useEffect for any implement, always explore industry standard for that usecase and check if there is a better alternative.

## 2. Server vs. Client Boundaries
- Assume all components are Server Components by default unless they require client-side interactivity (state, effects, event listeners).
- Push the `"use client"` directive as far down the component tree as possible (to the leaf nodes). Do not put `"use client"` at the top of a massive layout component.

## 3. Compound Components over Prop Drilling
For complex UI elements (Dropdowns, Modals, Tables), use the Compound Component pattern to prevent massive prop interfaces and "prop drilling hell."
```tsx
// ❌ Avoid massive prop configurations
<Menu items={items} onSelect={handleSelect} isOpen={isOpen} direction="down" />

// ✅ Use Compound Components
<Menu.Root>
  <Menu.Trigger>Open</Menu.Trigger>
  <Menu.Content>
    <Menu.Item onSelect={handleSelect}>Action</Menu.Item>
  </Menu.Content>
</Menu.Root>
```

## 4. Performance Boundaries & The `children` Prop
If a component manages heavy state that changes frequently, it will re-render its entire subtree. To prevent this, pass static child components via the `children` prop. React knows not to re-render `children` if their references haven't changed.

## 5. Custom Hooks Architecture
- Never write massive blocks of inline logic inside a component body.
- Extract complex business flows, data fetching, and state management into tightly focused custom hooks (e.g., `useExportPipeline()`, `useCanvasZoom()`).
- Custom hooks should return an array `[value, setter]` ONLY if returning exactly two items (like `useState`). Otherwise, return an object `{ data, isLoading, error }` for scalability.

## 6. React 19 Specifics
- **Trust the React Compiler:** Do NOT use manual memoization (`useMemo`, `useCallback`, `React.memo`) unless fixing a specific, rare edge case. The React Compiler handles this automatically.
- **Actions for Mutations:** Use async functions (Actions) combined with `useActionState` and `<form action={fn}>` for data mutations instead of manual `useState` toggles (`setLoading(true)`).
- **The `use` Hook:** Use the `use` hook to read Promises or Context directly in render logic instead of chaining complex `useEffect` logic.
- **Document Metadata:** Use `<title>`, `<meta>`, and `<link>` directly within components. Do not use external helmet libraries.

## 7. Component Definitions & Types
- Use standard function declarations. NEVER use `React.FC` or `React.FunctionComponent`.
- Use Named Exports over Default Exports to ensure consistent naming across the codebase.
- Explicitly type the `children` prop using `React.ReactNode`.
