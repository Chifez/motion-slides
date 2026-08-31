import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SceneTransitionWrapperProps {
  children: React.ReactNode;
  /**
   * Local frame at which the scene entry animation begins (usually 0).
   * Entry: scale(0.94) → scale(1.0) with critically damped spring.
   */
  entryStartFrame?: number;
  /**
   * Local frame at which the scene exit animation begins.
   * Exit: scale(1.0) → scale(1.06) + blur(8px) + opacity(0).
   * Set to a large value to disable the exit (e.g., final scene).
   */
  exitStartFrame?: number;
  /** Duration of the exit blend in frames. Default: 20 */
  exitDurationFrames?: number;
  style?: React.CSSProperties;
}

/**
 * SceneTransitionWrapper — standardized Z-axis cinematic push/pull for all scenes.
 *
 * Entry: Scene emerges from depth → scale(0.94) + opacity(0) → scale(1.0) + opacity(1)
 *        using Apple critically damped spring. No abrupt pop, no linear tween.
 *
 * Exit:  Scene accelerates toward camera → scale(1.0) → scale(1.06) with
 *        depth-of-field blur (filter: blur(8px)) and fade to opacity(0).
 *        This creates the Z-axis dolly push illusion where Scene N+1 emerges
 *        through the departing content.
 *
 * ⚠️ Important: exitStartFrame must be passed as a local scene frame number.
 */
export function SceneTransitionWrapper({
  children,
  entryStartFrame = 0,
  exitStartFrame = Infinity,
  exitDurationFrames = 20,
  style,
}: SceneTransitionWrapperProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Entry spring ────────────────────────────────────────────────────────
  const entrySpring = spring({
    frame: Math.max(0, frame - entryStartFrame),
    fps,
    config: { damping: 26, mass: 1.0, stiffness: 100, overshootClamping: true },
  });
  const entryScale = interpolate(entrySpring, [0, 1], [0.94, 1]);
  const entryOpacity = interpolate(entrySpring, [0, 1], [0, 1]);

  // ── Exit dolly ──────────────────────────────────────────────────────────
  const hasExit = typeof exitStartFrame === 'number' && Number.isFinite(exitStartFrame);
  const isExiting = hasExit && frame >= exitStartFrame;

  const exitProgress = hasExit
    ? interpolate(
        frame,
        [exitStartFrame, exitStartFrame + exitDurationFrames],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  const exitScale = hasExit && isExiting ? interpolate(exitProgress, [0, 1], [1, 1.06]) : 1;
  const exitBlur = hasExit && isExiting ? interpolate(exitProgress, [0, 1], [0, 8]) : 0;
  const exitOpacity = hasExit && isExiting ? interpolate(exitProgress, [0, 1], [1, 0]) : 1;

  // ── Compose ─────────────────────────────────────────────────────────────
  const finalScale = entryScale * exitScale;
  const finalOpacity = entryOpacity * exitOpacity;
  const finalBlur = exitBlur;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${finalScale})`,
        opacity: finalOpacity,
        filter: finalBlur > 0 ? `blur(${finalBlur}px)` : undefined,
        willChange: 'transform, opacity, filter',
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
