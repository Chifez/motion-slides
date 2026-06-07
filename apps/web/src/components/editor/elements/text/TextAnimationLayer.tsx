import { motion, AnimatePresence } from 'framer-motion';
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
 * ghost layer. Mirrors CodeElement's stage layer exactly.
 *
 * Phase ordering (same as CodeElement):
 *   Phase 0 (immediate):        leaving tokens fade to opacity 0
 *   Phase 1 (delay = exitDur):  continuing tokens fly via FLIP (x:dx→0, y:dy→0)
 *   Phase 2 (delay = enterDelay): entering tokens fade in (with stagger)
 *
 * WHY transitionId IS IN THE KEY (see CodeElement line 367–373):
 *   Framer Motion's `initial` only fires on component MOUNT. Without transitionId
 *   in the key, a span stays mounted across transitions (stable key), so
 *   `initial={{ x:dx, y:dy }}` is silently ignored on re-renders — the token
 *   snaps. transitionId forces a remount on every transition, guaranteeing
 *   `initial` fires and the FLIP offset is applied correctly.
 *
 * All positions are native offset coordinates (from useTextMagicMove),
 * immune to the canvas CSS scale() transform.
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
  const exitDur    = durationSec * 0.20;
  const layoutDur  = durationSec * 0.55;
  const enterDur   = durationSec * 0.30;
  const enterDelay = exitDur + layoutDur * 0.70;

  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1];
  const EASE_OUT: [number, number, number, number]    = [0.25, 0.46, 0.45, 0.94];

  const baseStyle: React.CSSProperties = {
    position:      'absolute',
    display:       'inline-block',
    whiteSpace:    'pre',
    pointerEvents: 'none',
    userSelect:    'none',
    fontFamily,
    fontWeight,
    fontStyle,
    lineHeight,
  };

  return (
    <div
      style={{
        position:      'absolute',
        inset:         0,
        overflow:      'visible',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {tokens.map(token => {

          if (token.type === 'leaving') {
            return (
              <motion.span

                key={`${token.key}__rm${token.transitionId}`}
                style={{
                  ...baseStyle,
                  left:     token.x,
                  top:      token.y,
                  fontSize: token.fontSize,
                  color:    token.color,
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: exitDur, ease: EASE_IN_OUT }}
              >
                {token.char}
              </motion.span>
            );
          }


          if (token.type === 'entering') {
            return (
              <motion.span
                key={`${token.key}__add${token.transitionId}`}
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
                  duration: enterDur,
                  ease:     EASE_OUT,
                  delay:    enterDelay + token.staggerIndex * 0.012,
                }}
              >
                {token.char}
              </motion.span>
            );
          }

          const hasMovement = token.dx !== 0 || token.dy !== 0;
          return (
            <motion.span
              key={`${token.key}__t${token.transitionId}`}
              style={{
                ...baseStyle,
                left:     token.toX,
                top:      token.toY,
                fontSize: token.toFontSize,
                color:    token.toColor,
              }}
              initial={
                hasMovement
                  ? {
                      x:        token.dx,
                      y:        token.dy,
                      fontSize: token.fromFontSize,
                      color:    token.fromColor,
                      opacity:  1,
                    }
                  : false
              }
              animate={{
                x:        0,
                y:        0,
                fontSize: token.toFontSize,
                color:    token.toColor,
                opacity:  1,
              }}
              transition={{
                duration: layoutDur,
                ease,
                delay: exitDur,
              }}
            >
              {token.char}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
