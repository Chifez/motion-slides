
# 📄 FULL PRD — MotionSlides Export Engine vNext

---

# 1. 🎯 Objective

Build a **deterministic, high-fidelity export engine** that:

* Produces smooth, glitch-free animations
* Matches runtime visuals exactly
* Supports MP4/WebM/GIF/PDF
* Scales to large projects
* Works independently of React/DOM

---

# 2. 🧱 System Architecture

---

## 2.1 High-Level Pipeline

```text
[Client Editor]
   ↓
(Scene Graph JSON)
   ↓
[Export Service API]
   ↓
[Renderer Engine (Canvas/WebGL)]
   ↓
[Frame Generator]
   ↓
[Video Encoder]
   ↓
[Blob / File]
```

---

## 2.2 Key Principle

> Export is **data-driven**, not DOM-driven

---

# 3. 🧩 Core Components

---

## 3.1 Scene Graph Service (Client → Backend)

### Responsibility

Serialize the entire presentation into a deterministic format.

---

### Example Output

```ts
type ProjectExport = {
  slides: Slide[]
  animations: AnimationTrack[]
  transitions: Transition[]
  assets: AssetMap
  settings: PlaybackSettings
}
```

---

### Requirements

* No React references
* No DOM dependencies
* Fully serializable JSON

---

## 3.2 Renderer Engine (Backend or Worker)

---

### Two Options (Pick One)

---

## OPTION A — Headless Browser Renderer (FASTEST TO SHIP)

Use:

* Puppeteer or Playwright

### How it works:

```text
Load hidden page → inject data → render → capture frames
```

---

### Pros

* Perfect CSS fidelity
* Reuses your current UI
* Minimal rewrite

### Cons

* Heavy
* Slower
* Less deterministic than pure renderer

---

## OPTION B — Canvas/WebGL Renderer (INDUSTRY PATH)

---

### Responsibilities

* Render slides from Scene Graph
* Apply animations deterministically
* Output frames

---

### Render Function

```ts
renderFrame(state, time) → ImageBitmap
```

---

### Features

| Feature          | Required |
| ---------------- | -------- |
| Text rendering   | ✅        |
| Shape rendering  | ✅        |
| Image rendering  | ✅        |
| Transform matrix | ✅        |
| Opacity          | ✅        |
| Clipping/masks   | Later    |

---

---

## 3.3 Animation Engine

---

### Requirements

* Deterministic (time-based)
* No async behavior
* No physics randomness

---

### Model

```ts
type AnimationTrack = {
  elementId: string
  property: string
  keyframes: Keyframe[]
}
```

---

### Evaluation

```ts
value = interpolate(track, time)
```

---

---

## 3.4 Transition Engine

---

### Current state:

✔ You already built this (good)

---

### Required types

* Fade
* Slide (4 directions)
* Zoom
* Flip
* Magic Move (shared element transitions)

---

### Magic Move (Important)

Match elements by ID:

```ts
if (elA.id === elB.id)
  interpolate(elA → elB)
```

---

---

## 3.5 Frame Scheduler

---

### Responsibilities

* Generate frames at fixed FPS (30/60)
* Ensure consistent timing

---

### Example

```ts
for (t = 0; t < duration; t += frameTime)
  frames.push(renderFrame(state, t))
```

---

---

## 3.6 Encoder

---

### Options

#### Client:

* WebCodecs (best)

#### Backend:

* FFmpeg

---

### Formats

| Format | Method          |
| ------ | --------------- |
| MP4    | H.264           |
| WebM   | VP9             |
| GIF    | palette encoder |
| PDF    | image snapshots |

---

---

# 4. ⚙️ API Design

---

## POST /export

```json
{
  "project": {...},
  "format": "mp4",
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30
}
```

---

## Response

```json
{
  "jobId": "abc123"
}
```

---

## GET /export/:jobId

```json
{
  "status": "processing",
  "progress": 65,
  "url": "..."
}
```

---

# 5. 🚀 Execution Modes

---

## Mode 1 — Client Export (Fast, Limited)

* WebCodecs
* OffscreenCanvas
* No server cost

---

## Mode 2 — Backend Export (Heavy, Scalable)

* Node + Renderer
* FFmpeg encoding
* Queue system

---

---

# 6. 📊 Performance Requirements

---

| Metric          | Target              |
| --------------- | ------------------- |
| Frame stability | 100% deterministic  |
| Dropped frames  | 0                   |
| Max resolution  | 4K                  |
| Export time     | < 2× video duration |

---

---

# 7. 🔥 Critical Constraints

---

### ❌ MUST NOT

* Use `html-to-image`
* Use `MediaRecorder`
* Depend on React timing
* Capture DOM directly

---

### ✅ MUST

* Render from data
* Control time explicitly
* Generate frames offline

---

---

# 8. 🧪 Testing Strategy

---

### Visual Diff Testing

* Compare frame N vs expected
* Pixel tolerance

---

### Determinism Test

* Same input → identical output hash

---

---

# 9. 🗺️ Roadmap

---

## Phase 1 — Stabilize (1–2 weeks)

* Scene graph extraction
* Basic canvas renderer
* Replace html-to-image

---

## Phase 2 — Animation Engine

* Keyframe interpolation
* Entrance animations

---

## Phase 3 — Transitions

* Integrate your compositor
* Add magic move

---

## Phase 4 — Encoding

* WebCodecs pipeline
* Backend FFmpeg option

---

## Phase 5 — Scaling

* Queue system
* Background jobs

---

---

