# Architecture Decision Records (ADRs)

This directory contains the authoritative Architecture Decision Records (ADRs) for the **MotionSlides** repository. Each record documents the context, decision outcome, "Negative Space" (strictly forbidden alternatives and anti-patterns), and automated "Agent Guardrails" for AI agents and developers.

## ADR Index

| ADR | Title | Status | Date | Primary Domain |
| :--- | :--- | :--- | :--- | :--- |
| [ADR-0001](./0001-zustand-slice-architecture-with-indexeddb-persistence.md) | Zustand Slice Architecture with Debounced IndexedDB Persistence | **Accepted** | 2026-08-18 | State Management |
| [ADR-0002](./0002-flip-based-magic-move-and-spring-motion-engine.md) | FLIP-Based Magic Move & Spring Physics Animation Engine | **Accepted** | 2026-08-18 | Motion & Animation |
| [ADR-0003](./0003-ai-sdk-v6-streaming-agentic-loop-and-ast-mutations.md) | AI SDK v6 Streaming Cognitive Loop & AST Mutation Architecture | **Accepted** | 2026-08-18 | AI & Agent Dispatch |
| [ADR-0004](./0004-compound-dagre-diagramming-and-16-9-viewport-normalization.md) | Compound Dagre Constraint-Based Diagramming & 16:9 Viewport Normalization | **Accepted** | 2026-08-18 | Diagramming Engine |
| [ADR-0005](./0005-tanstack-start-ssr-server-functions-and-type-safe-routing.md) | TanStack Start SSR & Nitro Server Functions with Zod Contracts | **Accepted** | 2026-08-18 | Full-Stack & Routing |
| [ADR-0006](./0006-headless-frame-pipelining-and-deterministic-video-synthesis.md) | Headless Frame Pipelining & Deterministic Video Synthesis | **Accepted** | 2026-08-18 | Video Export Server |
| [ADR-0007](./0007-tailwind-css-v4-css-first-styling-architecture.md) | Tailwind CSS v4 CSS-First Styling Architecture | **Accepted** | 2026-08-18 | Styling & Themes |

---

## Negative Space & Guardrail Matrix

| Domain | Allowed Architecture | Strictly Forbidden (Negative Space) |
| :--- | :--- | :--- |
| **State** | Zustand modular slices + `idb-keyval` debounced persistence | Redux, Jotai, Recoil, MobX, synchronous `localStorage`, monolithic store files, whole-store destructuring |
| **Animation** | Framer Motion + Spring Physics + FLIP delta inversion + Shiki code morph | CSS `@keyframes` for slide transitions, linear/cubic-bezier easing, GSAP/Anime.js direct DOM mutators |
| **AI Studio** | Vercel AI SDK v6 + Client tool interceptor + Snapshot time-travel undo | LangChain, unvalidated string output parsing, direct DOM mutation by AI, tool mutation without snapshot push |
| **Diagrams** | Compound Dagre (`compound: true`) + 16:9 isotropic viewport normalization | Infinite unbounded canvas coords, Mermaid/Graphviz runtime SVG injections, hardcoded pixel coordinates, unanchored lines |
| **Routing & SSR** | TanStack Start + Nitro + `createFileRoute` + `createServerFn` + Zod | Next.js App Router (`next/navigation`), `useEffect` for data fetching, raw unvalidated search params, vanilla `<a>` navigation |
| **Video Export** | Puppeteer virtual clock + direct stdin buffer stream into FFmpeg + BullMQ | Client-side `canvas.captureStream()`, writing intermediate frames to disk, running Puppeteer inside `apps/web` |
| **Styling** | Tailwind CSS v4 `@theme` in `styles.css` + CSS variables + `cn()` | `tailwind.config.js`, CSS-in-JS (styled-components, Emotion), dynamic class interpolation (``bg-${color}-500``), `@apply` |

---

## Automated Verification & Compliance

All pull requests, tool actions, and code generation routines are audited against these ADRs by:
1. **Auditor Agent**: `.agents/agents/adr-compliance-agent.md`
2. **Verification Skill**: `.agents/skills/verify-adr.md` (`.agents/skills/verify-adr/SKILL.md`)
3. **Execution Hook**: `.agents/hooks.json` & `.agents/scripts/verify-adr.js`
