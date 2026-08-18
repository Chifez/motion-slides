# ADR 007: Tailwind CSS v4 CSS-First Styling Architecture

## Status
**Accepted** (2026-08-18)

## Context & Problem Statement
MotionSlides requires a high-performance design system supporting dark/light mode themes, responsive viewports, custom typography scales, canvas overlays, and rapid UI development without runtime CSS overhead or configuration drift.

We need a styling architecture that:
1. Embraces the modern **Tailwind CSS v4 CSS-First engine** without legacy JavaScript config files (`tailwind.config.js`).
2. Declares all design tokens natively using `@theme` and CSS variables in standard stylesheets.
3. Leverages native CSS container queries and cascade layers.
4. Prevents CSS runtime injection bloat (from CSS-in-JS libraries) and prevents broken styles caused by dynamic class interpolation.

## Decision Drivers
- **Zero-Runtime Overhead**: Eliminate runtime style calculation and CSS injection delays.
- **Single Source of Truth**: Define color tokens, typography, radii, and z-index layers in pure CSS.
- **Oxide Engine Compatibility**: Ensure all utility classes are statically detectable by the Tailwind v4 compiler.
- **Component Portability**: Use React component composition for styling abstractions rather than brittle `@apply` rules.

## Decision Outcome
We adopted **Tailwind CSS v4 CSS-First Architecture**:

1. **CSS-First Design Tokens (`apps/web/src/styles.css`)**:
   - All theme tokens (colors, font families, dark mode variables, timeline waveforms, z-index layers) are declared in `styles.css` using `@theme` and `:root` / `.dark` blocks.
   - No `tailwind.config.js` or `tailwind.config.ts` exists in the repository.
2. **Utility Class Application**:
   - UI components use Tailwind utility classes directly in JSX `className` props.
3. **Class Merging via `cn()`**:
   - Conditional styling and class merging use `clsx` and `tailwind-merge` (`apps/web/src/lib/utils.ts`).
4. **Isolated High-Frequency Inline Styles**:
   - Inline `style` objects are restricted strictly to continuous, high-frequency coordinate transforms (e.g., mouse dragging offsets, cursor coordinates, canvas pan/zoom transforms).

---

## Negative Space & Forbidden Alternatives

The following tools, paradigms, and patterns are **STRICTLY FORBIDDEN** in this repository:

| Forbidden Alternative | Reason for Rejection & Threat to Architecture |
| :--- | :--- |
| **`tailwind.config.js` / `tailwind.config.ts`** | Tailwind v4 uses CSS-first configuration. Creating JS configs causes build warnings, configuration splits, and breaks `@theme` token resolution. |
| **CSS-in-JS (styled-components, Emotion, Stitches)** | Runtime CSS insertion degrades frame rates during continuous canvas manipulation and breaks React 19 Server Components. |
| **Dynamic Class Interpolation (e.g. ``text-${color}-500``)** | The Tailwind Oxide scanner cannot detect dynamically constructed string classes at build time, resulting in ungenerated styles and broken UI. |
| **`@apply` for UI Component Extraction** | Creates bloated monolithic CSS files and defeats the purpose of React component encapsulation. |
| **Inline Styles for Static Layouts** | Bypasses design token constraints and theme variables; breaks responsive utility classes. |

---

## Agent Guardrails (Automated Enforcement Rules)

AI Agents modifying this codebase must adhere to the following strict guardrails:

1. **Never Create or Modify `tailwind.config.js`**:
   - All theme variables and tokens MUST be added to `apps/web/src/styles.css` inside `@theme` or `:root`/`.dark`.
2. **No Dynamic Class String Interpolation**:
   - ❌ `<div className={`p-4 bg-${themeColor}-100`} />`
   - ✅ `<div className={cn('p-4', themeColor === 'blue' ? 'bg-blue-100' : 'bg-zinc-100')} />`
   - Alternatively, map allowed variants via a static lookup record: `const COLOR_MAP = { blue: 'bg-blue-100', red: 'bg-red-100' }`.
3. **Use the `cn()` Utility for Conditional Classes**:
   - Always combine dynamic classes using `cn(...)` from `apps/web/src/lib/utils.ts`.
4. **Reserve Inline Styles Strictly for Fast Transforms**:
   - Inline `style={{ transform: ... }}` is ONLY permitted for canvas coordinates, pan/zoom scale, and real-time cursor tracking.

---

## Consequences & Trade-offs

### Positive
- **Instant HMR & Fast Builds**: Tailwind v4 Oxide compiler processes stylesheets in microseconds.
- **Clean Theme Management**: CSS variables provide instant theme switching without component re-renders.
- **Consistent Design Tokens**: Centralized token definitions in `styles.css`.

### Negative
- **Static Class Requirement**: Must maintain explicit class maps when rendering dynamic user-selected colors.

---

## References & Code Artifacts
- Main CSS Stylesheet: [apps/web/src/styles.css](file:///c:/Users/c/Desktop/motionslides/apps/web/src/styles.css)
- Utility Helper (`cn`): [apps/web/src/lib/utils.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/utils.ts)
- Vite Tailwind Plugin: [apps/web/package.json](file:///c:/Users/c/Desktop/motionslides/apps/web/package.json)
