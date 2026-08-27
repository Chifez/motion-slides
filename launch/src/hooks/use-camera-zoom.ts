import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ZoomKeyframe {
  startFrame: number;
  scale: number;
  originX?: number | string;
  originY?: number | string;
  /** Spring config override for this specific transition */
  springConfig?: { damping: number; mass: number; stiffness: number };
}

export interface CameraTransform {
  scale: number;
  originX: string;
  originY: string;
  vignetteOpacity: number;
}

const DEFAULT_CAMERA_SPRING = { damping: 28, mass: 1.1, stiffness: 80, overshootClamping: false };
const PUNCHY_CAMERA_SPRING  = { damping: 22, mass: 0.85, stiffness: 120, overshootClamping: false };
const PULLBACK_SPRING       = { damping: 30, mass: 1.3, stiffness: 65, overshootClamping: false };

/**
 * Screen-Studio / Craft Doc style dynamic virtual camera.
 * - Smooth exponential ease-in on zoom-in (punchy spring)
 * - Slow cinematic ease-out on zoom-out (heavy pullback spring)
 * - Vignette depth-of-field overlay when zoomed > 1.1×
 */
export function useCameraZoom(keyframes: ZoomKeyframe[]): CameraTransform {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (keyframes.length === 0) {
    return { scale: 1, originX: '50%', originY: '50%', vignetteOpacity: 0 };
  }

  // Find active keyframe index
  let activeIndex = 0;
  for (let i = 0; i < keyframes.length; i++) {
    if (frame >= keyframes[i].startFrame) activeIndex = i;
  }

  const current = keyframes[activeIndex];
  const prev = activeIndex > 0 ? keyframes[activeIndex - 1] : { ...keyframes[0], scale: 1, originX: '50%', originY: '50%', startFrame: 0 };

  // Choose spring config: use override if provided, else pick punch vs pullback
  const isZoomingIn = current.scale > (prev.scale ?? 1);
  const springConfig = current.springConfig
    ?? (isZoomingIn ? PUNCHY_CAMERA_SPRING : PULLBACK_SPRING);

  const progress = spring({
    frame: frame - current.startFrame,
    fps,
    config: springConfig,
  });

  const scale = interpolate(progress, [0, 1], [prev.scale, current.scale], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const formatOrigin = (val?: number | string, def = '50%'): string => {
    if (val === undefined) return def;
    return typeof val === 'number' ? `${val}px` : val;
  };

  // Interpolate origin smoothly too (avoids jarring jumps when panning)
  const originX = formatOrigin(current.originX);
  const originY = formatOrigin(current.originY);

  // Cinematic vignette — depth of field feel on zoom
  const vignetteOpacity = interpolate(scale, [1.0, 1.25], [0, 0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return { scale, originX, originY, vignetteOpacity };
}
