# ADR 002: FLIP-Based Magic Move & Spring Physics Animation Engine

## Status
**Accepted** (2026-08-18)

## Context & Problem Statement
MotionSlides delivers Apple Keynote-grade "Magic Move" transitions where elements seamlessly transform, morph, and reposition across slides. Unlike simple slide decks with static cut transitions or basic CSS fade effects, technical presentations need continuous spatial and relational continuity (e.g., an overview architecture box expanding into a subsystem container on the next slide).

We need an animation engine that:
1. Automatically identifies and pairs elements across adjacent slides even when user edits introduce subtle property changes.
2. Performs FLIP (First, Last, Invert, Play) transforms with sub-pixel precision across layout dimensions (x, y, width, height, opacity, rotation, color).
3. Applies physically realistic second-order differential spring physics for organic deceleration without rigid linear or cubic-bezier easing artifacts.
4. Performs intelligent code morphing (via tokenization and Longest Common Subsequence diffing) so unchanged code lines glide while mutated lines cascade in.

## Decision Drivers
- **Cinematic Fidelity**: Transitions must feel weighted, continuous, and physical.
- **Identity Heuristics**: Slide-to-slide morphing must work smoothly when element IDs match, and gracefully fallback using semantic similarity (Levenshtein label distance, shape type, spatial proximity).
- **Code Morphing Quality**: Source code transitions between slides must animate line-by-line using syntax tokenization rather than jarring block replacements.
- **Determinism**: The animation pipeline must be replayable deterministically for headless video/export capture.

## Decision Outcome
We adopted a hybrid **Framer Motion + Custom FLIP Heuristic Engine**:

1. **State-Based Diffing**: In `apps/web/src/lib/motion-engine.ts`, `getHeuristicMatchingMap` compares Slide $N$ and Slide $N+1$, categorizing elements into `updated`, `added`, `removed`, and `unchanged`.
2. **Semantic Similarity Fallback**: Elements without strict ID matches are scored using weighted heuristics:
   - Text/Label match via Levenshtein distance (Weight: 50)
   - Icon / Shape type match (Weight: 30)
   - Spatial proximity (Weight: 20)
3. **FLIP Projection**: Framer Motion's layout projection engine measures bounding box deltas and inverts them via hardware-accelerated transforms.
4. **Spring Physics**: All motion uses spring configurations (e.g., `type: 'spring', stiffness: 300, damping: 30, mass: 1`) rather than fixed duration linear curves.
5. **Code Morphing with Shiki & LCS**: `shiki-highlighter.ts` tokenizes code into syntax-highlighted spans. Diffing identifies invariant lines and animates them to their new line numbers, while additions and deletions stagger with calculated delays.

---

## Negative Space & Forbidden Alternatives

The following tools, paradigms, and patterns are **STRICTLY FORBIDDEN** in this repository:

| Forbidden Alternative | Reason for Rejection & Threat to Architecture |
| :--- | :--- |
| **CSS `@keyframes` / Transitions for Slide Changes** | Hardcoded CSS animations cannot perform dynamic bounding box delta inversion across arbitrary AST states. |
| **Linear / Fixed Easing (`ease-in-out`, `linear`)** | Mechanical, robotic motion that violates the core brand standard of Keynote-level physics. |
| **GSAP / Anime.js DOM Imperative Mutators** | Imperative animation engines bypass React 19's virtual DOM reconciliation and desynchronize AST state from the render tree. |
| **Hard-Cut DOM Replacements** | Swapping slide markup without FLIP delta calculation breaks visual continuity and causes harsh layout flashing. |
| **DOM Direct Mutations (`element.style.left = ...`)** | Bypasses Framer Motion's motion value pipeline, breaking interruptibility and video capture determinism. |

---

## Agent Guardrails (Automated Enforcement Rules)

AI Agents modifying this codebase must adhere to the following strict guardrails:

1. **Animate All Dimensional Changes**:
   - When modifying visual element properties (width, height, position, color, border radius), ensure the properties are mapped through Framer Motion motion props or FLIP delta handlers.
2. **Preserve Element IDs Across Slide Clones**:
   - Slide duplication or element copying tools MUST preserve or deterministically map the source `id` to enable Magic Move interpolation.
3. **Spring Over Easing**:
   - Always use physics-based spring definitions (`stiffness`, `damping`, `mass`). Never configure hardcoded `linear` transition easings for presentation elements.
4. **Code Morphing via Shiki Only**:
   - Code block rendering MUST use `Shiki` tokenization and the LCS diff pipeline. Never replace code blocks with raw unhighlighted `<pre>` tags or third-party highlight widgets (Prism/Highlight.js).

---

## Consequences & Trade-offs

### Positive
- **Exceptional Visual Polish**: Flawless, Keynote-grade animations between arbitrary presentation states.
- **Resilient Matching**: Gracefully preserves motion continuity even when slide elements undergo non-destructive refactoring.
- **Frame-Accurate Capture**: Compatible with the headless export server's virtual clock injection.

### Negative
- **Layout Measurement Overhead**: Initial slide change requires a layout measurement pass before the inversion animation triggers.

---

## References & Code Artifacts
- Motion Engine: [apps/web/src/lib/motion-engine.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/motion-engine.ts)
- Shared Motion Types: [apps/web/src/lib/motion-shared.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/motion-shared.ts)
- Syntax Highlighter: [apps/web/src/lib/shiki-highlighter.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/shiki-highlighter.ts)
