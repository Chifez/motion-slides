import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useMotionContext } from '@/context/MotionContext';
import {
  diffTokens,
  tokenizeText,
} from './charTokenizer';
import type {
  AnimToken,
  CharLayout,
  SteadyStateRecord,
} from './charTokenizer';

// ─── Public API ───────────────────────────────────────────────────────────────

export interface TextMagicMoveOptions {
  elementId: string;
  /** Current slide's text */
  text: string;
  fontSize: number;
  color: string;
  isEditing: boolean;
  listStyle?: string;
  /**
   * Content extracted from previousSlide for this element.
   * Pass `undefined` when the element didn't exist on the previous slide.
   */
  prevText?: string;
  prevFontSize?: number;
  prevColor?: string;
}

export interface TextMagicMoveResult {
  /** Whether the character-level animation is currently running */
  isAnimatingText: boolean;
  animTokens: AnimToken[];
  /** Attach to the `position: relative` layout container div */
  layoutContainerRef: RefObject<HTMLDivElement | null>;
  /**
   * Pass this as the `ref` callback on every non-whitespace layout span:
   *   ref={el => spanRefCallback(token.key, el)}
   */
  spanRefCallback: (key: string, el: HTMLSpanElement | null) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTextMagicMove({
  elementId,
  text,
  fontSize,
  color,
  isEditing,
  listStyle,
  prevText,
  prevFontSize,
  prevColor,
}: TextMagicMoveOptions): TextMagicMoveResult {
  const { previousSlide, durationSec, ease, continuingIds } = useMotionContext();

  const [isAnimatingText, setIsAnimatingText] = useState(false);
  const [animTokens, setAnimTokens]           = useState<AnimToken[]>([]);

  /**
   * The `position: relative` container. All offsetLeft/offsetTop values
   * are relative to this element — completely immune to canvas CSS scale().
   */
  const layoutContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Map of span DOM nodes keyed by CharToken.key.
   * Populated via the spanRefCallback below.
   */
  const spanRefsMap = useRef<Map<string, HTMLSpanElement>>(new Map());

  /**
   * Last confirmed steady-state layout, i.e. positions captured when no
   * animation is running. This represents the PREVIOUS slide's positions
   * at the moment a transition is triggered.
   */
  const steadyStateRef = useRef<Map<string, SteadyStateRecord>>(new Map());

  // ── Eligibility check ───────────────────────────────────────────────────────

  const isEligible =
    !isEditing &&
    listStyle !== 'bullet' &&
    listStyle !== 'numbered' &&
    continuingIds.has(elementId);

  // ── Ref callback ────────────────────────────────────────────────────────────

  const spanRefCallback = useCallback(
    (key: string, el: HTMLSpanElement | null) => {
      if (el) spanRefsMap.current.set(key, el);
      else    spanRefsMap.current.delete(key);
    },
    [],
  );

  // ── Steady-state capture ────────────────────────────────────────────────────

  /**
   * Walk the current spanRefsMap and write native offset measurements into
   * steadyStateRef. Must only be called when the layout spans are visible
   * (opacity: 1) and isAnimatingText === false.
   */
  const captureSteadyState = useCallback(() => {
    const map = new Map<string, SteadyStateRecord>();
    spanRefsMap.current.forEach((span, key) => {
      if (!span) return;
      map.set(key, {
        x:      span.offsetLeft,
        y:      span.offsetTop,
        width:  span.offsetWidth,
        height: span.offsetHeight,
        fontSize,
        color,
      });
    });
    steadyStateRef.current = map;
  }, [fontSize, color]);

  /**
   * Re-capture after any text change that happens outside an animation
   * (e.g. the user edits text in the editor, or the slide loads fresh).
   */
  useEffect(() => {
    if (isAnimatingText || !isEligible) return;
    // rAF ensures the browser has finished the layout pass
    const raf = requestAnimationFrame(captureSteadyState);
    return () => cancelAnimationFrame(raf);
  }, [text, fontSize, color, isEligible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Transition trigger ──────────────────────────────────────────────────────

  useEffect(() => {
    // Guard: only proceed if eligible, a transition is happening, and
    // we're not already mid-animation (no stacking).
    if (!isEligible || !previousSlide || isAnimatingText) return;

    // If the element wasn't on the previous slide, skip magic move —
    // the standard Framer Motion container animation handles it.
    if (!prevText) return;

    // ── Step 1: Measure current (next-slide) layout ──────────────────────────
    // At this point React has rendered the NEW text into the layout spans,
    // but isAnimatingText is still false so they're visible and measurable.
    const nextLayoutMap = new Map<string, CharLayout>();
    spanRefsMap.current.forEach((span, key) => {
      if (!span) return;
      nextLayoutMap.set(key, {
        x:      span.offsetLeft,
        y:      span.offsetTop,
        width:  span.offsetWidth,
        height: span.offsetHeight,
      });
    });

    // ── Step 2: Tokenise & diff ──────────────────────────────────────────────
    const prevTokens = tokenizeText(prevText);
    const nextTokens = tokenizeText(text);
    const { continuing, entering, leaving } = diffTokens(prevTokens, nextTokens);

    // ── Step 3: Build animation token list ───────────────────────────────────
    const tokens: AnimToken[] = [];

    for (const { key, char } of continuing) {
      const prev = steadyStateRef.current.get(key);
      const next = nextLayoutMap.get(key);
      if (!prev || !next) continue;

      tokens.push({
        type: 'continuing',
        key,
        char,
        toX: next.x,
        toY: next.y,
        dx: prev.x - next.x,   // initial translate X offset
        dy: prev.y - next.y,   // initial translate Y offset
        fromFontSize: prevFontSize ?? prev.fontSize,
        toFontSize:   fontSize,
        fromColor:    prevColor ?? prev.color,
        toColor:      color,
      });
    }

    for (const { key, char } of entering) {
      const layout = nextLayoutMap.get(key);
      if (!layout) continue;
      tokens.push({
        type: 'entering',
        key, char,
        x: layout.x,
        y: layout.y,
        fontSize,
        color,
      });
    }

    for (const { key, char } of leaving) {
      const layout = steadyStateRef.current.get(key);
      if (!layout) continue;
      tokens.push({
        type: 'leaving',
        key, char,
        x:        layout.x,
        y:        layout.y,
        fontSize: layout.fontSize,
        color:    layout.color,
      });
    }

    // Nothing to animate — bail out and let standard transition run.
    if (tokens.length === 0) return;

    // ── Step 4: Activate the animation window ────────────────────────────────
    setAnimTokens(tokens);
    setIsAnimatingText(true);

    // +80 ms safety margin so the Framer Motion springs fully settle before
    // we swap back to the layout layer.
    const timer = window.setTimeout(() => {
      setIsAnimatingText(false);
      // Capture the now-current (new slide) steady-state positions so they're
      // ready as prevPositions for the *next* transition.
      requestAnimationFrame(captureSteadyState);
    }, durationSec * 1000 + 80);

    return () => clearTimeout(timer);
    // previousSlide identity change is the only trigger we care about.
    // All other deps are intentionally excluded to avoid re-firing.
  }, [previousSlide]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isAnimatingText: isAnimatingText && isEligible,
    animTokens,
    layoutContainerRef,
    spanRefCallback,
  };
}
