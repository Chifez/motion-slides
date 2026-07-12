# Tailwind CSS v4 CSS-First Architecture

1. **The `@theme` Directive (CSS-First)**: Agents must NOT create or edit `tailwind.config.js`. All design tokens must be defined natively as CSS variables inside the `@theme` block in the main CSS file (`styles.css`).
2. **Native CSS Features**: Use Tailwind v4's native container queries (`@sm:`, `@md:`) and cascade layers (`@layer`) without relying on external plugins.
3. **Utility-First**: Style components using Tailwind classes. Do not use inline `style` objects unless animating high-frequency values (e.g., cursor coordinates, dragging offsets).
4. **No Dynamic Class Construction**: Avoid dynamic string interpolation for class names (e.g., `text-${color}-500`). The Tailwind Oxide engine needs to see the full class string to compile it. Use `clsx` or `tailwind-merge` (`cn()`) for conditional logic.
5. **No `@apply` for UI Components**: Use framework components (React) for reusability instead of extracting classes with `@apply`.
