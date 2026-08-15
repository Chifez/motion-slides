# Case Study: MotionSlides — The "Cursor for Presentations & Motion Design"
## Architectural Design System, Cognitive Execution Loops & Autonomous Diagram Engine

---

## Executive Summary

**MotionSlides** is an AI-first presentation and motion design platform built on the premise that technical visual design should operate like modern AI-driven software development environments (such as Cursor or VS Code). 

Instead of treating AI as an external sidebar assistant that generates static templates, MotionSlides implements an **Agent-First Architecture**:
- The **AI Agent is the primary operational driver**, possessing direct read/write access to the application's Abstract Syntax Tree (Scene Graph), layout algorithms, motion timeline, and Git history.
- The **Canvas serves as a live, reactive stage**, offering instant visual feedback, animated state transitions, and tactile direct-manipulation overrides whenever manual control is preferred.
- Users can upload documents (PDFs, Markdown, OpenAPI/Swagger specifications, Codebase manifests) or prompt in natural language, and the Agent autonomously creates, refactors, themes, choreographs, branches, and renders multi-slide animated decks.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 USER PROMPT / DOCUMENT                                 │
│  "Synthesize our media upload architecture into a 4-slide pitch deck with AWS icons,   │
│   dark-indigo styling, and animated Magic Move transitions"                             │
└────────────────────────────────────────────┬────────────────────────────────────────────┘
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AGENTIC COGNITIVE & EXECUTION LOOP                            │
│                                                                                         │
│   ┌───────────────────────────┐      ┌─────────────────────────┐                        │
│   │ 1. State Inspection       │ ───► │ 2. Reasoning & Planning │                        │
│   │ (Deck Context, AST, Diff) │      │ (Multi-step tool chain) │                        │
│   └───────────────────────────┘      └────────────┬────────────┘                        │
│                                                   ▼                                     │
│   ┌───────────────────────────┐      ┌─────────────────────────┐                        │
│   │ 4. Snapshot & Undo Marker │ ◄─── │ 3. Tool Dispatch Engine │                        │
│   │ (Time-travel state push)  │      │ (AI SDK v6 onToolCall)  │                        │
│   └─────────────┬─────────────┘      └─────────────────────────┘                        │
└─────────────────┼───────────────────────────────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION AST / SCENE GRAPH MUTATION                        │
│                                                                                         │
│   ┌───────────────────────────┐      ┌─────────────────────────┐                        │
│   │ Compound Dagre Layout     │ ───► │ Fixed 16:9 Normalizer   │                        │
│   │ (VPCs, Subnets, Tiers)    │      │ (1280x720 Scale/Center) │                        │
│   └───────────────────────────┘      └────────────┬────────────┘                        │
│                                                   ▼                                     │
│   ┌───────────────────────────┐      ┌─────────────────────────┐                        │
│   │ Icon & Theme Resolver     │ ◄─── │ Port-Mapped Connectors  │                        │
│   │ (AWS SVGs, Contrast Calc) │      │ (Bezier Rounded Elbows) │                        │
│   └─────────────┬─────────────┘      └─────────────────────────┘                        │
└─────────────────┼───────────────────────────────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    REACTIVE CANVAS & FRAMER MOTION RENDERING STAGE                      │
│                                                                                         │
│   • Live Reactive Canvas Update   • Magic Move Morphing across slides                   │
│   • Staggered Flow Animations     • Visual Review & Direct-Manipulation Overrides       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. The Abstract Syntax Tree (Scene Graph Data Model)

At the heart of MotionSlides is a strictly typed, immutable Scene Graph stored in Zustand with IndexedDB persistence. Every entity on every slide is a serializable AST node.

