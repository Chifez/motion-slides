export const VIDEO_CONFIG = {
  fps: 60,
  width: 1920,
  height: 1080,
  totalFrames: 1920, // 32.0 seconds — Full launch cut with tightened slide 3 hold
} as const;

export const SCENE_TIMINGS = {
  scene1: {
    startFrame: 0,
    durationInFrames: 270, // 4.5s (0s – 4.5s) — Hook & Brand Reveal
    title: 'Hook & Brand Reveal',
  },
  scene2: {
    startFrame: 270,
    durationInFrames: 380, // 6.33s (4.5s – 10.83s) — Standalone Intro + Magic Move FLIP Studio
    title: 'Presentation Studio & Magic Move FLIP',
  },
  scene3: {
    startFrame: 650,
    durationInFrames: 370, // 6.16s (10.83s – 17.0s) — Standalone Intro + Shiki Code LCS Morphing
    title: 'Shiki Code LCS Diffing & Morphing',
  },
  scene4: {
    startFrame: 1020,
    durationInFrames: 510, // 8.5s (17.0s – 25.5s) — Standalone Intro + Agentic AI Design Studio
    title: 'AI Design Studio & Live Architecture Generation',
  },
  scene5: {
    startFrame: 1530,
    durationInFrames: 390, // 6.5s (25.5s – 32.0s) — 4K Export, Open Source & Brand Outro
    title: 'Deterministic 4K Export Studio & Brand Outro',
  },
} as const;

/**
 * Explicit cursor position handoff vectors between scene boundaries.
 * Each transition defines where Scene N's cursor exits (exitX/Y) and
 * where Scene N+1's cursor enters (entryX/Y) — these values MUST match
 * to maintain the illusion of uninterrupted mouse control.
 */
export const SCENE_TRANSITION_VECTORS = {
  // Scene 1 → Scene 2: cursor centered at brand reveal → opening editor
  s1_to_s2: { exitX: 960, exitY: 540, entryX: 960, entryY: 540 },
  // Scene 2 → Scene 3: cursor exits at S3 node → enters at Code slide
  s2_to_s3: { exitX: 1180, exitY: 480, entryX: 800, entryY: 450 },
  // Scene 3 → Scene 4: cursor exits at code block → enters at Ask AI button
  s3_to_s4: { exitX: 1050, exitY: 520, entryX: 1485, entryY: 126 },
  // Scene 4 → Scene 5: cursor exits at AI canvas → enters centered in Outro
  s4_to_s5: { exitX: 700, exitY: 450, entryX: 960, entryY: 540 },
} as const;
