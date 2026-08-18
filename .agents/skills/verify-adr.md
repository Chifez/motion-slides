---
name: verify-adr
description: Evaluates code modifications, git diffs, and staged changes against architectural decision records in docs/adr/ and halts execution with an error report if forbidden patterns or unapproved libraries are detected.
---

# Verify ADR Architectural Guardrail Skill

Use this skill whenever you are auditing code changes, reviewing pull requests, or verifying modifications before committing code or generating final artifacts.

This skill indexes all Architectural Decision Records in `docs/adr/` and performs a comprehensive static scan to verify compliance with repository standards.

---

## 1. Index of Repository ADRs

The skill validates against the following 7 authoritative decision records:

1. **[ADR-0001: Zustand Slice Architecture](file:///c:/Users/c/Desktop/motionslides/docs/adr/0001-zustand-slice-architecture-with-indexeddb-persistence.md)**
   - **Allowed**: Modular slices in `apps/web/src/store/slices/`, atomic selectors `useEditorStore((s) => s.prop)`, `useShallow`, debounced IndexedDB persistence.
   - **Forbidden**: Redux, Jotai, Recoil, MobX, synchronous `localStorage`, monolithic store files, whole-store destructuring `const { ... } = useEditorStore()`.

2. **[ADR-0002: FLIP-Based Magic Move & Spring Motion](file:///c:/Users/c/Desktop/motionslides/docs/adr/0002-flip-based-magic-move-and-spring-motion-engine.md)**
   - **Allowed**: Framer Motion layout projections, second-order spring physics (`stiffness`, `damping`), Levenshtein heuristic ID matching, Shiki + LCS code morphing.
   - **Forbidden**: Raw CSS `@keyframes` on slide transitions, linear/cubic-bezier easing for presentations, GSAP/Anime.js direct DOM mutators.

3. **[ADR-0003: AI SDK v6 Streaming Cognitive Loop](file:///c:/Users/c/Desktop/motionslides/docs/adr/0003-ai-sdk-v6-streaming-agentic-loop-and-ast-mutations.md)**
   - **Allowed**: Vercel AI SDK v6 (`ai`, `@ai-sdk/*`), `streamText` with `stopWhen`, client-side tool dispatch, mandatory `pushSnapshot()` time-travel undo capture, Zod `inputSchema`.
   - **Forbidden**: LangChain, direct DOM mutations by AI, unvalidated string response parsing, AI tools mutating state without time-travel snapshot capture.

4. **[ADR-0004: Compound Dagre Diagramming](file:///c:/Users/c/Desktop/motionslides/docs/adr/0004-compound-dagre-diagramming-and-16-9-viewport-normalization.md)**
   - **Allowed**: Compound Dagre graph layouts (`compound: true`), 16:9 isotropic viewport normalization ($1280 \times 720$), port-mapped Bezier connectors (`perfect-arrows`).
   - **Forbidden**: Infinite unbounded canvas coords, Mermaid/Graphviz runtime SVG injections, hardcoded pixel coordinates, unanchored lines bypassing port handles.

5. **[ADR-0005: TanStack Start SSR & Server Functions](file:///c:/Users/c/Desktop/motionslides/docs/adr/0005-tanstack-start-ssr-server-functions-and-type-safe-routing.md)**
   - **Allowed**: TanStack Start / Router (`createFileRoute`), Server Functions (`createServerFn`) with Zod `inputValidator`, search validation via `validateSearch`, `<Link>`.
   - **Forbidden**: Next.js App Router (`next/router`, `next/navigation`, `app/` directory), `useEffect` for data fetching, raw unvalidated search params, vanilla `<a>` navigation.

6. **[ADR-0006: Headless Frame Pipelining](file:///c:/Users/c/Desktop/motionslides/docs/adr/0006-headless-frame-pipelining-and-deterministic-video-synthesis.md)**
   - **Allowed**: Dedicated microservice in `apps/export-server`, Puppeteer virtual clock, piping raw frame buffers directly to FFmpeg `stdin`, BullMQ + Redis queue.
   - **Forbidden**: Client-side `canvas.captureStream()` video export, writing intermediate frame files to disk, running Puppeteer inside `apps/web`.

7. **[ADR-0007: Tailwind CSS v4 CSS-First Styling](file:///c:/Users/c/Desktop/motionslides/docs/adr/0007-tailwind-css-v4-css-first-styling-architecture.md)**
   - **Allowed**: `@theme` block in `apps/web/src/styles.css`, CSS variables, container queries, `cn()` utility (`clsx` + `tailwind-merge`).
   - **Forbidden**: Creating/editing `tailwind.config.js` or `tailwind.config.ts`, CSS-in-JS (styled-components, Emotion), dynamic class string interpolation (``text-${color}-500``), `@apply` UI component extraction.

---

## 2. Verification Procedure

Follow this strict step-by-step verification process:

### Step 1: Extract Changes
Identify all modified, added, or staged files. If evaluating a git commit or diff, run:
```bash
git diff --name-only HEAD
```

### Step 2: Negative Space Pattern Scanning
Scan modified files for forbidden imports and syntax anti-patterns using grep or file analysis:

| Pattern to Search | Forbidden Under | Remediation |
| :--- | :--- | :--- |
| `from 'redux'` / `from '@reduxjs/toolkit'` | ADR-0001 | Use Zustand slice in `apps/web/src/store/slices/` |
| `from 'jotai'` / `from 'recoil'` / `from 'mobx'` | ADR-0001 | Use Zustand store `useEditorStore` |
| `const {.*} = useEditorStore()` | ADR-0001 | Use atomic selector: `useEditorStore((s) => s.field)` |
| `from 'langchain'` / `from '@langchain/'` | ADR-0003 | Use Vercel AI SDK (`ai`, `@ai-sdk/*`) |
| `from 'next/'` (e.g. `next/navigation`, `next/router`) | ADR-0005 | Use TanStack Router (`@tanstack/react-router`) |
| `tailwind.config.js` or `tailwind.config.ts` | ADR-0007 | Delete file; define tokens in `apps/web/src/styles.css` `@theme` |
| `from 'styled-components'` / `from '@emotion/'` | ADR-0007 | Use Tailwind CSS utility classes |
| `canvas.captureStream` | ADR-0006 | Delegate export jobs to `apps/export-server` |

### Step 3: Evaluation & Halting Decision
- **If any violation is detected**:
  1. **HALT EXECUTION IMMEDIATELY**.
  2. Do not proceed to git commit, artifact finalization, or merging.
  3. Output a detailed **Architectural Violation Report** detailing the file path, line number, violated ADR, and exact fix required.
- **If all checks pass**:
  1. Output a **Verification PASSED** summary and proceed with the workflow.
