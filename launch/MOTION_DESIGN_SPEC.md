# MotionSlides Launch Video — Motion Design & Context Specification

> **Target Audience:** Claude Code / Engineering Agent  
> **Objective:** Refine, elevate, and implement Awwwards-winning, Apple/Linear-grade motion design, seamless scene transitions, kinetic typography, dynamic ambient backgrounds, and element choreographies across the Remotion launch video codebase.

---

## 1. Project Overview & Mission

**MotionSlides** is an open-source, web-based presentation studio combining Keynote-style Magic Move FLIP transitions, Agentic AI architecture diagram generation, and Shiki code morphing.

This workspace contains the official **33.66-Second 60FPS Product Launch Trailer** (2,020 total frames) built in Remotion. The goal is to polish every entrance, exit, background atmosphere, and camera motion so the entire video feels like **one continuous, seamless cinematic canvas** rather than disconnected slides.

---

## 2. Technology Stack & Modern Remotion Tooling

* **Core Engine:** Remotion `v4.0.218` (`remotion`, `@remotion/player`, `@remotion/cli`, `@remotion/bundler`)
* **Remotion Native Modules:**
  * `interpolateColors()` *(built-in)*: Multi-stop RGBA/HEX color morphing across scenes.
  * `<AbsoluteFill />` *(built-in)*: Hardware-accelerated compositor-only layout primitive.
  * `@remotion/noise`: `noise2D()` for organic ambient halo drift and subtle camera breathing.
  * `@remotion/paths`: `evolvePath()` for animated connector line drawing and path evolution.
  * `@remotion/mac-cursors`: Native macOS cursor graphics & contextual state switching (`arrow` $\leftrightarrow$ `pointingHand` $\leftrightarrow$ `text`).
* **Framework:** React `19.2.0`, TypeScript `5.7.2`
* **Video Dimensions:** `1920 × 1080` (16:9 Full HD), `60 FPS`
* **Total Duration:** 2,020 frames (33.66 seconds master sequence)
* **Styling Paradigm:** Pure inline styles / GPU-accelerated CSS properties (`transform`, `opacity`, `filter`).

### Strict Motion Engineering Constraints
1. **Never Animate from `scale(0)`:** Real physical objects do not appear from absolute zero. All entering containers/cards start from `scale(0.92)` to `scale(0.95)` with `opacity: 0`.
2. **True Apple Critical Damping:** For non-overshooting UI elements and scene settles, enforce `overshootClamping: true` with calibrated damping (`damping: 26, mass: 1.0, stiffness: 100`). Reserve bouncing/overshoot (`overshootClamping: false`, `damping: 12–16`) exclusively for momentum flicks, cursor clicks, and playful badges.
3. **Masked Reveals over Literal `clip-path` Animations:** Prefer `overflow: hidden` on parent containers paired with `translateY()` on inner elements. Literal `clip-path` animations force layout/paint passes in Chromium and can cause micro-jitter when chained with springs.
4. **Absolute Frame Continuity:** Remotion `<Series.Sequence>` resets `useCurrentFrame()` to 0 within each child. Continuous cross-scene effects (living mesh harmonic drift, multi-scene halo color morphing, camera vectors) **must** compute on `absoluteFrame = sceneStartFrame + localFrame`.
5. **No Hard Cuts / Disjointed Exits:** When a scene exits, all layers (background, typography, UI frame, cursor) must exit with coordinated spatial momentum and depth blur rather than abruptly disappearing.

---

## 3. Repository Architecture & Key Files

