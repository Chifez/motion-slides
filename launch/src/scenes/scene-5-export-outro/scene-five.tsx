import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppLogo } from '../../components/editor-app/app-logo';
import { ArrowRight, Download, Github, Star, ExternalLink } from 'lucide-react';
import { CinematicBackground } from '../../components/shared/cinematic-background';
import { KineticText } from '../../components/shared/kinetic-text';
import { CursorPointer } from '../../components/shared/cursor-pointer';
import { SceneTransitionWrapper } from '../../components/shared/scene-transition-wrapper';
import { useAbsoluteFrame } from '../../hooks/use-absolute-frame';

// ─── Scene 5 Art Direction ────────────────────────────────────────────────────
// Badge:    magnetic-stamp (scale 1.25→1.0 downward press, emerald neon glow)
// Text:     split-gate on OSS statement (lines close from left+right like sliding doors)
// Outro:    depth-punch on tagline for maximum monumental visual weight

/**
 * Scene 5 — 4K Deterministic Export Studio, Open Source Statement & Grand Brand Outro
 *
 * Choreography:
 *   0–140f  : 4K export progress bar fills from 0% → 100%
 * 140–215f  : "100% Free & Open Source" typography reveal (KineticText)
 * 205–390f  : Grand MotionSlides logo, tagline (KineticText), and CTA
 */

