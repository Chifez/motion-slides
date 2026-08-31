import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticText, KineticVariant, KineticExit } from './kinetic-text';

export interface SceneIntroOverlayProps {
  badge: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  startFrame?: number;
  durationInFrames?: number;
  style?: React.CSSProperties;
  /** Headline entrance motion variant. */
  textVariant?: KineticVariant;
  /** Exit mode for the entire overlay (text + badge). */
  exitVariant?: KineticExit;
  /** Per-scene badge entrance style. Default: 'spring-pop'. */
  badgeVariant?: 'spring-pop' | 'elastic-drop' | 'terminal-brackets' | 'sparkle-starburst' | 'magnetic-stamp';
  /** For depth-punch/horizon-flip/space-warp: starting hero scale. */
  heroScale?: number;
}

/**
 * SceneIntroOverlay — Centered scene intro interstitial.
 *
 * Fully differentiated per scene via:
 *  - `textVariant`: Controls how headline text enters (see KineticText for options)
 *  - `badgeVariant`: Controls how the category pill badge enters
 *  - `exitVariant`:  Controls how the whole overlay (badge + text + subtitle) exits as a unit
 *
 * Badge variant chart:
 *  Scene 1 (Problem):  spring-pop (top drop-in, red)
 *  Scene 1 (Solution): spring-pop (center unroll via scaleX, blue)
 *  Scene 2: elastic-drop         (bounce settle + glass sheen sweep)
 *  Scene 3: terminal-brackets    ([ ] bracket expansion with cyan glyph)
 *  Scene 4: sparkle-starburst    (spinning star icon + violet aura bloom)
 *  Scene 5: magnetic-stamp       (scale 1.25→1.0 downward press, green)
 */
