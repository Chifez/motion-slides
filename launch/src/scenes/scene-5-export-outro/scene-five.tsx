import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppLogo } from '../../components/editor-app/app-logo';
import { ArrowRight, Download, Github, Code2, Sparkles, Star } from 'lucide-react';
import { SceneIntroOverlay } from '../../components/shared/scene-intro-overlay';

/**
 * Scene 5 — 4K Deterministic Export Studio, Open Source Statement & Grand Brand Outro
 *
 * Choreography:
 *   0–140f  : 4K export progress bar fills from 0% → 100%
 * 140–215f  : "100% Free & Open Source" typography reveal
 * 205–390f  : Grand MotionSlides logo, tagline, and "Try it now at github.com/chifez/motionslides" CTA
 */

export function SceneFive() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Phase 1: Export modal (0 → 145f) ────────────────────────────
  const exportProgress = interpolate(frame, [10, 130], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isDone = exportProgress >= 100;

  const modalExitProgress = spring({
    frame: Math.max(0, frame - 132),
    fps,
    config: { damping: 20, mass: 0.8, stiffness: 140 },
  });
  const modalScale = interpolate(modalExitProgress, [0, 1], [1, 0.9]);
  const modalOpacity = interpolate(modalExitProgress, [0, 1], [1, 0]);

  // ─── Phase 2: Open Source Statement (135f → 215f) ────────────────
  const isOssPhase = frame >= 135 && frame < 225;
  const ossSpring = spring({
    frame: Math.max(0, frame - 138),
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 160 },
  });
  const ossScale = interpolate(ossSpring, [0, 1], [0.92, 1]);
  const ossOpacity = interpolate(ossSpring, [0, 1], [0, 1]);

  const ossExit = interpolate(frame, [198, 218], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ─── Phase 3: Grand Brand Logo & CTA (205f onward) ───────────────
  const isOutroPhase = frame >= 205;
  const outroSpring = spring({
    frame: Math.max(0, frame - 208),
    fps,
    config: { damping: 24, mass: 0.9, stiffness: 110, overshootClamping: false },
  });
  const outroOpacity = interpolate(outroSpring, [0, 1], [0, 1]);
  const outroY = interpolate(outroSpring, [0, 1], [24, 0]);
  const outroScale = interpolate(outroSpring, [0, 1], [0.94, 1]);

  // CTA buttons stagger
  const cta1Spring = spring({
    frame: Math.max(0, frame - 235),
    fps,
    config: { damping: 20, mass: 0.8, stiffness: 140 },
  });
  const cta2Spring = spring({
    frame: Math.max(0, frame - 250),
    fps,
    config: { damping: 20, mass: 0.8, stiffness: 140 },
  });

  // Scene exit
  const sceneExit = interpolate(frame, [370, 390], [1, 0], {
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
        opacity: sceneExit,
      }}
    >
      {/* Ambient cool blue halo */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1000,
          height: 600,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)',
        }}
      />

      {/* ── Phase 1: 4K Export Modal (0 - 145f) ─────────────────────── */}
      {frame < 155 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: modalOpacity,
            transform: `scale(${modalScale})`,
          }}
        >
          <div
            style={{
              width: 700,
              borderRadius: 20,
              background: '#111116',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 90px rgba(0,0,0,0.85)',
              padding: '28px 32px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Download size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>Deterministic 4K Studio Export</div>
                  <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>Virtual-Clock Frame Pipelining · 0 Dropped Frames</div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '4px 12px',
                  borderRadius: 20,
                  color: isDone ? '#34d399' : '#60a5fa',
                  background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                  border: `1px solid ${isDone ? '#34d399' : '#60a5fa'}`,
                }}
              >
                {isDone ? 'Complete ✓' : 'Rendering 60 FPS'}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[['Resolution', '3840 × 2160 (4K)'], ['Framerate', '60.00 FPS Perfect'], ['Codec', 'H.264 / ProRes']].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div
              style={{
                background: '#09090b',
                borderRadius: 12,
                padding: '14px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: '#a1a1aa' }}>
                  Frame Pipelining ({Math.round((exportProgress / 100) * 1830)} / 1,830 frames)
                </span>
                <span style={{ color: '#60a5fa', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {Math.round(exportProgress)}%
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: '#1c1c24', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${exportProgress}%`,
                    background: isDone
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : 'linear-gradient(90deg, #2563eb, #60a5fa)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 2: Open Source Interstitial (135 - 220f) ──────────── */}
      {isOssPhase && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            opacity: ossOpacity * ossExit,
            transform: `scale(${ossScale})`,
            padding: '0 40px',
            userSelect: 'none',
          }}
        >
          {/* 100% Open Source Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 20,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 20,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Github size={15} />
            <span>100% Free &amp; Open Source</span>
          </div>

          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: 'italic',
              fontSize: 58,
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Built for developers. Fully open source.
          </h2>

          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 20,
              color: '#a1a1aa',
              marginTop: 14,
              letterSpacing: '-0.01em',
            }}
          >
            Self-host, customize, or contribute to the next evolution of presentations.
          </p>
        </div>
      )}

      {/* ── Phase 3: Grand MotionSlides Logo & CTA (205 - 390f) ──────── */}
      {isOutroPhase && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            opacity: outroOpacity,
            transform: `translateY(${outroY}px) scale(${outroScale})`,
            userSelect: 'none',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Real MotionSlides logo at 2.2× */}
          <div style={{ transform: 'scale(2.2)', transformOrigin: 'center', marginBottom: 36 }}>
            <AppLogo expanded={true} size={48} />
          </div>

          <p
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: '#a1a1aa',
              letterSpacing: '-0.015em',
              margin: 0,
            }}
          >
            Magic Move &amp; Architecture Diagrams in the Browser.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 14, marginTop: 28, alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: cta1Spring,
                transform: `scale(${interpolate(cta1Spring, [0, 1], [0.88, 1])})`,
                background: '#ffffff',
                color: '#000000',
                fontSize: 14,
                fontWeight: 700,
                padding: '11px 24px',
                borderRadius: 9999,
                boxShadow: '0 8px 24px rgba(255,255,255,0.18)',
                cursor: 'pointer',
              }}
            >
              <span>Open App</span>
              <ArrowRight size={15} />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: cta2Spring,
                transform: `scale(${interpolate(cta2Spring, [0, 1], [0.88, 1])})`,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#e4e4e7',
                fontSize: 14,
                fontWeight: 600,
                padding: '11px 22px',
                borderRadius: 9999,
                cursor: 'pointer',
              }}
            >
              <Star size={14} fill="#eab308" color="#eab308" />
              <span>Star on GitHub</span>
            </div>
          </div>

          {/* Prominent "Try it now at github.com/chifez/motionslides" */}
          <div
            style={{
              marginTop: 30,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '8px 18px',
            }}
          >
            <span style={{ fontSize: 13, color: '#a1a1aa' }}>Try it now at</span>
            <span
              style={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: '#60a5fa',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              github.com/chifez/motionslides
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
