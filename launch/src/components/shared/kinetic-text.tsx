import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_PRESETS } from '../../constants/spring-presets';

export interface KineticLine {
  text: string;
  /** Optional per-line delay offset in frames, in addition to the automatic stagger. */
  delayFrames?: number;
  /**
   * When set, this word within the line gets a special hero entrance treatment.
   * Applies a depth-punch or space-warp on this word BEFORE the rest of the line cascades.
   */
  heroWord?: string;
}

/**
 * Typography entrance variants — each produces a completely distinct motion signature.
 *
 * - 'space-warp':           Cosmic hero word starts scaled up from center (scale 4.0→1.0 + blur 28px→0) then rest cascades.
 * - 'cascade-slide-right':  Words slide in from the RIGHT in staggered order (translateX +160px→0).
 * - 'masked-rise':          Classic overflow:hidden mask with translateY(110%→0%) + blur settle.
 * - 'depth-punch':          Hero word scales in from depth (scale 1.6→1.0 + blur 14px→0px).
 * - 'horizon-flip':         3D perspective fold: rotateX(-60deg→0deg) + translateY(40px→0px).
 * - 'radial-bloom':         Radial scale bloom with luminescent aura (scale 0.82→1.0 + glowing text-shadow).
 * - 'split-gate':           Even lines slide in from LEFT, odd lines slide in from RIGHT.
 */
export type KineticVariant =
  | 'space-warp'
  | 'cascade-slide-right'
  | 'masked-rise'
  | 'depth-punch'
  | 'horizon-flip'
  | 'radial-bloom'
  | 'split-gate';

/**
 * Exit direction / mechanism for the text block.
 *
 * - 'scroll-up':     Scrolls upward (-280px) simultaneously while editor enters from below.
 * - 'depth-zoom':    Expands past the camera lens (scale→1.25 + blur 12px + opacity 0).
 * - 'corner-pull':   Pulls diagonally toward top-left corner and fades.
 * - 'fade':          Classic fast opacity + slight upward drift (-28px).
 */
export type KineticExit = 'scroll-up' | 'depth-zoom' | 'corner-pull' | 'fade';

export interface KineticTextProps {
  lines: KineticLine[] | string[];
  /** Frame at which the first line begins its entrance. */
  startFrame?: number;
  /** Frame at which the exit begins. Set to a large number to never exit. */
  exitFrame?: number;
  /** Stagger delay in frames between each successive line. Default: 8 */
  staggerFrames?: number;
  /** Typography styles applied to each line span. */
  lineStyle?: React.CSSProperties;
  /** Wrapper container styles. */
  containerStyle?: React.CSSProperties;
  /** Spring config for the entrance animation. Defaults to SPRING_PRESETS.smooth. */
  springConfig?: { damping: number; mass: number; stiffness: number; overshootClamping?: boolean };
  /** Motion variant that controls the entrance choreography. Default: 'masked-rise'. */
  variant?: KineticVariant;
  /** Exit motion style. Default: 'fade'. */
  exitVariant?: KineticExit;
  /**
   * For 'space-warp', 'depth-punch', and 'horizon-flip' variants, the scale the hero word
   * starts from before punching into normal size. Default: 4.0 for space-warp, 1.6 for depth-punch.
   */
  heroScale?: number;
}

/**
 * KineticText — Awwwards-grade masked typography reveal with distinct scene-specific
 * motion variants and directional exit modes.
 */
