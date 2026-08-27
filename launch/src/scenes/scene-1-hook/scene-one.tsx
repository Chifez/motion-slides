import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppLogo } from '../../components/editor-app/app-logo';
import { SPRING_PRESETS } from '../../constants/spring-presets';

export function SceneOne() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase A: 0 - 65 frames (Problem statement) ~1.1s
  const phaseAExit = interpolate(frame, [50, 65], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase B: 60 - 130 frames (Pivot Question) ~1.1s
  const isPhaseB = frame >= 60 && frame < 135;
  const phaseBProgress = spring({
    frame: frame - 60,
    fps,
    config: SPRING_PRESETS.smooth,
  });
  const phaseBExit = interpolate(frame, [115, 130], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase C: 125 - 280 frames (Real MotionSlides Brand Reveal - FULL 2.5 SECONDS)
  const isPhaseC = frame >= 125;
  const emblemSpring = spring({
    frame: frame - 128,
    fps,
    config: {
      damping: 18,
      mass: 0.8,
      stiffness: 180,
    },
  });

  const emblemScale = interpolate(emblemSpring, [0, 1], [0.88, 1]);
  const emblemOpacity = interpolate(emblemSpring, [0, 1], [0, 1]);

  // Scene exit fade into Scene 2
  const sceneExitOpacity = interpolate(frame, [255, 280], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        background: '#08090a',
        overflow: 'hidden',
        opacity: sceneExitOpacity,
      }}
    >
      {/* Subtle Linear diffuse cool halo */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1000,
          height: 600,
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.06) 0%, rgba(8, 9, 10, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle Dot Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      {/* Phase A: Problem Statement */}
      {frame < 70 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: phaseAExit,
            textAlign: 'center',
            padding: '0 40px',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 20,
              padding: '4px 14px',
              marginBottom: 20,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            The Problem
          </span>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 64,
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Static presentations are trapped in the past.
          </h2>
        </div>
      )}

      {/* Phase B: Pivot Question */}
      {isPhaseB && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: phaseBExit,
            transform: `scale(${interpolate(phaseBProgress, [0, 1], [0.95, 1])})`,
            textAlign: 'center',
            padding: '0 40px',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 20,
              padding: '4px 14px',
              marginBottom: 20,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            The Solution
          </span>
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 62,
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            What if slides moved with physical identity?
          </h2>
        </div>
      )}

      {/* Phase C: Real MotionSlides Brand Reveal (Extended ~2.5s) */}
      {isPhaseC && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: emblemOpacity,
            transform: `scale(${emblemScale})`,
            textAlign: 'center',
          }}
        >
          {/* Logo & Wordmark */}
          <div style={{ transform: 'scale(1.9)', transformOrigin: 'center center', marginBottom: 30 }}>
            <AppLogo expanded={true} size={48} />
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 22,
              fontWeight: 500,
              color: '#a1a1aa',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Magic Move &amp; Architecture Diagrams in the Browser
          </p>

          {/* Feature Badges */}
          <div style={{ display: 'flex', gap: 10, marginTop: 26, fontFamily: 'Inter, system-ui, sans-serif' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#60a5fa',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '5px 14px',
                borderRadius: 20,
              }}
            >
              FLIP State Engine
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#c084fc',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                padding: '5px 14px',
                borderRadius: 20,
              }}
            >
              Agentic AI Studio
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '5px 14px',
                borderRadius: 20,
              }}
            >
              Shiki LCS Code Morphing
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
