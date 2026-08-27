export const SPRING_PRESETS = {
  // Apple Critically Damped: Zero overshoot, ultra-smooth settling
  smooth: {
    damping: 20,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
  },
  // Snappy Linear / Raycast UI interactions
  snappy: {
    damping: 16,
    mass: 0.8,
    stiffness: 140,
    overshootClamping: false,
  },
  // Gentle camera zooms and canvas pans
  camera: {
    damping: 24,
    mass: 1.2,
    stiffness: 70,
    overshootClamping: false,
  },
  // Subtle physical pop for badges, cursors and nodes
  pop: {
    damping: 12,
    mass: 0.6,
    stiffness: 160,
    overshootClamping: false,
  },
  // Fluid morphing for FLIP and line-diff animations
  morph: {
    damping: 18,
    mass: 0.9,
    stiffness: 110,
    overshootClamping: false,
  },
} as const;
