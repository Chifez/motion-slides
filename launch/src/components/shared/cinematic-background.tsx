import React from 'react';
import { AbsoluteFill, interpolate, interpolateColors } from 'remotion';
import { noise2D } from '@remotion/noise';
import { VIDEO_CONFIG } from '../../constants/timing';

export interface CinematicBackgroundProps {
  /** The absolute global frame (scene.startFrame + localFrame). Use useAbsoluteFrame(). */
  absoluteFrame: number;
  /**
   * Camera vignette intensity: 0 = none, 1 = full cinematic focus.
   * Driven by CameraRig zoom depth — tightens when zoomed in on UI detail.
   */
  vignetteIntensity?: number;
  /** Dot grid opacity (0 = hidden, 1 = full). Default 1. */
  dotGridOpacity?: number;
  children?: React.ReactNode;
}

/**
 * CinematicBackground — living dark canvas for all scenes.
 *
 * Features:
 *  - Continuous ambient halo morphing across scenes via interpolateColors (0–2020f)
 *  - Organic Perlin drift via noise2D (non-repeating, no hard resets at cuts)
 *  - Subtle 3D perspective depth grid
 *  - Dynamic focus vignette (tightens on camera zoom)
 */
export function CinematicBackground({
  absoluteFrame,
  vignetteIntensity = 0,
  dotGridOpacity = 1,
  children,
}: CinematicBackgroundProps) {
  const totalFrames = VIDEO_CONFIG.totalFrames;

  // ─── Global Ambient Halo Color — continuous across all scenes ────────────
  // Uses native Remotion interpolateColors for smooth multi-stop RGBA blending
  const haloColor = interpolateColors(
    absoluteFrame,
    [0, 270, 520, 750, 1000, 1260, 1450, 1630, 1900, totalFrames],
    [
      'rgba(59, 130, 246, 0.08)',   // Scene 1 open: Electric Blue
      'rgba(37, 99, 235, 0.10)',    // Scene 1→2 transition: deepen cobalt
      'rgba(37, 99, 235, 0.10)',    // Scene 2 hold: Royal Cobalt
      'rgba(168, 85, 247, 0.12)',   // Scene 3 open: Luminous Violet
      'rgba(168, 85, 247, 0.12)',   // Scene 3 hold: Violet
      'rgba(96, 165, 250, 0.10)',   // Scene 4 open: Sapphire Cyan
      'rgba(96, 165, 250, 0.10)',   // Scene 4 hold: Cyan
      'rgba(16, 185, 129, 0.12)',   // Scene 5 open: Emerald
      'rgba(255, 255, 255, 0.06)',  // Outro settle: near-white breath
      'rgba(255, 255, 255, 0.04)',  // Full fade
    ]
  );

  // ─── Organic Perlin Drift — non-repeating, continuous cross-scene ─────────
  // noise2D returns [-1, 1]; slow time index prevents visible repetition
  const slowTime = absoluteFrame / 120;
  const haloOffsetX = noise2D('haloX', slowTime, 0) * 30;
  const haloOffsetY = noise2D('haloY', 0, slowTime) * 22;
  // Subtle scale breathe layered on top of position drift
  const haloScale = 1 + noise2D('haloScale', slowTime * 0.4, slowTime * 0.3) * 0.07;

  // ─── Perspective Grid Drift — sub-pixel parallax ─────────────────────────
  // Very slow Y scroll to imply camera depth without drawing attention
  const gridDriftY = noise2D('gridY', slowTime * 0.2, 0) * 8;

  // ─── Dynamic Focus Vignette ───────────────────────────────────────────────
  const vignetteOpacity = interpolate(vignetteIntensity, [0, 1], [0, 0.72], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: '#08090a', overflow: 'hidden' }}>
      {/* ── Ambient Color Halo ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: `calc(35% + ${haloOffsetY}px)`,
          left: '50%',
          transform: `translate(calc(-50% + ${haloOffsetX}px), -50%) scale(${haloScale})`,
          width: 1100,
          height: 680,
          background: `radial-gradient(ellipse at center, ${haloColor} 0%, rgba(8, 9, 10, 0) 70%)`,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />

      {/* ── Perspective Dot Grid ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.032) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          transform: `perspective(1200px) rotateX(12deg) translateY(${gridDriftY}px)`,
          transformOrigin: '50% 0%',
          pointerEvents: 'none',
          opacity: dotGridOpacity,
        }}
      />

      {/* ── Secondary Noise Accent — very subtle warm underpinning ────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translate(-50%, 40%)',
          width: 800,
          height: 400,
          background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.015) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* ── Cinematic Focus Vignette ───────────────────────────────────────── */}
      {vignetteOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 35%, rgba(5, 5, 8, 0.85) 100%)',
            opacity: vignetteOpacity,
          }}
        />
      )}

      {/* ── Scene Content ─────────────────────────────────────────────────── */}
      {children}
    </AbsoluteFill>
  );
}
