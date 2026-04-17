Here’s a **deep technical Markdown doc** tailored to your current scope (architectural diagrams + shapes + code + text), focused on achieving **Keynote-level motion** in your app.

You can drop this directly into your repo as something like
`docs/animation-engine.md`

---

```markdown
# 🎬 Motion Engine Architecture (Keynote-Level Transitions)

## Overview

This document describes how to implement a **state-based animation engine** capable of producing smooth, Keynote-like transitions between slides.

The system supports:
- Shapes (rectangles, circles, connectors)
- Architectural diagrams (nodes + edges)
- Text
- Code blocks (line-aware animation)

---

# 🧠 Core Principle

> Slides are not pages — they are **states of a scene**

A transition is:
```

State A → State B → Animated via diff + interpolation

```

---

# 🧩 System Architecture

```

Slide A + Slide B
↓
Element Matching
↓
Diff Engine
↓
Layout Measurement (FLIP)
↓
Animation Engine
↓
Renderer (DOM)

````

---

# 1. 🧱 Scene Model

## Slide Schema

```ts
type Slide = {
  id: string
  elements: Element[]
}
````

---

## Element Schema

```ts
type Element = {
  id: string
  type: "shape" | "text" | "code" | "image" | "connector"

  position: { x: number; y: number }
  size: { width: number; height: number }

  rotation: number
  opacity: number

  style: Record<string, any>
  content: any
}
```

---

## Special Element Types

### Shapes

* rectangle
* circle
* polygon

### Connectors (Architectural Diagrams)

```ts
type Connector = {
  from: string // element id
  to: string   // element id
  path: Path   // computed dynamically
}
```

---

### Code Block

```ts
type CodeElement = {
  lines: {
    id: string
    text: string
  }[]
}
```

---

# 2. 🔑 Element Matching

## Rule

Elements are matched **strictly by ID**

```
if (A.id === B.id) → same element → animate
else → new/remove
```

---

## Why This Matters

This enables:

* smooth transitions
* continuity of motion
* predictable animations

---

# 3. ⚙️ Diff Engine

## Input

* Slide A
* Slide B

---

## Output

```ts
type DiffResult = {
  added: Element[]
  removed: Element[]
  updated: {
    from: Element
    to: Element
  }[]
  unchanged: Element[]
}
```

---

## Diff Logic

### 1. Match by ID

### 2. Compare properties:

* position
* size
* rotation
* opacity
* content

---

# 4. 📐 Layout Animation (FLIP Technique)

## Why FLIP?

It allows smooth transitions even when layout changes drastically.

---

## Steps

### 1. FIRST

Capture initial layout

```js
const first = element.getBoundingClientRect()
```

---

### 2. LAST

Render Slide B (hidden), measure layout

```js
const last = element.getBoundingClientRect()
```

---

### 3. INVERT

```js
deltaX = first.x - last.x
deltaY = first.y - last.y

scaleX = first.width / last.width
scaleY = first.height / last.height
```

---

### 4. PLAY

Apply transform:

```css
transform: translate(deltaX, deltaY) scale(scaleX, scaleY)
```

Then animate to:

```css
transform: none
```

---

# 5. 🎞️ Animation Engine

## Core Formula

```js
value = start + (end - start) * easing(t)
```

Where:

* `t` = time (0 → 1)
* `easing` = easing function

---

## Animated Properties

* position (translate)
* size (scale)
* opacity
* rotation

---

# 6. 🎯 Shapes Animation

## Rectangle → Rectangle

* translate (x, y)
* scale (width, height)

---

## Shape Transformations

* circle → circle → scale + move
* rectangle → bigger rectangle → scale
* shape movement → translate

---

# 7. 🔗 Connector Animation (DIAGRAMS)

## Challenge

Connectors depend on node positions.

---

## Strategy

### Step 1

Recalculate path based on target positions

### Step 2

Animate path

---

## Techniques

### Option A: SVG Path Morphing

```js
pathA → pathB
```

### Option B: Recompute per frame (simpler)

```js
connector.path = interpolate(nodeA, nodeB)
```

---

## Best Approach (MVP)

* Recalculate connector positions each frame
* Animate endpoints based on node motion

---

# 8. 🧪 Code Animation Engine

---

## Step 1: Normalize Code

```ts
lines = [
  { id: "line1", text: "const function() {" },
  { id: "line2", text: "}" }
]
```

---

## Step 2: Diff (LCS Algorithm)

Identify:

* unchanged lines
* inserted lines
* removed lines

---

## Step 3: Animate

| Case      | Animation       |
| --------- | --------------- |
| unchanged | move            |
| added     | slide + fade in |
| removed   | fade out        |
| shifted   | translate       |

---

## Step 4: Container Resize

```js
height(t) = start + (end - start) * easing(t)
```

---

# 9. 🎬 Timeline System

## Animation Object

```ts
type Animation = {
  duration: number
  delay: number
  easing: string
}
```

---

## Sequencing

* global transition duration (e.g. 600ms)
* per-element delay (optional)
* stagger support

---

# 10. 🔄 Render Loop

```js
function animate(time) {
  const t = (time - startTime) / duration

  elements.forEach(el => {
    update(el, t)
  })

  requestAnimationFrame(animate)
}
```

---

# 11. ⚡ Performance Guidelines

## MUST DO

* use `transform` instead of `top/left`
* avoid layout thrashing
* batch DOM reads/writes

---

## Avoid

* reflow inside animation loop
* animating width/height directly (use scale)

---

# 12. 🎯 Easing Functions

## Basic Ease-In-Out

```js
function easeInOut(t) {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2
}
```

---

## Optional: Spring Physics (Advanced)

* more natural motion
* feels “premium”

---

# 13. 🧠 Key Insights

---

## Why Keynote Feels Smooth

1. Element identity is preserved
2. Layout transitions use FLIP
3. Animations use proper easing
4. Everything runs at 60fps

---

# 14. 🚀 MVP Implementation Plan

---

## Phase 1

* basic element matching
* simple position animation

---

## Phase 2

* FLIP implementation
* smooth layout transitions

---

## Phase 3

* code-aware animations

---

## Phase 4

* connector animations

---

# 15. ⚠️ Common Pitfalls

---

❌ No stable IDs
❌ Animating layout properties directly
❌ Poor easing
❌ Ignoring layout measurement
❌ Overcomplicating diff too early

---

# ✅ Final Mental Model

```
Match → Diff → Measure → Invert → Animate → Render
```

---

# 📌 Conclusion

To achieve Keynote-level animation:

* Treat UI as **state transitions**
* Use **FLIP for layout**
* Use **diff-based animation**
* Keep animations **consistent and intentional**

---

# 🔜 Next Steps

* Implement FLIP for shapes
* Add code diff animation
* Extend to connectors
* Introduce timeline control

```