export function KineticText({
  lines,
  startFrame = 0,
  exitFrame = Infinity,
  staggerFrames = 8,
  lineStyle,
  containerStyle,
  springConfig = SPRING_PRESETS.smooth,
  variant = 'masked-rise',
  exitVariant = 'fade',
  heroScale,
}: KineticTextProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const normalizedLines: KineticLine[] = lines.map((l) =>
    typeof l === 'string' ? { text: l } : l
  );

  const effectiveHeroScale =
    heroScale ?? (variant === 'space-warp' ? 4.0 : 1.6);

  // ── Global Exit State ──────────────────────────────────────────────────────
  const hasExit = typeof exitFrame === 'number' && Number.isFinite(exitFrame);
  const isExiting = hasExit && frame >= exitFrame;
  const localExitFrame = hasExit ? frame - exitFrame : 0;

  const exitSpring = isExiting
    ? spring({
        frame: Math.max(0, localExitFrame),
        fps,
        config: { damping: 18, mass: 0.8, stiffness: 160, overshootClamping: true },
      })
    : 0;

  // Exit transforms — keyed by exitVariant
  const exitTransforms = (() => {
    if (!isExiting) return { translateX: 0, translateY: 0, scale: 1, blur: 0, opacity: 1 };
    switch (exitVariant) {
      case 'scroll-up':
        return {
          translateX: 0,
          translateY: interpolate(exitSpring, [0, 1], [0, -280]),
          scale: 1,
          blur: interpolate(exitSpring, [0, 1], [0, 6]),
          opacity: interpolate(exitSpring, [0, 1], [1, 0]),
        };
      case 'depth-zoom':
        return {
          translateX: 0,
          translateY: 0,
          scale: interpolate(exitSpring, [0, 1], [1, 1.25]),
          blur: interpolate(exitSpring, [0, 1], [0, 12]),
          opacity: interpolate(exitSpring, [0, 1], [1, 0]),
        };
      case 'corner-pull':
        return {
          translateX: interpolate(exitSpring, [0, 1], [0, -180]),
          translateY: interpolate(exitSpring, [0, 1], [0, -120]),
          scale: interpolate(exitSpring, [0, 1], [1, 0.85]),
          blur: interpolate(exitSpring, [0, 1], [0, 8]),
          opacity: interpolate(exitSpring, [0, 1], [1, 0]),
        };
      case 'fade':
      default:
        return {
          translateX: 0,
          translateY: interpolate(exitSpring, [0, 1], [0, -28]),
          scale: 1,
          blur: interpolate(exitSpring, [0, 1], [0, 6]),
          opacity: interpolate(exitSpring, [0, 1], [1, 0]),
        };
    }
  })();

  // ── Radial Bloom wrapper aura (for radial-bloom variant) ──────────────────
  const firstLineEntrance = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: springConfig,
  });
  const bloomAuraOpacity =
    variant === 'radial-bloom'
      ? interpolate(firstLineEntrance, [0, 0.5, 1], [0, 0.35, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const bloomAuraScale =
    variant === 'radial-bloom'
      ? interpolate(firstLineEntrance, [0, 1], [0.5, 2.0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transform: `translate(${exitTransforms.translateX}px, ${exitTransforms.translateY}px) scale(${exitTransforms.scale})`,
        filter: exitTransforms.blur > 0 ? `blur(${exitTransforms.blur}px)` : undefined,
        opacity: exitTransforms.opacity,
        willChange: 'transform, filter, opacity',
        ...containerStyle,
      }}
    >
      {/* Radial Bloom Aura — only for radial-bloom variant */}
      {variant === 'radial-bloom' && bloomAuraOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.45) 0%, rgba(168, 85, 247, 0) 70%)',
            transform: `scale(${bloomAuraScale})`,
            opacity: bloomAuraOpacity,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {normalizedLines.map((line, i) => {
        const lineDelay = (line.delayFrames ?? 0) + i * staggerFrames;
        const entranceFrame = startFrame + lineDelay;
        const localEntranceFrame = frame - entranceFrame;

        // ── 1. SPACE-WARP: Hero word scales down from center of screen (4.0→1.0) ──
        if (variant === 'space-warp') {
          const words = line.text.split(' ');
          const heroTarget = (line.heroWord ?? words[0]).toLowerCase().replace(/[^a-z0-9]/gi, '');
          const heroIndex = words.findIndex(
            (w) => w.toLowerCase().replace(/[^a-z0-9]/gi, '') === heroTarget
          );
          const effectiveHeroIndex = heroIndex >= 0 ? heroIndex : 0;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.28em',
                overflow: 'visible',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {words.map((word, wIdx) => {
                const isHero = wIdx === effectiveHeroIndex;
                // Hero lands first; rest cascades after hero settles
                const wordStagger = isHero ? 0 : 12 + Math.abs(wIdx - effectiveHeroIndex) * 3;
                const wordLocalFrame = localEntranceFrame - wordStagger;

                const heroWarpSpring = spring({
                  frame: Math.max(0, localEntranceFrame),
                  fps,
                  config: { damping: 16, mass: 0.9, stiffness: 140, overshootClamping: false },
                });

                const nonHeroSpring = spring({
                  frame: Math.max(0, wordLocalFrame),
                  fps,
                  config: springConfig,
                });

                // Hero: scale 4.0 → 1.0 (zooms from screen center like warp-speed)
                const wordScale = isHero
                  ? interpolate(heroWarpSpring, [0, 1], [effectiveHeroScale, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : 1;

                const wordBlur = isHero
                  ? interpolate(heroWarpSpring, [0, 0.7, 1], [28, 6, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : interpolate(nonHeroSpring, [0, 1], [8, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });

                const wordOpacity = isHero
                  ? interpolate(Math.max(0, localEntranceFrame), [0, 4], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : interpolate(Math.max(0, wordLocalFrame), [0, 3], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });

                const wordTranslateY = isHero
                  ? 0
                  : interpolate(nonHeroSpring, [0, 1], [26, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });

                const heroTracking = isHero
                  ? `${interpolate(heroWarpSpring, [0, 1], [0.18, -0.02], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}em`
                  : '-0.01em';

                return (
                  <span
                    key={wIdx}
                    style={{
                      display: 'inline-block',
                      transform: `translateY(${wordTranslateY}px) scale(${wordScale})`,
                      filter: wordBlur > 0 ? `blur(${wordBlur}px)` : undefined,
                      opacity: wordOpacity,
                      letterSpacing: heroTracking,
                      willChange: 'transform, filter, opacity',
                      ...lineStyle,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          );
        }

        // ── 2. CASCADE-SLIDE-RIGHT: Words slide in from the right sequentially ──
        if (variant === 'cascade-slide-right') {
          const words = line.text.split(' ');

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.28em',
                overflow: 'visible',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {words.map((word, wIdx) => {
                const wordStagger = wIdx * 4; // 4 frames between words
                const wordLocalFrame = localEntranceFrame - wordStagger;

                const wordSpring = spring({
                  frame: Math.max(0, wordLocalFrame),
                  fps,
                  config: { damping: 18, mass: 0.8, stiffness: 180, overshootClamping: true },
                });

                const wordTranslateX = interpolate(wordSpring, [0, 1], [160, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });

                const wordBlur = interpolate(wordSpring, [0, 1], [10, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });

                const wordOpacity = interpolate(
                  Math.max(0, wordLocalFrame),
                  [0, 3],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                const wordScale = interpolate(wordSpring, [0, 1], [1.08, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });

                return (
                  <span
                    key={wIdx}
                    style={{
                      display: 'inline-block',
                      transform: `translateX(${wordTranslateX}px) scale(${wordScale})`,
                      filter: wordBlur > 0 ? `blur(${wordBlur}px)` : undefined,
                      opacity: wordOpacity,
                      letterSpacing: '-0.02em',
                      willChange: 'transform, filter, opacity',
                      ...lineStyle,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          );
        }

        // ── 3. DEPTH-PUNCH: Word-Level Hero Splitting ───────────────────────
        if (variant === 'depth-punch') {
          const words = line.text.split(' ');
          const heroTarget = (line.heroWord ?? words[0]).toLowerCase().replace(/[^a-z0-9]/gi, '');
          const heroIndex = words.findIndex(
            (w) => w.toLowerCase().replace(/[^a-z0-9]/gi, '') === heroTarget
          );
          const effectiveHeroIndex = heroIndex >= 0 ? heroIndex : 0;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.28em',
                overflow: 'visible',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {words.map((word, wIdx) => {
                const isHero = wIdx === effectiveHeroIndex;
                const wordStagger = isHero ? 0 : 5 + Math.abs(wIdx - effectiveHeroIndex) * 3;
                const wordLocalFrame = localEntranceFrame - wordStagger;

                const wordSpring = spring({
                  frame: Math.max(0, wordLocalFrame),
                  fps,
                  config: isHero
                    ? { damping: 18, mass: 0.85, stiffness: 180, overshootClamping: true }
                    : springConfig,
                });

                const wordOpacity = interpolate(
                  Math.max(0, wordLocalFrame),
                  [0, 3],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                const wordScale = isHero
                  ? interpolate(wordSpring, [0, 1], [effectiveHeroScale, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : 1;

                const wordBlur = isHero
                  ? interpolate(wordSpring, [0, 1], [14, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : interpolate(wordSpring, [0, 1], [8, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });

                const wordTranslateY = isHero
                  ? 0
                  : interpolate(wordSpring, [0, 1], [24, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    });

                return (
                  <span
                    key={wIdx}
                    style={{
                      display: 'inline-block',
                      transform: `translateY(${wordTranslateY}px) scale(${wordScale})`,
                      filter: wordBlur > 0 ? `blur(${wordBlur}px)` : undefined,
                      opacity: wordOpacity,
                      letterSpacing: isHero ? '-0.02em' : '-0.01em',
                      willChange: 'transform, filter, opacity',
                      ...lineStyle,
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          );
        }

        const entranceProgress = spring({
          frame: Math.max(0, localEntranceFrame),
          fps,
          config: springConfig,
        });

        const entranceOpacity = interpolate(
          Math.max(0, localEntranceFrame),
          [0, 3],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // ── Standard Per-variant entrance transform ────────────────────────
        const entranceTransform = (() => {
          switch (variant) {
            case 'horizon-flip': {
              const rotateX = interpolate(entranceProgress, [0, 1], [-60, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const translateY = interpolate(entranceProgress, [0, 1], [40, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const blur = interpolate(entranceProgress, [0, 1], [6, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return { scale: 1, blur, tracking: -0.02, translateX: 0, translateY, rotateX };
            }

            case 'radial-bloom': {
              const scale = interpolate(entranceProgress, [0, 1], [0.82, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const blur = interpolate(entranceProgress, [0, 1], [8, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return { scale, blur, tracking: -0.02, translateX: 0, translateY: 0, rotateX: 0 };
            }

            case 'split-gate': {
              const direction = i % 2 === 0 ? -1 : 1;
              const translateX = interpolate(entranceProgress, [0, 1], [direction * 120, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const blur = interpolate(entranceProgress, [0, 1], [4, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return { scale: 1, blur, tracking: -0.02, translateX, translateY: 0, rotateX: 0 };
            }

            case 'masked-rise':
            default: {
              const translateY = interpolate(entranceProgress, [0, 1], [110, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const blur = interpolate(entranceProgress, [0, 1], [8, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const tracking = interpolate(entranceProgress, [0, 1], [0.04, -0.02], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const scaleX = interpolate(entranceProgress, [0, 1], [0.97, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return { scale: scaleX, blur, tracking, translateX: 0, translateY, rotateX: 0 };
            }
          }
        })();

        // Radial-bloom gets a glowing text-shadow on entrance
        const bloomGlow =
          variant === 'radial-bloom'
            ? `0 0 ${interpolate(entranceProgress, [0, 0.5, 1], [40, 20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px rgba(168, 85, 247, 0.8)`
            : undefined;

        // ── Horizon flip uses perspective wrapper ───────────────────────────
        const needsPerspective = variant === 'horizon-flip' && entranceTransform.rotateX !== 0;

        const innerStyle: React.CSSProperties = {
          display: 'inline-block',
          transform: variant === 'masked-rise'
            ? `translateY(${entranceTransform.translateY}%) scaleX(${entranceTransform.scale})`
            : variant === 'horizon-flip'
            ? `translateY(${entranceTransform.translateY}px) rotateX(${entranceTransform.rotateX}deg)`
            : `translateX(${entranceTransform.translateX}px) scale(${entranceTransform.scale})`,
          filter: entranceTransform.blur > 0 ? `blur(${entranceTransform.blur}px)` : undefined,
          letterSpacing: `${entranceTransform.tracking}em`,
          opacity: entranceOpacity,
          textShadow: bloomGlow,
          willChange: 'transform, filter, opacity',
          ...lineStyle,
        };

        if (variant === 'masked-rise') {
          return (
            <div key={i} style={{ overflow: 'hidden', display: 'block', position: 'relative', zIndex: 1 }}>
              <span style={innerStyle}>{line.text}</span>
            </div>
          );
        }

        if (needsPerspective) {
          return (
            <div
              key={i}
              style={{
                display: 'block',
                perspective: '800px',
                perspectiveOrigin: '50% 50%',
                position: 'relative',
                overflow: 'visible',
                zIndex: 1,
              }}
            >
              <span style={innerStyle}>{line.text}</span>
            </div>
          );
        }

        return (
          <div key={i} style={{ display: 'block', overflow: 'visible', position: 'relative', zIndex: 1 }}>
            <span style={innerStyle}>{line.text}</span>
          </div>
        );
      })}
    </div>
  );
}