```
c:\Users\c\Desktop\motionslides\launch\
├── remotion.config.ts
├── package.json
└── src/
    ├── Root.tsx                       # Master Composition & <Series> sequence
    ├── index.ts                       # Remotion entry point
    ├── constants/
    │   ├── timing.ts                  # SCENE_TIMINGS & SCENE_TRANSITION_VECTORS
    │   └── spring-presets.ts          # Calibrated spring physics configurations
    ├── hooks/
    │   ├── use-absolute-frame.ts      # Global absolute frame resolution hook
    │   └── use-camera-zoom.ts         # Multi-keyframe camera zoom & vignette hook
    ├── audio/
    │   └── SoundController.tsx        # Dynamic SFX & soundtrack layering
    ├── components/
    │   ├── shared/
    │   │   ├── cinematic-background.tsx # Living ambient mesh & global color morph (noise2D + interpolateColors)
    │   │   ├── kinetic-text.tsx       # Masked translateY line reveals & blur settles
    │   │   ├── scene-transition-wrapper.tsx # Z-axis push/pull & depth blur wrapper
    │   │   ├── camera-rig.tsx         # Camera viewport wrapper with dynamic zoom
    │   │   ├── cursor-pointer.tsx     # Context-aware macOS cursor (arrow/hand/text) with spring physics
    │   │   └── scene-intro-overlay.tsx# Interstitial category badge & serif title
    │   └── editor-app/
    │       ├── app-editor-shell.tsx   # macOS dark-mode presentation UI shell
    │       ├── app-logo.tsx           # MotionSlides vector mark & wordmark
    │       ├── app-slide-panel.tsx    # Left sidebar slide list with thumbnails
    │       ├── app-ai-chat.tsx        # Right drawer agentic AI interface
    │       └── elements/
    │           ├── app-shape-element.tsx   # AWS / Architecture SVG node components
    │           ├── app-section-element.tsx # Dashed VPC boundaries & zones
    │           ├── app-line-element.tsx    # Smart orthogonal & curved connectors with evolvePath
    │           └── app-code-element.tsx    # Shiki syntax-highlighted code block
    └── scenes/
        ├── scene-1-hook/scene-one.tsx       # Kinetic Problem Hook & Brand Reveal
        ├── scene-2-magic-move/scene-two.tsx # Magic Move FLIP Blueprint Morphing
        ├── scene-3-ai-studio/scene-three.tsx# AI Generation Cascade & Chat Drawer
        ├── scene-4-code-morph/scene-four.tsx# Shiki LCS Code Diffing & Camera Zoom
        └── scene-5-export-outro/scene-five.tsx# 4K Export Studio & Grand Outro
```

---

## 4. Master Scene Breakdown & Transition Vectors

| Scene | Frame Range | Duration | Entry / Exit Cursor Vectors | Key Storybeat & Visual Event |
| :--- | :--- | :--- | :--- | :--- |
| **Scene 1 (Hook)** | `0 – 270f` | 4.5s | Entry: Centered<br>Exit: $(960, 540)$ | **Problem Hook** ("Static presentations are trapped in the past") $\rightarrow$ **Pivot Question** $\rightarrow$ **MotionSlides Brand Reveal** with feature pill tags. |
| **Scene 2 (Magic Move)** | `270 – 750f` | 8.0s | Entry: $(960, 540)$<br>Exit: $(1180, 480)$ | **Intro Interstitial** $\rightarrow$ Editor window spring entrance $\rightarrow$ Cursor clicks Slide 2 thumbnail $\rightarrow$ Slide 3 FLIP morphs VPC boundary, Lambda, Server, DB, RDS, S3. |
| **Scene 3 (AI Studio)** | `750 – 1260f` | 8.5s | Entry: $(1485, 126)$<br>Exit: $(700, 450)$ | **Intro Interstitial** $\rightarrow$ Editor enters $\rightarrow$ Cursor clicks "Ask AI" $\rightarrow$ Camera zooms into drawer $\rightarrow$ Live prompt typing $\rightarrow$ Multi-step tool execution $\rightarrow$ Staggered canvas generation cascade. |
| **Scene 4 (Code Morph)** | `1260 – 1630f` | 6.16s | Entry: $(800, 450)$<br>Exit: $(1050, 520)$ | **Intro Interstitial** $\rightarrow$ Editor enters $\rightarrow$ Camera zooms into TypeScript block $\rightarrow$ Line-level LCS diff with syntax highlighting & spring height expansion. |
| **Scene 5 (4K Outro)** | `1630 – 2020f` | 6.5s | Entry: $(960, 540)$<br>Exit: Centered | **4K Virtual-Clock Export Modal** (0% $\rightarrow$ 100%) $\rightarrow$ "100% Free & Open Source" interstitial $\rightarrow$ Grand 2.2× MotionSlides brand logo, Star CTA, and GitHub link. |