### 1.1 Core Entity Hierarchy
```typescript
interface Project {
  id: string
  name: string
  slides: Slide[]
  transitions: SlideTransition[]
  activeBranch?: string
  updatedAt: number
}

interface Slide {
  id: string
  name: string
  background: string
  elements: SceneElement[]
  speakerNotes?: string
}

interface SceneElement {
  id: string                    // Stable unique identifier (critical for Magic Move)
  type: 'text' | 'shape' | 'section' | 'line' | 'code' | 'audio'
  diagramGroupId?: string       // Groups related nodes into an atomic diagram cluster
  position: { x: number; y: number }
  size: { width: number; height: number }
  rotation: number
  opacity: number
  zIndex: number
  animation: AnimationType      // 'fade-in' | 'slide-up' | 'slide-left' | 'draw' | 'pop' | 'none'
  animationDelay: number        // Seconds (for sequential flow choreography)
  content: TextContent | ShapeContent | SectionContent | LineContent | CodeContent
}
```

### 1.2 Relational Connectors & Connection Ports
Connectors are dynamic relational edges bound to specific ports on source and target elements:
```typescript
interface LineContent {
  lineType: 'elbow' | 'straight' | 'curved' | 'branching'
  style: 'solid' | 'dashed' | 'dotted'
  arrow: 'none' | 'end' | 'both'
  color: string
  strokeWidth: number
  label?: string
  startConnection?: { elementId: string; handleId: 'top' | 'right' | 'bottom' | 'left' }
  endConnection?: { elementId: string; handleId: 'top' | 'right' | 'bottom' | 'left' }
}
```

When elements move or re-layout, the `recalcLinesOnSlide` engine automatically computes the new bounding box and relative $[0..1]$ endpoints, updating the Bezier curve paths in real time.

---

## 2. The Slide & Architectural Diagram Generation Algorithm

Unlike generic drawing tools where elements are placed at arbitrary coordinates, MotionSlides uses a multi-stage **Constraint-Based Compilation Pipeline**:

```
Semantic Specification ──► Compound Graph ──► Dagre Layout ──► Viewport Fit ──► Port Mapping ──► Scene Elements
```

### Stage 1: Document Parsing & Semantic Entity Extraction
When the user uploads a document (Markdown, PDF, OpenAPI YAML, or Codebase), the ingestion parser chunks the document into narrative tiers:
1. **Executive / Problem Statement** $\rightarrow$ Hero Title Blueprint
2. **System Topology & Overview** $\rightarrow$ Tiered Architecture Blueprint
3. **Ingestion & Data Pipeline** $\rightarrow$ Linear Flow Blueprint
4. **Microservices & Compute** $\rightarrow$ Mesh Blueprint
5. **Storage & Security** $\rightarrow$ Database Tier Blueprint

### Stage 2: Compound Graph Construction (Dagre Hierarchy)
The engine constructs a compound graph `new dagre.graphlib.Graph({ compound: true })`:
- **Nodes**: Sized cleanly (default: $140\text{px} \times 80\text{px}$).
- **Layers & Sections**: Registered as parent container nodes (e.g. `VPC`, `Public Subnet`, `Data Layer`).
- **Hierarchy Mapping**: Child nodes are bound to parents via `g.setParent(childId, layerId)`.
- **Directionality**: Configured via `rankdir` (`'LR'` for pipelines, `'TB'` for tiered systems).

### Stage 3: Fixed 16:9 Viewport Normalization (The Slide-Fit Algorithm)
Because presentations render on a fixed 16:9 canvas ($1280 \times 720\text{px}$) rather than an infinite whiteboard:
1. The engine calculates the layout bounding box:
   $$W_{\text{graph}} = \max_{i}(x_i + w_i) - \min_{i}(x_i), \quad H_{\text{graph}} = \max_{i}(y_i + h_i) - \min_{i}(y_i)$$
2. Given safe padding ($P_x = 80\text{px}, P_y = 80\text{px}$), the target viewport is:
   $$W_{\text{target}} = 1280 - 2P_x = 1120\text{px}, \quad H_{\text{target}} = 720 - 2P_y = 560\text{px}$$
3. An isotropic scale factor is computed:
   $$S = \min\left(1.0, \frac{W_{\text{target}}}{W_{\text{graph}}}, \frac{H_{\text{target}}}{H_{\text{graph}}}\right)$$
4. Translation offsets center the graph perfectly:
   $$O_x = P_x + \frac{W_{\text{target}} - (W_{\text{graph}} \cdot S)}{2} - (\min X \cdot S)$$
   $$O_y = P_y + \frac{H_{\text{target}} - (H_{\text{graph}} \cdot S)}{2} - (\min Y \cdot S)$$