export function SceneIntroOverlay({
  badge,
  badgeColor = '#3b82f6',
  title,
  subtitle,
  startFrame = 0,
  durationInFrames = 78,
  style,
  textVariant = 'masked-rise',
  exitVariant = 'fade',
  badgeVariant = 'spring-pop',
  heroScale = 1.6,
}: SceneIntroOverlayProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = frame - startFrame;
  if (elapsed < 0 || elapsed > durationInFrames + 15) return null;

  // ── Unified Exit Animation ────────────────────────────────────────────────
  const isExiting = elapsed >= durationInFrames - 18;
  const exitSpring = isExiting
    ? spring({
        frame: Math.max(0, elapsed - (durationInFrames - 18)),
        fps,
        config: { damping: 18, mass: 0.8, stiffness: 160, overshootClamping: true },
      })
    : 0;

  // For scroll-up, the entire intro card (badge + headline + subtitle) pushes up together
  const exitTranslateY = exitVariant === 'scroll-up'
    ? interpolate(exitSpring, [0, 1], [0, -280])
    : 0;

  const exitOpacity = interpolate(
    elapsed,
    [durationInFrames - 18, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const textExitLocalFrame = durationInFrames - 14;

  // ── Badge entrance spring (shared base) ──────────────────────────────────
  const badgeSpring = spring({
    frame: Math.max(0, elapsed),
    fps,
    config: { damping: 20, mass: 0.7, stiffness: 180, overshootClamping: true },
  });

  // ── Badge-specific entrance transform ────────────────────────────────────
  const badgeTransform = (() => {
    switch (badgeVariant) {
      case 'elastic-drop': {
        const elasticSpring = spring({
          frame: Math.max(0, elapsed),
          fps,
          config: { damping: 12, mass: 0.7, stiffness: 200, overshootClamping: false },
        });
        const translateY = interpolate(elasticSpring, [0, 1], [-35, 0]);
        const opacity = interpolate(elasticSpring, [0, 0.15], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return { translateY, translateX: 0, scaleX: 1, scaleY: 1, opacity, rotate: 0 };
      }

      case 'terminal-brackets': {
        const scaleX = interpolate(badgeSpring, [0, 1], [0.1, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(badgeSpring, [0, 0.2], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return { translateY: 0, translateX: 0, scaleX, scaleY: 1, opacity, rotate: 0 };
      }

      case 'sparkle-starburst': {
        const stiffSpring = spring({
          frame: Math.max(0, elapsed),
          fps,
          config: { damping: 14, mass: 0.6, stiffness: 240, overshootClamping: false },
        });
        const rotate = interpolate(stiffSpring, [0, 1], [180, 0]);
        const scale = interpolate(stiffSpring, [0, 1], [0.4, 1]);
        const opacity = interpolate(stiffSpring, [0, 0.25], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return { translateY: 0, translateX: 0, scaleX: scale, scaleY: scale, opacity, rotate };
      }

      case 'magnetic-stamp': {
        const stampSpring = spring({
          frame: Math.max(0, elapsed),
          fps,
          config: { damping: 22, mass: 0.9, stiffness: 260, overshootClamping: true },
        });
        const scale = interpolate(stampSpring, [0, 1], [1.25, 1]);
        const translateY = interpolate(stampSpring, [0, 1], [-20, 0]);
        const opacity = interpolate(stampSpring, [0, 0.1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return { translateY, translateX: 0, scaleX: scale, scaleY: scale, opacity, rotate: 0 };
      }

      case 'spring-pop':
      default: {
        const scale = interpolate(badgeSpring, [0, 1], [0.85, 1]);
        const opacity = interpolate(badgeSpring, [0, 1], [0, 1]);
        return { translateY: 0, translateX: 0, scaleX: scale, scaleY: scale, opacity, rotate: 0 };
      }
    }
  })();

  // ── Badge sheen sweep (elastic-drop only — glass border highlight) ────────
  const sheenProgress = interpolate(elapsed, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sheenX = interpolate(sheenProgress, [0, 1], [-100, 200]);

  // ── Sparkle starburst aura (sparkle-starburst variant only) ──────────────
  const starburstAura = badgeVariant === 'sparkle-starburst'
    ? spring({ frame: Math.max(0, elapsed), fps, config: { damping: 20, mass: 0.7, stiffness: 160 } })
    : 0;
  const auraOpacity = badgeVariant === 'sparkle-starburst'
    ? interpolate(starburstAura, [0, 0.4, 1], [0, 0.5, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  const auraScale = badgeVariant === 'sparkle-starburst'
    ? interpolate(starburstAura, [0, 1], [0.5, 3.0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  const badgeBoxShadow = (() => {
    if (badgeVariant === 'magnetic-stamp') {
      return `0 0 24px ${badgeColor}55, 0 8px 24px rgba(0, 0, 0, 0.6)`;
    }
    if (badgeVariant === 'sparkle-starburst') {
      return `0 0 20px ${badgeColor}88, 0 8px 24px rgba(0, 0, 0, 0.6)`;
    }
    return '0 8px 24px rgba(0, 0, 0, 0.6)';
  })();

  // ── Dynamic Camera Focus for cascade-slide-right ─────────────────────────
  // Zooms into incoming words (1.0 -> 1.18) focused slightly to the right, then eases back out to 1.0
  const cascadeZoomIn = spring({
    frame: Math.max(0, elapsed),
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 140 },
  });
  const cascadeZoomOut = spring({
    frame: Math.max(0, elapsed - 36),
    fps,
    config: { damping: 20, mass: 0.85, stiffness: 120 },
  });

  const headlineCameraScale = textVariant === 'cascade-slide-right'
    ? interpolate(cascadeZoomIn, [0, 1], [1.0, 1.16]) * (1 - interpolate(cascadeZoomOut, [0, 1], [0, 0.138]))
    : 1;

  const headlineCameraOriginX = textVariant === 'cascade-slide-right'
    ? `${interpolate(cascadeZoomOut, [0, 1], [62, 50])}%`
    : '50%';

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
        opacity: exitOpacity,
        transform: exitTranslateY !== 0 ? `translateY(${exitTranslateY}px)` : undefined,
        padding: '0 60px',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
        willChange: 'transform, opacity',
        ...style,
      }}
    >
      {/* ── Category Pill Badge ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(17, 17, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
          boxShadow: badgeBoxShadow,
          marginBottom: 20,
          opacity: badgeTransform.opacity,
          transform: `translate(${badgeTransform.translateX}px, ${badgeTransform.translateY}px) scaleX(${badgeTransform.scaleX}) scaleY(${badgeTransform.scaleY}) rotate(${badgeTransform.rotate}deg)`,
          overflow: 'hidden',
        }}
      >
        {/* Glass sheen sweep — elastic-drop only */}
        {(badgeVariant === 'elastic-drop' || badgeVariant === 'spring-pop') && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: sheenX,
              width: 60,
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Sparkle starburst aura ring */}
        {badgeVariant === 'sparkle-starburst' && auraOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 20,
              background: `radial-gradient(ellipse at center, ${badgeColor}66 0%, transparent 70%)`,
              transform: `scale(${auraScale})`,
              opacity: auraOpacity,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Terminal brackets for terminal-brackets variant */}
        {badgeVariant === 'terminal-brackets' && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: badgeColor,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.05em',
              opacity: 0.7,
            }}
          >
            [
          </span>
        )}

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
            fontFamily: badgeVariant === 'terminal-brackets'
              ? "'JetBrains Mono', monospace"
              : 'Inter, system-ui, sans-serif',
          }}
        >
          {badge}
        </span>

        {/* Terminal brackets closing */}
        {badgeVariant === 'terminal-brackets' && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: badgeColor,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.05em',
              opacity: 0.7,
            }}
          >
            ]
          </span>
        )}
      </div>

      {/* ── Main Headline — with Dynamic Camera Tracking Container ──────── */}
      <div
        style={{
          transform: headlineCameraScale !== 1 ? `scale(${headlineCameraScale})` : undefined,
          transformOrigin: `${headlineCameraOriginX} 50%`,
          willChange: 'transform',
          marginBottom: subtitle ? 14 : 0,
        }}
      >
        <KineticText
          lines={[{ text: title }]}
          startFrame={startFrame + 4}
          exitFrame={startFrame + textExitLocalFrame}
          variant={textVariant}
          exitVariant={exitVariant === 'scroll-up' ? 'fade' : exitVariant}
          heroScale={heroScale}
          lineStyle={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 60,
            fontWeight: 400,
            color: '#ffffff',
            lineHeight: 1.15,
            textShadow: '0 6px 30px rgba(0, 0, 0, 0.9)',
            display: 'block',
          }}
        />
      </div>

      {/* ── Subtitle — KineticText with stagger delay ──────────────────── */}
      {subtitle && (
        <KineticText
          lines={[{ text: subtitle }]}
          startFrame={startFrame + (textVariant === 'cascade-slide-right' ? 36 : 12)}
          exitFrame={startFrame + textExitLocalFrame + 4}
          variant={textVariant === 'depth-punch' || textVariant === 'space-warp' || textVariant === 'cascade-slide-right' ? 'masked-rise' : textVariant}
          exitVariant={exitVariant === 'scroll-up' ? 'fade' : exitVariant}
          lineStyle={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 500,
            color: '#a1a1aa',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)',
            display: 'block',
          }}
        />
      )}
    </div>
  );
}
