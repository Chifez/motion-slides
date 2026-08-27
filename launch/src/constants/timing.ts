export const VIDEO_CONFIG = {
  fps: 60,
  width: 1920,
  height: 1080,
  totalFrames: 2020, // 33.6 seconds — Full launch cut with standalone interstitial intros
} as const;

export const SCENE_TIMINGS = {
  scene1: {
    startFrame: 0,
    durationInFrames: 270, // 4.5s (0s – 4.5s) — Hook & Brand Reveal
    title: 'Hook & Brand Reveal',
  },
  scene2: {
    startFrame: 270,
    durationInFrames: 480, // 8.0s (4.5s – 12.5s) — Standalone Intro + Magic Move FLIP Studio
    title: 'Presentation Studio & Magic Move FLIP',
  },
  scene3: {
    startFrame: 750,
    durationInFrames: 510, // 8.5s (12.5s – 21.0s) — Standalone Intro + Agentic AI Design Studio
    title: 'AI Design Studio & Live Architecture Generation',
  },
  scene4: {
    startFrame: 1260,
    durationInFrames: 370, // 6.16s (21.0s – 27.16s) — Standalone Intro + Shiki Code LCS Morphing
    title: 'Shiki Code LCS Diffing & Morphing',
  },
  scene5: {
    startFrame: 1630,
    durationInFrames: 390, // 6.5s (27.16s – 33.66s) — 4K Export, Open Source & Brand Outro
    title: 'Deterministic 4K Export Studio & Brand Outro',
  },
} as const;
