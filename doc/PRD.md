# 📄 Product Requirements Document (PRD)

## 🧭 Product Name
**MotionSlides** (working title)

---

# 1. 🧠 Product Vision

MotionSlides is a web-based presentation tool that enables users to create cinematic, interactive presentations using a **state-based animation engine**.

Unlike traditional tools:
- Slides are **states**, not pages
- Transitions are **computed (diff-based)**, not preset animations
- Supports **code-aware animations** as a first-class feature

---

# 2. 🎯 Goals & Objectives

## Primary Goals
- Build a **motion-first presentation engine**
- Deliver **Keynote-level transitions on the web**
- Enable **semantic, element-aware animations**

## MVP Success Criteria
- Users can create slides and transitions
- Transitions are smooth and visually impressive
- Code animations work reliably
- Playback is demo-worthy

---

# 3. 👥 Target Users

## Developers
- Presenting code changes
- Teaching programming concepts

## Designers
- Storytelling and motion presentations

## Educators / Creators
- Tutorials
- Async presentations

---

# 4. 🧩 Core Product Concept

> Slides are not pages — they are **states of a scene**

- Each slide = snapshot of elements
- Transition = diff between states → animated

---

# 5. 🧱 Core Features (MVP)

---

## 5.1 Slide (State) System

### Requirements
- Create, duplicate, delete slides
- Navigate between slides
- Store:
  - dimensions
  - elements array

---

## 5.2 Element System (Universal)

### Element Schema

```json
{
  "id": "string",
  "type": "text | code | shape | image",
  "position": { "x": 0, "y": 0 },
  "size": { "width": 100, "height": 50 },
  "rotation": 0,
  "opacity": 1,
  "style": {},
  "content": {}
}
````

---

### Supported Elements (MVP)

#### Text

* plain text
* font size
* color
* alignment

#### Code Block

* multi-line support
* line-based structure

#### Shapes

* rectangle
* circle

#### Image

* upload + render

---

## 5.3 Smart Transition Engine (CORE)

### Description

Automatically animates differences between slides.

### Transition Logic

| Change Type     | Behavior               |
| --------------- | ---------------------- |
| Same Element    | Animate position/style |
| Added Element   | Fade + slide in        |
| Removed Element | Fade out               |
| Moved Element   | Smooth transform       |
| Resized Element | Width/height animation |

---

## 5.4 Code-Aware Animation

### Behavior

* Detect line-level differences
* Animate inserted lines
* Animate container resizing

### Example

#### Slide A

```js
const function (){
}
```

#### Slide B

```js
const function (){
  console.log('hello world')
}
```

### Expected Animation

* Function expands
* New line slides in
* Existing lines reposition

---

## 5.5 Playback Engine

### Requirements

* Play presentation
* Navigate forward/backward
* Smooth transitions (target: 60fps)

---

## 5.6 Canvas Editor

### Features

* Drag elements
* Resize elements
* Select elements
* (Optional MVP) snapping guides

---

## 5.7 Export (MVP Minimal)

* Export single slide as PNG

---

# 6. 🧠 System Architecture

---

## 6.1 High-Level Flow

```
Editor UI → Scene State → Diff Engine → Animation Engine → Renderer
```

---

## 6.2 Core Modules

### Scene Manager

* Stores slides
* Handles navigation

---

### Diff Engine

#### Input

* Slide A
* Slide B

#### Output

```json
{
  "added": [],
  "removed": [],
  "updated": [],
  "unchanged": []
}
```

---

### Animation Engine

Maps diff results to animations:

| Change  | Animation      |
| ------- | -------------- |
| Added   | Fade + slide   |
| Removed | Fade out       |
| Updated | Transform      |
| Resized | Size animation |

---

### Renderer

Recommended:

* DOM-based rendering
* Animation via:

  * Framer Motion (preferred)
  * or GSAP

---

# 7. 🧪 Code Animation Engine

---

## Step 1: Parse Code

```js
[
  { id: "line1", text: "const function (){" },
  { id: "line2", text: "}" }
]
```

---

## Step 2: Diff Algorithm

Initial:

* index-based comparison

Future:

* LCS (Longest Common Subsequence)

---

## Step 3: Animation Rules

* Unchanged → move
* Added → slide in
* Removed → fade out
* Container → animate height

---

# 8. 🎨 UI / UX Design

---

## Layout

```
-----------------------------------
| Toolbar                          |
-----------------------------------
| Slides | Canvas | Properties     |
-----------------------------------
| Timeline / Transition Controls   |
-----------------------------------
```

---

## Panels

### Left: Slides Panel

* thumbnails
* reorder slides

### Center: Canvas

* main editing area

### Right: Properties Panel

* edit selected element

---

# 9. ⚙️ Tech Stack

---

## Frontend

* Svelte (recommended) or React
* Framer Motion (animations)
* DOM rendering

---

## Backend (Optional MVP)

* Node.js (Express)
* PostgreSQL
* S3 / Cloudinary

---

## Storage (MVP Shortcut)

* localStorage

---

# 10. 🚀 Milestones

---

## Phase 1 (Weeks 1–2)

* Canvas rendering
* Element creation

---

## Phase 2 (Weeks 3–4)

* Slide system
* Navigation

---

## Phase 3 (Weeks 5–6)

* Diff engine
* Basic transitions

---

## Phase 4 (Weeks 7–8)

* Code block support
* Code animations

---

## Phase 5 (Week 9)

* Polish animations
* Performance tuning

---

# 11. 🔴 Phase 2 Features

---

## Audio & Recording

* Voice recording per slide
* Sync with animations

---

## Video Export

* Export presentation as MP4

---

## Timeline Editor

* Control animation timing
* Delays and sequencing

---

## Templates

* Prebuilt presentations

---

# 12. ⚠️ Risks & Challenges

---

## Smooth Animations

* Layout shift issues
* Jank during transitions

---

## Text Rendering

* Font inconsistencies
* Line height alignment

---

## Diff Accuracy

* Identifying real vs new elements

---

## Performance

* Many elements on screen

---

# 13. 🏆 Differentiation

---

* Semantic, diff-based transitions
* Code-aware animations
* Web-native motion engine
* Slides as states model

---

# 14. 📌 Final Notes

This product succeeds if:

* Animations feel **natural and intentional**
* Transitions feel **magical**
* Demo is impressive within seconds

---

# ✅ Immediate Next Step

Build a vertical slice:

* 2 slides
* 1 code block
* Working diff animation

If this works smoothly → scale the system



