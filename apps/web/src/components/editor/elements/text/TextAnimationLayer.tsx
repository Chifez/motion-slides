import { motion } from 'framer-motion';
import type { AnimToken } from './charTokenizer';

interface Props {
  tokens: AnimToken[];
  durationSec: number;
  ease: [number, number, number, number];
  fontFamily: string;
  fontWeight: number;
  fontStyle: string;
  lineHeight: number;
}

/**
 * Absolutely-positioned animation stage rendered on top of the (invisible)
 * layout layer. Unmounted as soon as the transition window closes.
 *
 * All span positions use native offset coordinates (from useTextMagicMove),
 * so they are 1:1 with the layout layer regardless of canvas CSS scale().
 */
export function TextAnimationLayer({
  tokens,
  durationSec,
  ease,
  fontFamily,
  fontWeight,
  fontStyle,
  lineHeight,
}: Props) {
  const travelTransition = {
    duration: durationSec,
    ease,
  } as const;

  // Shared non-animating font styles so characters render identically
  // to the layout spans.
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    display:  'inline-block',
    whiteSpace: 'pre',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily,
    fontWeight,
    fontStyle,
    lineHeight,
  };

  return (
    // This wrapper is positioned relative to layoutContainerRef which is
    // already `position: relative`, so (0, 0) matches perfectly.
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      {tokens.map(token => {
        // ── Continuing: travel from prev position to next position ───────────
        if (token.type === 'continuing') {
          return (
            <motion.span
              key={token.key}
              style={{
                ...baseStyle,
                left:     token.toX,
                top:      token.toY,
                // toFontSize / toColor are the steady-state values; Framer
                // Motion animates FROM the initial prop values below.
                fontSize: token.toFontSize,
                color:    token.toColor,
              }}
              initial={{
                x:        token.dx,
                y:        token.dy,
                fontSize: token.fromFontSize,
                color:    token.fromColor,
                opacity:  1,
              }}
              animate={{
                x:        0,
                y:        0,
                fontSize: token.toFontSize,
                color:    token.toColor,
                opacity:  1,
              }}
              transition={travelTransition}
            >
              {token.char}
            </motion.span>
          );
        }

        // ── Entering: materialise in place during the latter half ────────────
        if (token.type === 'entering') {
          return (
            <motion.span
              key={token.key}
              style={{
                ...baseStyle,
                left:     token.x,
                top:      token.y,
                fontSize: token.fontSize,
                color:    token.color,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: durationSec * 0.45,
                delay:    durationSec * 0.55, // starts just past halfway
                ease:     'easeIn',
              }}
            >
              {token.char}
            </motion.span>
          );
        }

        // ── Leaving: dissolve out during the first half ──────────────────────
        if (token.type === 'leaving') {
          return (
            <motion.span
              key={token.key}
              style={{
                ...baseStyle,
                left:     token.x,
                top:      token.y,
                fontSize: token.fontSize,
                color:    token.color,
              }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{
                duration: durationSec * 0.35,
                ease:     'easeOut',
              }}
            >
              {token.char}
            </motion.span>
          );
        }

        return null;
      })}
    </div>
  );
}