5. Every element's final position is mapped as:
   $$x_{\text{final}} = \text{round}(x_{\text{dagre}} \cdot S + O_x), \quad y_{\text{final}} = \text{round}(y_{\text{dagre}} \cdot S + O_y)$$

### Stage 4: Container Geometry & Background Boundaries
For every layer/container, the engine calculates the bounding box of its transformed children, adds $24\text{px}$ internal padding and $16\text{px}$ header room, and generates a background `section` element placed at `zIndex: 1` with translucent fill (`rgba(255,255,255,0.03)`).

### Stage 5: Cloud Icon Auto-Resolution
The engine passes labels and shape types through `icon-resolver.ts`. A node labeled `"Raw Video S3"` automatically binds to `/public/icons/aws/.../Arch_Amazon-S3_32.svg`, rendering a cloud service badge.

---

## 3. The Agent Tool Calling & Execution Pipeline (AI SDK v6)

MotionSlides leverages the latest Vercel AI SDK v6 architecture for streaming multi-step agentic execution.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVER SIDE (routes/api/chat.ts)                                            │
│ • System Prompt with Domain Guidelines & AST Rules                          │
│ • Multi-Provider Model Resolver (GPT-4o, Claude 3.5 Sonnet, Local Ollama)   │
│ • Tool Schemas defined with inputSchema: z.object(...)                      │
│ • streamText with stopWhen: stepCountIs(5) for autonomous tool loops        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP Stream (toUIMessageStreamResponse)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLIENT SIDE (components/editor/ai-chat.tsx)                                 │
│ • useChat with sendAutomaticallyWhen: lastAssistantMessage...               │
│ • onToolCall interceptor with normalized payload extraction:                │
│     toolArgs = toolCall.input ?? toolCall.args                              │
│ • Time-Travel Snapshot Marker (pushSnapshot)                                │
│ • Approval Gate Interceptor for destructive operations                      │
│ • Domain Tool Dispatcher (executeAgentTool)                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DOMAIN TOOL EXECUTORS (lib/agent/tools/)                                    │
│ • slide-tools.ts: Slide CRUD, deck context, background color & gradients    │
│ • element-tools.ts: Text CRUD, matchText editing, contrast-safe colors      │
│ • diagram-tools.ts: Compound Dagre layout, patchDiagram, auto-positioning   │
│ • animation-tools.ts: Entrance animations, flow sequencing, transitions     │
│ • theme-tools.ts: Deck-wide theme harmonization, typography scales          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Time-Travel Snapshot & Instant Undo Engine
Before executing any tool call, the client automatically pushes an immutable snapshot to `snapshot-slice.ts`. Every assistant message in the chat thread displays an inline **"Undo this action"** button, allowing users to roll back the exact AST state without page reloads.

### 3.2 Non-Destructive Incremental Graph Diffing (`patchDiagram`)
When editing existing diagrams, the Agent uses `patchDiagram`:
1. Reads existing nodes, IDs, and edges from `getSlideContext`.
2. Computes the graph delta ($\Delta_{\text{addNodes}}, \Delta_{\text{removeNodes}}, \Delta_{\text{rewireEdges}}$).
3. Preserves all stable entity IDs.
4. Executes incremental Dagre layout, triggering Framer Motion layout animations so existing boxes slide smoothly into their updated positions.

---

## 4. The Motion Engine & Magic Move Morphing

MotionSlides' signature differentiator is **cinematic presentation motion**:

### 4.1 Magic Move Across Slides
When two adjacent slides contain elements with identical `id` strings (e.g. `id: 'auth-gateway'`):
1. The motion stage calculates the bounding box delta ($\Delta x, \Delta y, \Delta w, \Delta h, \Delta \theta, \Delta \text{opacity}$).
2. Framer Motion smoothly interpolates the element from Slide $N$'s position to Slide $N+1$'s position during the transition.
3. This creates the signature fluid transformation where an overview architecture zooms into a detailed subsystem.

