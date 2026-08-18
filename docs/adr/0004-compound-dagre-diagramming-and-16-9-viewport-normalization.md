# ADR 004: Compound Dagre Constraint-Based Diagramming & 16:9 Viewport Normalization

## Status
**Accepted** (2026-08-18)

## Context & Problem Statement
MotionSlides allows users and AI agents to generate complex technical architecture diagrams (multi-tier VPCs, Kubernetes topologies, AWS/GCP pipelines, microservice meshes). 

Unlike generic infinite-canvas whiteboard tools (e.g., Miro, Excalidraw) where diagrams can spread unpredictably across thousands of pixels, presentations MUST fit cleanly onto a **fixed 16:9 slide canvas** ($1280 \times 720\text{px}$) with balanced padding, legible typography, proper containment boundaries, and non-overlapping port-mapped connector lines.

We need a diagram compilation engine that:
1. Structures nodes into hierarchical containers (VPCs, subnets, layers) with compound graph semantics.
2. Automatically routes and positions nodes using directional constraint solving (Left-to-Right for pipelines, Top-to-Bottom for tiered stacks).
3. Normalizes and fits arbitrary compound graphs into the $1280 \times 720\text{px}$ slide boundary using isotropic scaling and centering offsets.
4. Auto-resolves cloud icons (AWS, GCP, CNCF) and maps Bezier curve connectors between explicit node port handles (`top`, `bottom`, `left`, `right`).

## Decision Drivers
- **Deterministic 16:9 Fit**: Generated diagrams must NEVER overflow the slide canvas or hide behind UI panels.
- **Hierarchical Grouping**: Boundary sections (e.g., VPCs) must wrap around their child elements with consistent padding and dynamic bounding boxes.
- **Visual Legibility**: Font sizes, node proportions, and connector paths must remain aesthetically balanced across varying graph densities.
- **Non-Destructive Patching**: Incremental updates (`patchDiagram`) must preserve stable entity IDs to enable Magic Move animations across slide revisions.

## Decision Outcome
We implemented a **Constraint-Based Compound Dagre Layout & Slide-Fit Normalization Pipeline** (`apps/web/src/lib/agent/tools/diagram-tools.ts`):

1. **Compound Graph Layout**:
   - Uses `dagre.graphlib.Graph({ compound: true })`.
   - Parent container boundaries (sections) are created as compound nodes via `g.setParent(childId, layerId)`.
   - Layout parameters configure node dimensions ($140 \times 80\text{px}$ standard), separation spacing, and rank direction (`rankdir: 'LR' | 'TB'`).
2. **Slide-Fit Viewport Normalization**:
   - Calculates layout bounding box: $W_{\text{graph}} = \max(x + w) - \min(x)$, $H_{\text{graph}} = \max(y + h) - \min(y)$.
   - Target bounds with $80\text{px}$ safe padding: $W_{\text{target}} = 1120\text{px}$, $H_{\text{target}} = 560\text{px}$.
   - Computes isotropic scale factor: $S = \min(1.0, W_{\text{target}} / W_{\text{graph}}, H_{\text{target}} / H_{\text{graph}})$.
   - Computes centering translations $O_x, O_y$ and rounds all coordinates: $x_{\text{final}} = \text{round}(x_{\text{dagre}} \cdot S + O_x)$.
3. **Container Section Geometry**:
   - For every compound layer, computes the aggregate bounding box of transformed children, applies $24\text{px}$ internal padding and $16\text{px}$ title margin, and places a translucent `section` element at `zIndex: 1`.
4. **Port-Mapped Bezier Connectors**:
   - Connector lines bind to specific port handles (`top`, `bottom`, `left`, `right`) using `perfect-arrows` calculation and dynamic Bezier elbow routing.
5. **RAG Icon Resolution**:
   - Node labels pass through `icon-resolver.ts` to automatically assign local SVG cloud icons from `public/icons/`.

---

## Negative Space & Forbidden Alternatives

The following tools, paradigms, and patterns are **STRICTLY FORBIDDEN** in this repository:

| Forbidden Alternative | Reason for Rejection & Threat to Architecture |
| :--- | :--- |
| **Infinite Whiteboard Layouts (Unbounded Coordinates)** | Causes diagrams to sprawl off-screen, rendering slides broken in presentation mode. |
| **Mermaid.js / Graphviz Runtime DOM Injectors** | Generates static SVG blobs that cannot be converted to editable Scene Graph AST nodes, breaking direct manipulation and Magic Move animations. |
| **Hardcoded Coordinate Arrays** | Hardcoding absolute pixel coordinates for multi-node diagrams results in overlapping elements and broken aspect ratio scaling on varying diagram sizes. |
| **Raw Straight Lines Bypassing Ports** | Simple unanchored line coordinates desynchronize when nodes are moved or resized. |
| **External CDN Icon Links** | Third-party image URLs introduce network failure risks and violate offline-first capabilities. All icons must resolve to local assets. |

---

## Agent Guardrails (Automated Enforcement Rules)

AI Agents modifying this codebase must adhere to the following strict guardrails:

1. **All Generated Diagrams Must Use the Compound Dagre Pipeline**:
   - When generating or synthesizing architecture diagrams, call `generateDiagram` or `compileDiagramLayout`. Never generate raw disconnected shape arrays with arbitrary pixel coordinates.
2. **Mandatory 16:9 Viewport Fit**:
   - Diagram algorithms MUST apply isotropic scaling and centering offsets to ensure coordinates stay within $x \in [40, 1240]$ and $y \in [40, 680]$.
3. **Preserve IDs in `patchDiagram`**:
   - When modifying existing diagrams, match existing node labels and retain their UUIDs so the motion engine can smoothly interpolate transitions.
4. **Always Anchor Lines to Valid Node Port Handles**:
   - Connectors must declare `startConnection: { elementId, handleId }` and `endConnection: { elementId, handleId }` where `handleId` is `'top' | 'right' | 'bottom' | 'left'`.

---

## Consequences & Trade-offs

### Positive
- **Guaranteed Aesthetic Balance**: Every generated diagram looks polished, centered, and proportional on standard 16:9 displays.
- **Full Interactivity**: Every diagram element is an editable first-class AST node that can be moved, resized, re-colored, or animated.
- **Magic Move Continuity**: Smooth interpolation between architecture overview and detail slides.

### Negative
- **Graph Complexity Limits**: Highly dense graphs (>25 nodes on a single slide) will scale down aggressively to fit the slide viewport.

---

## References & Code Artifacts
- Diagram Tools & Compiler: [apps/web/src/lib/agent/tools/diagram-tools.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/agent/tools/diagram-tools.ts)
- Shared Scene Types: [packages/shared/src/types.ts](file:///c:/Users/c/Desktop/motionslides/packages/shared/src/types.ts)
- Scene Graph Helpers: [apps/web/src/lib/scene-graph.ts](file:///c:/Users/c/Desktop/motionslides/apps/web/src/lib/scene-graph.ts)