export function SceneFive() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteFrame = useAbsoluteFrame('scene5');

  // ─── Phase 1: Export modal (0 → 145f) ────────────────────────────────────
  const exportProgress = interpolate(frame, [10, 130], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const isDone = exportProgress >= 100;

  const modalExitProgress = spring({
    frame: Math.max(0, frame - 132),
    fps,
    config: { damping: 22, mass: 0.85, stiffness: 130, overshootClamping: true },
  });
  const modalScale = interpolate(modalExitProgress, [0, 1], [1, 0.9]);
  const modalOpacity = interpolate(modalExitProgress, [0, 1], [1, 0]);

  // Progress bar shimmer on completion
  const shimmerProgress = interpolate(frame, [132, 155], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shimmerX = interpolate(shimmerProgress, [0, 1], [-200, 800]);

  // ─── Phase 2: Open Source Statement (135f → 235f — extended +200ms) ─────
  const isOssPhase = frame >= 135 && frame < 235;
  const ossSpring = spring({
    frame: Math.max(0, frame - 138),
    fps,
    config: { damping: 22, mass: 0.85, stiffness: 150, overshootClamping: true },
  });
  const ossScale = interpolate(ossSpring, [0, 1], [0.92, 1]);
  const ossOpacity = interpolate(ossSpring, [0, 1], [0, 1]);
  const ossExit = interpolate(frame, [212, 230], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ─── Phase 3: Grand Brand Logo & CTA (218f onward) ───────────────────────
  const isOutroPhase = frame >= 218;
  const outroSpring = spring({
    frame: Math.max(0, frame - 220),
    fps,
    config: { damping: 26, mass: 1.0, stiffness: 100, overshootClamping: true },
  });
  const outroOpacity = interpolate(outroSpring, [0, 1], [0, 1]);
  const outroY = interpolate(outroSpring, [0, 1], [24, 0]);
  const outroScale = interpolate(outroSpring, [0, 1], [0.94, 1]);

  // CTA buttons stagger
  const cta1Spring = spring({ frame: Math.max(0, frame - 245), fps, config: { damping: 20, mass: 0.8, stiffness: 140, overshootClamping: true } });
  const cta2Spring = spring({ frame: Math.max(0, frame - 255), fps, config: { damping: 20, mass: 0.8, stiffness: 140, overshootClamping: true } });
  const urlPillSpring = spring({ frame: Math.max(0, frame - 260), fps, config: { damping: 20, mass: 0.8, stiffness: 140, overshootClamping: true } });

  // URL Button Click Animation (frame 274)
  const isUrlClicked = frame >= 274 && frame <= 295;
  const urlClickProgress = spring({
    frame: Math.max(0, frame - 274),
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 260 },
  });
  const urlScale = frame >= 274 ? interpolate(urlClickProgress, [0, 0.4, 1], [0.93, 1.04, 1]) : 1;

  // Specular sheen sweep on logo immediately after URL button is clicked (frames 278 → 318)
  const isLogoSheenActive = frame >= 278 && frame <= 318;
  const logoSheenProgress = interpolate(frame, [278, 318], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoSheenX = interpolate(logoSheenProgress, [0, 1], [-80, 260]);

  // ─── Outro Cursor Waypoints ───────────────────────────────────────────────
  const outroCursorWaypoints = [
    { frame: 235, x: 1350, y: 860, cursorState: 'default' as const },
    { frame: 260, x: 1040, y: 700, cursorState: 'pointer' as const }, // Gliding towards URL button
    { frame: 274, x: 960, y: 676, click: true, cursorState: 'pointer' as const }, // Click "Try at https:..." button
    { frame: 290, x: 1080, y: 760, cursorState: 'default' as const }, // Smooth glide away as logo shimmers
    { frame: 380, x: 1120, y: 780, cursorState: 'default' as const },
  ];

  // This is the final scene — no exit transition needed
  return (
    <SceneTransitionWrapper entryStartFrame={0}>
      <CinematicBackground absoluteFrame={absoluteFrame}>
        {/* ── Phase 1: 4K Export Modal (0 - 145f) ──────────────────────────── */}
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
                      width: 36, height: 36, borderRadius: 10,
                      background: '#2563eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                    textTransform: 'uppercase', padding: '4px 12px', borderRadius: 20,
                    color: isDone ? '#34d399' : '#60a5fa',
                    background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                    border: `1px solid ${isDone ? '#34d399' : '#60a5fa'}`,
                  }}
                >
                  {isDone ? 'Complete ✓' : 'Rendering 60 FPS'}
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[['Resolution', '3840 × 2160 (4K)'], ['Framerate', '60.00 FPS Perfect'], ['Codec', 'H.264 / ProRes']].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      background: '#09090b', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10, padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: 10, color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f4f4f5', marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  background: '#09090b', borderRadius: 12,
                  padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)',
                  position: 'relative', overflow: 'hidden',
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
                <div style={{ height: 7, borderRadius: 4, background: '#1c1c24', overflow: 'hidden', position: 'relative' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${exportProgress}%`,
                      background: isDone
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : 'linear-gradient(90deg, #2563eb, #60a5fa)',
                      borderRadius: 4,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Shimmer on completion */}
                    {isDone && (
                      <div
                        style={{
                          position: 'absolute', top: 0, left: shimmerX, width: 80, height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Phase 2: Open Source Interstitial (135 - 220f) ────────────────── */}
        {isOssPhase && (() => {
          // Magnetic stamp entrance for the GitHub badge (scale 1.25→1.0 with emerald glow)
          const stampSpring = spring({
            frame: Math.max(0, frame - 138),
            fps,
            config: { damping: 22, mass: 0.9, stiffness: 260, overshootClamping: true },
          });
          const badgeStampScale = interpolate(stampSpring, [0, 1], [1.25, 1]);
          const badgeStampY = interpolate(stampSpring, [0, 1], [-20, 0]);
          const badgeStampOpacity = interpolate(stampSpring, [0, 0.1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                opacity: ossOpacity * ossExit, transform: `scale(${ossScale})`,
                padding: '0 40px', userSelect: 'none',
              }}
            >
              {/* GitHub badge — magnetic stamp: slams down from above at 1.25× */}
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 16px', borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif',
                  boxShadow: '0 0 28px rgba(16, 185, 129, 0.45), 0 8px 24px rgba(0,0,0,0.6)',
                  opacity: badgeStampOpacity,
                  transform: `translateY(${badgeStampY}px) scale(${badgeStampScale})`,
                }}
              >
                <Github size={15} />
                <span>100% Free &amp; Open Source</span>
              </div>

              {/* OSS Headline: split-gate — "Built for developers." from left, "Fully open source." from right */}
              <KineticText
                lines={['Built for developers.', 'Fully open source.']}
                startFrame={140}
                staggerFrames={10}
                variant="split-gate"
                exitVariant="fade"
                lineStyle={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 58,
                  fontWeight: 400,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  display: 'block',
                }}
                containerStyle={{ marginBottom: 14 }}
              />

              <KineticText
                lines={['Self-host, customize, or contribute to the next evolution of presentations.']}
                startFrame={152}
                variant="masked-rise"
                lineStyle={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  color: '#a1a1aa',
                  letterSpacing: '-0.01em',
                  display: 'block',
                }}
              />
            </div>
          );
        })()}

        {/* ── Phase 3: Grand MotionSlides Logo & CTA (205 - 390f) ─────────── */}
        {isOutroPhase && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', textAlign: 'center',
              opacity: outroOpacity,
              transform: `translateY(${outroY}px) scale(${outroScale})`,
              userSelect: 'none', fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {/* MotionSlides logo at 2.2× with specular sheen after CTA buttons */}
            <div
              style={{
                transform: 'scale(2.2)',
                transformOrigin: 'center',
                marginBottom: 36,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 8,
                padding: '4px 6px',
              }}
            >
              <AppLogo expanded={true} size={48} />
              {/* Specular sheen sweep over logo — runs once after CTA buttons appear */}
              {isLogoSheenActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-20%',
                    left: logoSheenX,
                    width: 60,
                    height: '140%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)',
                    pointerEvents: 'none',
                    transform: 'skewX(-20deg)',
                  }}
                />
              )}
            </div>

            {/* Tagline — depth-punch for monumental visual weight */}
            <KineticText
              lines={['Magic Move & Architecture Diagrams in the Browser.']}
              startFrame={212}
              variant="depth-punch"
              heroScale={1.3}
              lineStyle={{
                fontSize: 22,
                fontWeight: 500,
                color: '#a1a1aa',
                letterSpacing: '-0.015em',
                display: 'block',
              }}
              containerStyle={{ marginBottom: 28 }}
            />

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  opacity: cta1Spring,
                  transform: `scale(${interpolate(cta1Spring, [0, 1], [0.88, 1])})`,
                  background: '#ffffff', color: '#000000',
                  fontSize: 14, fontWeight: 700,
                  padding: '11px 24px', borderRadius: 9999,
                  boxShadow: '0 8px 24px rgba(255,255,255,0.18)',
                  cursor: 'pointer',
                }}
              >
                <span>Open App</span>
                <ArrowRight size={15} />
              </div>

              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: cta2Spring,
                  transform: `scale(${interpolate(cta2Spring, [0, 1], [0.88, 1])})`,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e4e4e7', fontSize: 14, fontWeight: 600,
                  padding: '11px 22px', borderRadius: 9999, cursor: 'pointer',
                }}
              >
                <Star size={14} fill="#eab308" color="#eab308" />
                <span>Star on GitHub</span>
              </div>
            </div>

            {/* URL Interactive Pill Button */}
            <div
              style={{
                marginTop: 26,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                opacity: urlPillSpring,
                transform: `scale(${urlScale * interpolate(urlPillSpring, [0, 1], [0.9, 1])})`,
                background: isUrlClicked ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                border: isUrlClicked ? '1px solid rgba(96, 165, 250, 0.55)' : '1px solid rgba(255, 255, 255, 0.10)',
                borderRadius: 12,
                padding: '9px 20px',
                boxShadow: isUrlClicked
                  ? '0 0 24px rgba(59, 130, 246, 0.4), 0 4px 14px rgba(0, 0, 0, 0.4)'
                  : '0 4px 14px rgba(0, 0, 0, 0.25)',
                transition: 'background 0.1s ease, border-color 0.1s ease',
                cursor: 'pointer',
              }}
            >
              <Github size={14} color="#a1a1aa" />
              <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>Try at</span>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#60a5fa',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                https://github.com/Chifez/motion-slides
              </span>
              <ExternalLink size={13} color="#60a5fa" />
            </div>
          </div>
        )}

        {/* ── Cursor Layer for Outro (frames 205f+) ── */}
        {isOutroPhase && <CursorPointer waypoints={outroCursorWaypoints} />}
      </CinematicBackground>
    </SceneTransitionWrapper>
  );
}
