# MotionSlides Agent-First Demo & Test Prompts

A curated suite of natural language prompts designed to test and demonstrate all features across Milestones 1 to 4 of the MotionSlides Agent architecture.

---

## 🎨 Milestone 1: Document Ingestion, Multi-Slide Synthesis & Iterative Editing

### Prompt 1A: Multi-Slide Deck Synthesis from Spec
> **How to test**: Click the **paperclip icon** (or drag & drop a `.md` / `.txt` / `.yaml` file) into the chat, or paste this prompt directly:

```text
Synthesize a 4-slide technical presentation deck explaining our "Distributed Video Processing Pipeline":
- Slide 1: Ingestion Architecture (Client, API Gateway, S3 Upload Bucket)
- Slide 2: Transcoding Cluster (S3 Upload Bucket, SQS Queue, GPU Worker Nodes)
- Slide 3: Storage & Delivery (GPU Worker Nodes, HLS Origin Bucket, CloudFront CDN)
- Slide 4: Real-time Analytics (API Gateway, ClickHouse DB, Grafana Dashboard)
Ensure shared components keep stable IDs for Magic Move transitions.
```
- **Expected Result**: The agent generates 4 slides with compound layouts, SVG cloud icons, and sets `magic-move` transitions between consecutive slides.

---

### Prompt 1B: Non-Destructive Incremental Diagram Patching
> **How to test**: On any slide with an existing diagram (e.g. Slide 1 or Slide 4):

```text
Add a Redis Caching layer between the API Gateway and the Database with a 0.4s delay, and connect it with a dotted line labeled "cache lookup".
```
- **Expected Result**: Uses `patchDiagram` to insert the Redis Cache and connection without recreating or wiping existing slide elements.

---

### Prompt 1C: Deck Theming & Typographic Normalization
```text
Apply the "obsidian-cyan" theme across the entire presentation deck with Outfit typography and harmonize the slide styles.
```
- **Expected Result**: Reskins all slides to obsidian-cyan palettes, cyan accent borders, and standardized typography scales.

---

## ⚡ Milestone 2: Cinematic Motion Choreography & Transitions

### Prompt 2A: Causal Flow Sequence Choreography
```text
Choreograph the execution flow on this slide in causal order starting from Client to API Gateway to S3 Upload Bucket with a 0.5s step delay.
```
- **Expected Result**: Assigns sequential entrance delays ($0.0s \rightarrow 0.5s \rightarrow 1.0s$) to nodes and synchronized `draw` animations with half-step delays ($0.25s, 0.75s$) to connector lines.

---

### Prompt 2B: Cross-Slide Magic Move Optimizer
```text
Optimize Magic Move transitions across the entire deck and verify entity ID alignment between adjacent slides.
```
- **Expected Result**: Scans adjacent slides, reconciles matching component IDs, sets transition types to `magic-move`, and reports the morph coverage score.

---

## 🌿 Milestone 3: Agentic Git Branching & Presentation Quality Linter

### Prompt 3A: Exploratory Branching
```text
Create an exploratory branch called "feature/event-driven-kafka" to test an alternative streaming architecture.
```
- **Expected Result**: Creates and checks out a new branch. Test switching with: `"List all active branches"` or `"Switch back to main"`.

---

### Prompt 3B: Intelligent Merge Review
```text
Generate an agentic merge review comparing this branch against main.
```
- **Expected Result**: Computes structural AST diffs and outputs a Markdown table of added, modified, and removed slides/elements.

---

### Prompt 3C: Presentation Quality Linter
```text
Audit the presentation quality for WCAG contrast violations, node density overload, and orphaned connector lines, and auto-fix any issues found.
```
- **Expected Result**: Generates a 0–100 Quality Score report checking WCAG AA contrast compliance, node density, and orphaned lines, with automatic remediation.

---

## 🎙️ Milestone 4: Presenter Mode Copilot & Multi-Format Exporter

### Prompt 4A: Structured AI Speaker Notes
```text
Generate comprehensive technical speaker notes with talking points and presenter timing cues for all slides in this deck.
```
- **Expected Result**: Inspects each slide's topology and generates structured talking points attached to `slide.speakerNotes`.

---

### Prompt 4B: Live Presentation Mode & Video Export
```text
Prepare an interactive 1080p MP4 video export of this presentation with a 16:9 aspect ratio, and then start presentation mode.
```
- **Expected Result**: Prepares export configuration and launches the full-screen presentation viewer.
