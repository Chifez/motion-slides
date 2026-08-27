import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface SceneIntroOverlayProps {
  badge: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  startFrame?: number;
  durationInFrames?: number; // total visible duration before fading out
  style?: React.CSSProperties;
}

/**
 * Centered standalone scene intro interstitial.
 * Appears on a clean dark screen before the editor workspace animates in.
 */
export function SceneIntroOverlay({
  badge,
  badgeColor = '#3b82f6',
  title,
  subtitle,
  startFrame = 0,
  durationInFrames = 70,
  style,
}: SceneIntroOverlayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = frame - startFrame;
  if (elapsed < 0 || elapsed > durationInFrames + 15) return null;

  // Spring entrance
  const entrance = spring({
    frame: Math.max(0, elapsed),
    fps,
    config: {
      damping: 18,
      mass: 0.8,
      stiffness: 160,
    },
  });

  const scale = interpolate(entrance, [0, 1], [0.92, 1]);
  const entranceOpacity = interpolate(entrance, [0, 1], [0, 1]);

  // Smooth exit fade out
  const exitOpacity = interpolate(
    elapsed,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = entranceOpacity * exitOpacity;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        opacity,
        transform: `scale(${scale})`,
        padding: '0 60px',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Category Pill Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(17, 17, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: badgeColor,
            boxShadow: `0 0 10px ${badgeColor}`,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#e4e4e7',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {badge}
        </span>
      </div>

      {/* Main Headline */}
      <h2
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 60,
          fontWeight: 400,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          margin: 0,
          lineHeight: 1.15,
          textShadow: '0 6px 30px rgba(0, 0, 0, 0.9)',
        }}
      >
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 500,
            color: '#a1a1aa',
            marginTop: 14,
            marginBottom: 0,
            letterSpacing: '-0.01em',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