### 4.2 Staggered Causal Storytelling (`choreographFlow`)
To explain how data travels through a system:
- The Agent calculates the causal path: $A \rightarrow B \rightarrow C \rightarrow D$.
- Sets animation delays: $t_A = 0.0s, t_B = 0.6s, t_C = 1.2s, t_D = 1.8s$.
- Assigns `draw` animations to the connecting lines.
- During presentation mode, clicking next plays a sequence where components illuminate in exact execution order.

---

## 5. Comprehensive Agent Tool Reference

| Tool Name | Domain | Description |
| :--- | :--- | :--- |
| `synthesizeDeckFromDocument` | Deck | Ingests uploaded Markdown/PDF/Spec files and generates a multi-slide deck with Magic Move. |
| `addSlide` | Slide | Adds a blank slide with optional target index inheritance. |
| `deleteSlide` | Slide | Deletes a target slide (with interactive approval prompt). |
| `goToSlide` | Slide | Switches the active editor viewport to a specific slide. |
| `setSlideBackground` | Slide | Applies solid colors, gradients, or dark-theme backgrounds. |
| `getProjectContext` | Context | Returns a deck-wide summary (slide count, element counts, titles). |
| `getSlideContext` | Context | Returns full AST detail (elements, coordinates, styles) for a specific slide. |
| `generateDiagram` | Diagram | Compiles a full compound Dagre architecture diagram with auto-scaling & cloud icons. |
| `patchDiagram` | Diagram | Incrementally adds/removes nodes and rewires edges without resetting existing layouts. |
| `addShapeElement` | Element | Adds an individual diagram node with smart non-overlapping auto-placement. |
| `addSectionElement` | Element | Adds a visual boundary container for VPCs, Subnets, and Microservice tiers. |
| `addLineElement` | Element | Adds a connector line with port mapping (`top`, `bottom`, `left`, `right`) and Bezier curves. |
| `addTextElement` | Element | Adds headings, subtitles, or body text with contrast-guaranteed colors. |
| `updateElementText` | Element | Edits existing text elements via `matchText` fuzzy resolution. |
| `deleteElement` | Element | Removes an element by ID (with approval prompt). |
| `applyDeckTheme` | Theme | Applies cohesive design tokens (typography, stroke colors, card fills) across the deck. |
| `harmonizeSlideStyles` | Theme | Aligns font sizes and spacing across all slides to a standard typographic scale. |
| `applyAnimation` | Motion | Configures entrance animations (`fade-in`, `slide-up`, `pop`, `draw`, `none`). |
| `choreographFlow` | Motion | Sequences staggered delays along a causal path to simulate data packet lifecycles. |
| `setTransition` | Motion | Configures slide transitions (`magic-move`, `slide-left`, `fade`, `zoom`, `flip`). |
| `createExploratoryBranch` | Git | Creates an isolated Git branch to explore alternative architectures risk-free. |
| `agenticMergeReview` | Git | Computes visual and structural diffs between branches and generates merge summaries. |
| `auditPresentationQuality` | Quality | Audits contrast ratios (WCAG AA), text density, and orphan connectors with 1-click fixes. |
| `generateSpeakerNotes` | Presenter | Writes structured talking points and cues for the presenter. |
| `exportPresentation` | Export | Renders 1080p 60fps MP4 video, PDF, interactive HTML, or animated GIFs. |

---

## 6. Architectural Guarantees & Quality Standards

1. **Idempotency & Non-Destructive Mutations**: Edits preserve existing element IDs, custom styles, and manual overrides whenever possible.
2. **Contrast & Readability (WCAG AA)**: Text and card elements automatically validate luminance contrast against backgrounds ($\ge 4.5:1$).
3. **Fixed Viewport Discipline**: Every diagram and slide layout is normalized to fit within the 1280×720 canvas with 80px safe margins.
4. **Time-Travel Safety**: Every mutation is snapshot-tracked with 1-click undo.
5. **Cross-Platform AI Provider Compatibility**: Runs seamlessly on cloud models (GPT-4o, Claude 3.5 Sonnet) and 100% private local models (Ollama Llama 3.2, Mistral, Qwen).
