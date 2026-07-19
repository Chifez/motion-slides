Let me read this carefully before responding.

This is a well-scoped document. Let me give you a structured architectural take on all three areas.

---

## The Root Diagnosis

Your core problem is a **coordinate system identity crisis**. Right now your app is treating the canvas board as both:

- The **viewport/container** (what the user sees and interacts with)
- The **export artboard** (what gets rendered to video)

These are two different things, and conflating them is what's causing all your resize bugs and the Eraser.io mismatch.

---

## 1. Coordinate System Redesign: Infinite Canvas + Export Artboard

**The right mental model:**

```
World Space (infinite, absolute coords)
    └── Camera Transform (pan + zoom applied to the viewport)
        └── Viewport (what the user sees — fills the screen)
            └── Export Artboard Frame (a visual overlay rectangle in world space)
```

Elements live in **world space** at fixed coordinates. The export artboard is just a rectangle overlay that says "this region gets exported." The user can resize the artboard without touching element coordinates at all.

**Concretely, what changes:**

Right now you have:
```ts
// CanvasStage.tsx — elements are positioned relative to the board div
<div style={{ width: canvasW, height: canvasH, transform: `translate(${camera.x}px, ${camera.y}px) scale(${scale * camera.zoom})` }}>
  {elements} // positioned with top/left inside this bounded box
</div>
```

The target model:
```ts
// Elements live in world space — no bounding box div
<div style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}>
  {elements} // world coords, unconstrained
  <ArtboardFrame x={artboard.x} y={artboard.y} width={artboard.w} height={artboard.h} />
</div>
```

The `ArtboardFrame` is a non-interactive SVG rect or div overlay with a dashed border and a clip shadow outside it (like Figma's canvas). Exporting clips to `artboard.{x, y, w, h}` in world space.

**This immediately eliminates the "elements shift when you resize" bug** — because resizing the artboard only moves the frame overlay, not the coordinate system elements live in.

---

## 2. The `useCanvasScale` Problem

You have a subtle bug here that's worth calling out explicitly:

```ts
// CanvasStage.tsx
const scale = useCanvasScale(stageRef, defaultW, defaultH) // ← uses defaultW/defaultH

// But renders with:
width: canvasW  // ← uses customCanvasWidth
```

So the scale is calculated for the *default* dimensions but the board renders at *custom* dimensions. When you drag to resize, `canvasW`/`canvasH` change but `scale` is still fit-to-default. This is why resizing the bottom border "works" visually (height changes) but elements shift — the scale factor is stale relative to the new dimensions.

Fix: pass `canvasW, canvasH` into `useCanvasScale`, not `defaultW, defaultH`. Or better yet, drop `useCanvasScale` entirely once you move to the infinite canvas model — fit-to-screen becomes a one-time "zoom to fit artboard" action, not a continuous constraint.

---

## 3. The Four Resize Handle Bugs

**Right border doing nothing:**

Almost certainly a z-index or pointer-events issue. The Inspector Panel or a sidebar likely has a higher stacking context and is eating pointer events on the right edge. Check:

```css
/* Your resize handle probably has */
position: absolute; right: -4px; /* sits outside the board div */
```

If the board div has `overflow: hidden` or a parent has a clipping context, the handle exists in the DOM but is invisible to hit testing. Also check if the Inspector Panel's left edge overlaps the canvas right edge — even 1px of overlap kills pointer capture.

Quick diagnostic: temporarily set `pointer-events: none` on the Inspector Panel and retry the right border drag.

**Bottom border pushing elements down:**

This is the coordinate origin problem. When you increase `canvasH`, the board div grows downward — but `transformOrigin: 'center center'` means the scale recalculates around the center, which shifts where elements appear relative to the new boundaries. Elements haven't moved in the DOM, but their visual position relative to the borders has changed.

**Left and Top borders:**

These are the hardest with a positioned-div model. To move the left border left, you'd need to both increase the width AND translate the board left by the delta — otherwise growing left just grows right. You're probably only doing one of the two.

The correct resize math for left-border drag:
```ts
onDrag(deltaX) {
  setCanvasW(prev => prev - deltaX)   // grow width
  setCamera(cam => ({ ...cam, x: cam.x + deltaX }))  // compensate pan so content stays put
}
```

Same logic for top border with `y`. Without the camera compensation, the origin shifts and elements appear to "move."

---

## Strategic Recommendation

I'd do this in two phases rather than one big rewrite:

**Phase 1 (fix the immediate bugs, low risk):**
- Fix the `useCanvasScale` to use `canvasW/canvasH` not `defaultW/defaultH`
- Fix the 4-border resize math with camera compensation on left/top drags
- Investigate the right-border pointer-events block (Inspector Panel overlap)

**Phase 2 (the real redesign):**
- Move elements to world-space coordinates (decouple from board div dimensions)
- Replace the board div constraint with an `ArtboardFrame` overlay
- Drop `useCanvasScale` — let `camera.zoom` be the only scale, with a "fit artboard" button
- Export clips to artboard bounds, not to the board div dimensions

Phase 1 gets you unblocked quickly. Phase 2 is the right long-term architecture and it's what makes the Eraser.io feel possible. The two phases don't conflict — Phase 1 fixes are compatible with the Phase 2 model.

---
