Here's what the research reveals, distilled into what's actually actionable for MotionSlides:

---

## Why the AI churns out bad layouts

The core problem is well-documented in the academic literature. LLMs treat spatial reasoning as an emergent byproduct rather than an explicit modeling objective — they neither represent spatial constraints explicitly nor enforce geometric or relational consistency at the element or canvas level. In plain terms: the model has no idea what your canvas looks like, how big it is, or where things already are. It's guessing.

Even state-of-the-art LLMs often struggle to produce layouts that preserve structural consistency, geometric plausibility, and visual coherence — failing to maintain element alignment and balanced distribution, producing inconsistent element sizes, and misplacing elements relative to their intended context.

---

## The industry-standard fix: Context Injection + Normalized Coordinates

The most widely adopted solution across research and production tools is two things working together:

**1. Feed the canvas as structured context on every request**

The standard approach normalizes bounding box coordinates with the background width and height to facilitate multi-resolution generation, expressing layout information through JSON format with the canvas resolution explicitly passed to the model.

In practice for MotionSlides, every AI request should include a context block like:

```ts
const canvasContext = {
  canvas: {
    width: canvasWidth,
    height: canvasHeight,
    aspectRatio: `${canvasWidth}:${canvasHeight}`,
    safeZone: { top: 40, right: 40, bottom: 40, left: 40 }
  },
  existingElements: slide.elements.map(el => ({
    type: el.type,
    x: el.x / canvasWidth,   // normalize to 0–1
    y: el.y / canvasHeight,
    w: el.width / canvasWidth,
    h: el.height / canvasHeight,
  }))
}
```

**2. Force the model to output normalized coordinates in a strict JSON schema**

The model should never output raw pixel values — they're meaningless to it. Instead it reasons in 0–1 space and you denormalize on your end:

```ts
// AI outputs this:
{ "x": 0.1, "y": 0.08, "width": 0.8, "height": 0.12 }

// You convert:
{ x: 0.1 * canvasWidth, y: 0.08 * canvasHeight, ... }
```

---

## The system prompt structure that actually works

The reliable pattern is multi-step prompting: first generate a layout plan as JSON, then fill content per element — treating each step as a module with state passed between them.

For your AI chat, the system prompt should encode four things explicitly:

**Zone map** — divide the canvas into named regions the model can reason about:
```
Canvas is {width}x{height}px ({ratio} aspect ratio).
Zones: header (y: 0–0.15), body (y: 0.15–0.80), footer (y: 0.80–1.0)
Left third: x 0–0.33 | Center: x 0.33–0.66 | Right: x 0.66–1.0
```

**Design constraints** — hard rules baked into the prompt:
```
Rules:
- No element may exceed x: 0.0–1.0 or y: 0.0–1.0
- Minimum element width: 0.1, minimum height: 0.05
- Text elements: font size should be proportional to height (h * canvasHeight / 1.5 ≈ px)
- Maintain 0.03 gutter between adjacent elements
- Title elements: always in header zone, width ≥ 0.5
```

**Few-shot examples** — this is the single biggest quality lever. Include 2–3 complete before/after examples of good layouts in your system prompt. The use of few-shot examples can increase the accuracy of layout output significantly compared to zero-shot approaches where no examples are provided.

**Spatial chain-of-thought** — instruct the model to reason before placing:
```
Before generating elements, reason step by step:
1. What is the primary visual hierarchy?
2. Where is the focal point?
3. What zones should each element occupy?
4. Are any elements overlapping?
Then output the JSON.
```

---

## Post-generation validation layer

Never trust the raw output. Add a normalization/clamping pass after the AI responds before committing to the store:

```ts
function sanitizeLayout(elements, canvasWidth, canvasHeight) {
  return elements.map(el => ({
    ...el,
    x: Math.max(0, Math.min(el.x, canvasWidth - el.width)),
    y: Math.max(0, Math.min(el.y, canvasHeight - el.height)),
    width: Math.min(el.width, canvasWidth),
    height: Math.min(el.height, canvasHeight),
  }))
}
```

---

## Summary of what to implement

| Problem | Solution |
|---|---|
| AI doesn't know canvas size | Inject `canvasWidth`, `canvasHeight`, `aspectRatio` into every request |
| AI outputs bad absolute coords | Normalize to 0–1, denormalize client-side |
| Elements stack in one line | Add zone map + explicit spacing rules to system prompt |
| No awareness of existing elements | Send current slide elements as context |
| Unpredictable output format | Enforce strict JSON schema via structured output |
| Poor spatial reasoning | Add chain-of-thought reasoning step before element placement |
| Still bad occasionally | Post-process with a sanitization/clamping pass |

The biggest single win will be the **canvas context injection + normalized coordinates**. Everything else compounds on top of that foundation.