---

## 5. Target Vision: The Awwwards & Apple Motion Standard

### Pillar 1: Seamless Scene Continuity ("The Infinite Canvas")
* **Z-Axis Dolly Push/Pull:** Scene $N$ accelerates toward the camera (`scale(1.0) → scale(1.08)`) with dynamic depth-of-field blur (`filter: blur(10px)`). Scene $N+1$ emerges seamlessly from `scale(0.94) → scale(1.00)` with critically damped spring settling.
* **Continuous Global Lighting with `interpolateColors`:** Ambient diffuse light interpolates across the **absolute frame** (`0` to `2020`) without resetting at sequence boundaries:
  * `0 – 270f` (Scene 1): Electric Blue (`rgba(59, 130, 246, 0.08)`)
  * `270 – 750f` (Scene 2): Royal Cobalt (`rgba(37, 99, 235, 0.10)`)
  * `750 – 1260f` (Scene 3): Luminous Violet (`rgba(168, 85, 247, 0.12)`)
  * `1260 – 1630f` (Scene 4): Sapphire Cyan (`rgba(96, 165, 250, 0.10)`)
  * `1630 – 2020f` (Scene 5): Emerald-to-White (`rgba(16, 185, 129, 0.12)`)
* **Vector-Locked Cursor Transitions:** Cursor positions at scene exit exactly match the entry coordinate in `SCENE_TRANSITION_VECTORS` to maintain illusion of uninterrupted mouse control.

### Pillar 2: Dynamic Atmospheric Canvas (`@remotion/noise`)
* **Organic Ambient Drift:** Perlin noise drift computed on `absoluteFrame`:
  $$\Delta X = \text{noise2D}(\text{"haloX"}, \text{frame}/120, 0) \times 35, \quad \Delta Y = \text{noise2D}(\text{"haloY"}, 0, \text{frame}/120) \times 25$$
* **Perspective Depth Grid:** Subtle floor/ceiling dot grid with 3D tilt (`perspective(1200px) rotateX(15deg)`) for sub-pixel motion parallax.
* **Cinematic Focus Vignette:** Camera zooms automatically tighten the radial vignette (`opacity: 0.0 → 0.7`), concentrating lighting onto the active UI element.

### Pillar 3: Kinetic Masked Typography
Upgrade all titles, interstitials, and subheadings from plain opacity fades to **Masked `overflow: hidden` Line Reveals**:
* **Mask Container:** Text lines wrapped in `<div style={{ overflow: 'hidden' }}>`.
* **Line-by-Line Stagger:** Inner `<span style={{ display: 'inline-block' }}>` translates from `translateY(110%)` to `translateY(0%)` with a critically damped spring.
* **Optical Tracking & Blur Settle:** Text begins with `filter: blur(8px)`, `letterSpacing: 0.04em`, and `scale(0.96)`, snapping into razor-sharp focus (`blur(0px)`, `letterSpacing: -0.02em`, `scale(1.0)`).
* **Asymmetric Exit Velocity:** Exits accelerate upward (`translateY(-24px) blur(6px) opacity(0)`), clearing the frame crisply.

### Pillar 4: Element Cascade & Vector Evolution (`@remotion/paths`)
* **Path Evolution on Connectors:** Connector wires dynamically draw in real time using `evolvePath(progress, pathData)` with synchronized pulse beams.
* **Context-Aware macOS Cursor:** Cursor morphs seamlessly between `default` arrow, `pointer` (on thumbnails and buttons), and `text` (inside AI prompt capsule).
* **Code Block Height Transition:** In Scene 4, line additions animate container height using calibrated springs with `willChange: 'height'` while syntax tokens emerge with micro-staggers.
* **Hardware Edge Sheen:** Editor window entrance triggers a specular highlight sweep across its 1px border (`linear-gradient(135deg, rgba(255,255,255,0.4) → rgba(255,255,255,0.02))`).

