export const SPRING_PRESETS = {
  // Apple Critically Damped: True zero-overshoot settling for UI windows and scene enters
  // overshootClamping: true ensures deterministic settle without bounce
  smooth: {
    damping: 26,
    mass: 1.0,
    stiffness: 100,
    overshootClamping: true,
  },
  // Snappy Linear / Raycast UI interactions & menu toggles
  snappy: {
    damping: 18,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: true,
  },
  // Gentle cinematic camera zooms and canvas pans
  camera: {
    damping: 24,
    mass: 1.2,
    stiffness: 70,
    overshootClamping: true,
  },
  // Dynamic physical pop for badges, cursor clicks, and accent nodes
  // overshootClamping: false is intentional — gives lively micro-bounce on flick interactions
  pop: {
    damping: 12,
    mass: 0.6,
    stiffness: 160,
    overshootClamping: false,
  },
  // Fluid morphing for FLIP and line-diff animations
  morph: {
    damping: 20,
    mass: 0.9,
    stiffness: 120,
    overshootClamping: true,
  },
} as const;
