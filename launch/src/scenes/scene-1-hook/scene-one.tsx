import React from 'react';
import { Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppLogo } from '../../components/editor-app/app-logo';
import { CinematicBackground } from '../../components/shared/cinematic-background';
import { KineticText } from '../../components/shared/kinetic-text';
import { SceneTransitionWrapper } from '../../components/shared/scene-transition-wrapper';
import { SPRING_PRESETS } from '../../constants/spring-presets';
import { useAbsoluteFrame } from '../../hooks/use-absolute-frame';

// ─── Scene 1 Art Direction ────────────────────────────────────────────────────
// Badge variants:  "THE PROBLEM" = top drop-in (spring-pop translateY); "THE SOLUTION" = scaleX unroll
// Text variants:   Phase A = depth-punch ('STATIC' scales 1.6→1.0 + blur settle)
//                 Phase B = split-gate ("What if" from left, "slides moved" from right)
// Exit:           Phase A = scroll-up; Phase B = corner-pull

export function SceneOne() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteFrame = useAbsoluteFrame('scene1');

  // ─── Phase timings ────────────────────────────────────────────────────────
  // Phase A: 0 - 82f  (Problem Statement — extended +200ms)
  // Phase B: 72 - 142f (Pivot Question — extended +200ms)
  // Phase C: 130 - 270f (Brand Reveal)

  // Phase A exit fade
  const phaseAExit = interpolate(frame, [62, 80], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase B entrance + exit
  const isPhaseB = frame >= 72 && frame < 142;
  const phaseBProgress = spring({
    frame: frame - 72,
    fps,
    config: SPRING_PRESETS.smooth,
  });
  const phaseBExit = interpolate(frame, [127, 142], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase C: Brand Reveal with Smooth Cubic-Bezier Unfurling
  const isPhaseC = frame >= 130;
  const logoEntranceSpring = spring({
    frame: Math.max(0, frame - 130),
    fps,
    config: { damping: 20, mass: 0.8, stiffness: 160, overshootClamping: true },
  });
  const logoEntranceScale = interpolate(logoEntranceSpring, [0, 1], [0.88, 1]);
  const logoEntranceOpacity = interpolate(logoEntranceSpring, [0, 1], [0, 1]);

  // Logo stays isolated & centered from 130f → 155f.
  // At 155f, logo glides left while wordmark text unfurls to the right.
  const easeOutCubic = Easing.bezier(0.16, 1, 0.3, 1);
  const revealProgress = interpolate(frame, [155, 190], [0, 1], {
    easing: easeOutCubic,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Masked width of text container: expands smoothly from 0px to full wordmark width (~215px)
  const textMaskWidth = interpolate(revealProgress, [0, 1], [0, 215]);
  const textTranslateX = interpolate(revealProgress, [0, 1], [-16, 0]);
  const textOpacity = interpolate(revealProgress, [0, 0.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle & Badges
  const subtitleSpring = spring({ frame: Math.max(0, frame - 190), fps, config: SPRING_PRESETS.smooth });
  const badge1Spring = spring({ frame: Math.max(0, frame - 204), fps, config: SPRING_PRESETS.pop });
  const badge2Spring = spring({ frame: Math.max(0, frame - 216), fps, config: SPRING_PRESETS.pop });
  const badge3Spring = spring({ frame: Math.max(0, frame - 228), fps, config: SPRING_PRESETS.pop });

  // Logo specular sheen sweep across assembled lockup (strictly active 194–226f)
  const isSheenActive = frame >= 194 && frame <= 226;
  const sheenProgress = interpolate(frame, [194, 226], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sheenX = interpolate(sheenProgress, [0, 1], [-90, 340]);

  // Scene exit — forward dolly into Scene 2
  const exitStartFrame = 252;

  return (
    <SceneTransitionWrapper
      entryStartFrame={0}
      exitStartFrame={exitStartFrame}
      exitDurationFrames={18}
    >
      <CinematicBackground absoluteFrame={absoluteFrame}>
        {/* Phase A: Problem Statement — depth-punch on "STATIC", badge drops from top */}
        {frame < 82 && (() => {
          // Badge: top drop-in with warning glow
          const badgeDropSpring = spring({
            frame: Math.max(0, frame - 0),
            fps,
            config: { damping: 18, mass: 0.75, stiffness: 200, overshootClamping: true },
          });
          const badgeDropY = interpolate(badgeDropSpring, [0, 1], [-28, 0]);
          const badgeDropOpacity = interpolate(badgeDropSpring, [0, 0.2], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
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
              {/* "THE PROBLEM" badge — drops from top with danger glow */}
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
                  boxShadow: '0 0 18px rgba(239, 68, 68, 0.3)',
                  opacity: badgeDropOpacity,
                  transform: `translateY(${badgeDropY}px)`,
                  display: 'inline-block',
                }}
              >
                The Problem
              </span>
              {/* Headline: space-warp — "STATIC" hurtles in from cosmic scale 4.0x then rest cascades */}
              <KineticText
                lines={[{ text: 'Static presentations are trapped in the past.', heroWord: 'Static' }]}
                startFrame={4}
                exitFrame={62}
                variant="space-warp"
                exitVariant="scroll-up"
                heroScale={4.0}
                lineStyle={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 64,
                  fontWeight: 400,
                  color: '#ffffff',
                  lineHeight: 1.15,
                  display: 'block',
                }}
              />
            </div>
          );
        })()}

        {/* Phase B: Pivot Question — badge unrolls from center (scaleX), lines split horizontally */}
        {isPhaseB && (() => {
          // Badge: horizontal center unroll (scaleX 0 → 1)
          const unrollSpring = spring({
            frame: Math.max(0, frame - 72),
            fps,
            config: { damping: 22, mass: 0.8, stiffness: 220, overshootClamping: true },
          });
          const badgeScaleX = interpolate(unrollSpring, [0, 1], [0.08, 1]);
          const badgeOpacity = interpolate(unrollSpring, [0, 0.15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // Subtle electric-blue aura expands and fades out with spring
          const auraScale = interpolate(unrollSpring, [0, 0.6, 1], [0.5, 2.5, 2.5]);
          const auraOpacity = interpolate(unrollSpring, [0, 0.3, 0.8], [0, 0.4, 0]);
          return (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: phaseBExit,
                transform: `scale(${interpolate(phaseBProgress, [0, 1], [0.97, 1])})`,
                textAlign: 'center',
                padding: '0 40px',
              }}
            >
              {/* "THE SOLUTION" badge — unrolls from center with electric-blue aura */}
              <div style={{ position: 'relative', marginBottom: 20, display: 'inline-flex', alignItems: 'center' }}>
                {/* Aura ring behind badge */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 20,
                    background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.5) 0%, transparent 70%)',
                    transform: `scale(${auraScale})`,
                    opacity: auraOpacity,
                    pointerEvents: 'none',
                  }}
                />
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
                    fontFamily: 'Inter, system-ui, sans-serif',
                    opacity: badgeOpacity,
                    transform: `scaleX(${badgeScaleX})`,
                    display: 'inline-block',
                  }}
                >
                  The Solution
                </span>
              </div>
              {/* Headline: split-gate — "What if slides moved" from left, "with physical identity?" from right */}
              <KineticText
                lines={['What if slides moved', 'with physical identity?']}
                startFrame={72}
                staggerFrames={10}
                exitFrame={128}
                variant="split-gate"
                exitVariant="corner-pull"
                lineStyle={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 62,
                  fontWeight: 400,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  display: 'block',
                }}
              />
            </div>
          );
        })()}

        {/* Phase C: MotionSlides Brand Reveal with Kinetic Collision Physics */}
        {isPhaseC && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {/* Assembled Brand Lockup with Smooth Cubic-Bezier Unfurling & Specular Sheen */}
            <div
              style={{
                transform: 'scale(1.9)',
                transformOrigin: 'center center',
                marginBottom: 30,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 8,
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {/* Logo Mark: enters centered and glides smoothly left with wrapper */}
              <div
                style={{
                  transform: `scale(${logoEntranceScale})`,
                  opacity: logoEntranceOpacity,
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src={staticFile('logo.png')}
                  alt="MotionSlides"
                  style={{ height: 48, width: 'auto', display: 'block' }}
                />
              </div>

              {/* Wordmark Text: expands to the right of the logo without any overlap */}
              <div
                style={{
                  width: revealProgress >= 1 ? 'auto' : textMaskWidth,
                  overflow: revealProgress >= 1 ? 'visible' : 'hidden',
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: textMaskWidth > 0 ? 8 : 0,
                  opacity: textOpacity,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    transform: `translateX(${textTranslateX}px)`,
                    fontSize: 48 * 0.65,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: '#f4f4f5',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  Motion<span style={{ color: '#a1a1aa' }}>Slides</span>
                </span>
              </div>

              {/* Specular sheen sweep over logo and text — strictly active frames 184–216 */}
              {isSheenActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-20%',
                    left: sheenX,
                    width: 70,
                    height: '140%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent)',
                    pointerEvents: 'none',
                    transform: 'skewX(-20deg)',
                  }}
                />
              )}
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
                opacity: subtitleSpring,
                transform: `translateY(${interpolate(subtitleSpring, [0, 1], [14, 0])}px)`,
              }}
            >
              Magic Move &amp; Architecture Diagrams in the Browser
            </p>

            {/* Feature Badges — staggered pop */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 26,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#60a5fa',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  padding: '5px 14px',
                  borderRadius: 20,
                  opacity: badge1Spring,
                  transform: `scale(${interpolate(badge1Spring, [0, 1], [0.7, 1])})`,
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
                  opacity: badge2Spring,
                  transform: `scale(${interpolate(badge2Spring, [0, 1], [0.7, 1])})`,
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
                  opacity: badge3Spring,
                  transform: `scale(${interpolate(badge3Spring, [0, 1], [0.7, 1])})`,
                }}
              >
                Shiki LCS Code Morphing
              </span>
            </div>
          </div>
        )}
      </CinematicBackground>
    </SceneTransitionWrapper>
  );
}