---

## 6. Implementation Roadmap & Action Items

### Task 1: Install Supporting Remotion Packages
Add `@remotion/noise`, `@remotion/paths`, and `@remotion/mac-cursors` to `launch/package.json`.

### Task 2: Create Core Reusable Motion Primitives
1. `launch/src/hooks/use-absolute-frame.ts`:
   * Combines `useCurrentFrame()` with `startFrame` from `timing.ts` to provide uninterrupted global timeline coordinates.
2. `launch/src/components/shared/cinematic-background.tsx`:
   * Combines `noise2D()` organic drift + `interpolateColors()` global color morphing + perspective depth grid + focus vignette.
3. `launch/src/components/shared/kinetic-text.tsx`:
   * Implements multi-line masked `overflow: hidden` + `translateY` reveals with optical blur settle and spring stagger.
4. `launch/src/components/shared/scene-transition-wrapper.tsx`:
   * Standardizes Z-axis dolly zoom, depth blur exits, and entry spring physics for any scene component.
5. `launch/src/components/shared/cursor-pointer.tsx`:
   * Upgrade with contextual cursor state switching (`default`, `pointingHand`, `text`) alongside existing waypoint spring gliding and click punch-down physics.

### Task 3: Update Timing & Calibrate Spring Physics
* Update `launch/src/constants/timing.ts` with explicit `SCENE_TRANSITION_VECTORS`.
* Update `launch/src/constants/spring-presets.ts` with verified critical damping and overshoot clamping parameters.

### Task 4: Refactor Scenes 1 Through 5
* **Scene 1:** Implement `KineticText` for Problem/Solution questions; add specular logo sheen; forward dolly zoom handoff.
* **Scene 2:** Wrap in `SceneTransitionWrapper` & `CinematicBackground`; use `evolvePath()` for dynamic FLIP morphing connectors.
* **Scene 3:** Connect cursor vector from Scene 2; trigger prompt typing $\rightarrow$ graph cascade pulse with path drawing.
* **Scene 4:** Smooth code container height expansion and syntax token transitions.
* **Scene 5:** Add particle shimmer on 100% export progress; render Grand Brand Outro with masked kinetic typography.

---

## 7. Calibrated Spring Presets Reference

Reference `launch/src/constants/spring-presets.ts`:

```typescript
export const SPRING_PRESETS = {
  // Apple Critically Damped: True zero-overshoot settling for UI windows and scene enters
  smooth: { damping: 26, mass: 1.0, stiffness: 100, overshootClamping: true },
  
  // Snappy Linear / Raycast UI interactions & menu toggles
  snappy: { damping: 18, mass: 0.8, stiffness: 150, overshootClamping: true },
  
  // Gentle cinematic camera zooms and canvas pans
  camera: { damping: 24, mass: 1.2, stiffness: 70, overshootClamping: true },
  
  // Dynamic physical pop for badges, cursor clicks, and accent nodes (deliberate micro-bounce)
  pop: { damping: 12, mass: 0.6, stiffness: 160, overshootClamping: false },
  
  // Fluid morphing for FLIP and line-diff animations
  morph: { damping: 20, mass: 0.9, stiffness: 120, overshootClamping: true },
} as const;
```

---

## 8. Production 4K Export Pipeline Settings

For deterministic 4K 60FPS CLI rendering:
```bash
npx remotion render src/index.ts MotionSlidesLaunch out/motionslides-launch.mp4 \
  --gl=angle \
  --concurrency=8 \
  --crf=16 \
  --pixel-format=yuv420p \
  --scale=2
```
*Note: Scale factor `2` renders the 1080p composition to 3840×2160 (4K UHD) with full sub-pixel antialiasing.*
