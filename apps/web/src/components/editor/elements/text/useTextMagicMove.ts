import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';
import { useMotionContext } from '@/context/MotionContext';
import { useEditorStore } from '@/store/editorStore';
import { usePermissions } from '@/context/PermissionContext';
import { lcsDiffTokens, tokenizeText } from './charTokenizer';
import type { AnimToken, CharLayout, CharToken, SteadyStateRecord } from './charTokenizer';

// ─── Public API ───────────────────────────────────────────────────────────────

export interface TextMagicMoveOptions {
  elementId: string;
  /** Current slide's text content. */
  text: string;
  fontSize: number;
  color: string;
  isEditing: boolean;
  listStyle?: string;
}

export interface TextMagicMoveResult {
  /** Always-current set of animation tokens. Empty when no transition is active. */
  animTokens: AnimToken[];
  /** Attach to the `position: relative` layout container div. */
  layoutContainerRef: RefObject<HTMLDivElement | null>;
  /**
   * Pass this as the `ref` callback on every non-whitespace layout span:
   *   ref={el => spanRefCallback(token.key, el)}
   */
  spanRefCallback: (key: string, el: HTMLSpanElement | null) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Mirrors the architecture of CodeElement:
 *
 *   Step 1 (useEffect):        text changes → tokenize → setGhostTokens
 *   Step 2 (useLayoutEffect):  ghostTokens change → measure DOM → build FLIP animTokens
 *
 * The ghost layer (rendered in TextElement) is always `opacity: 0`. The stage
 * layer (TextAnimationLayer) is always mounted and shows animTokens, which hold
 * characters at their settled positions between transitions. The ghost provides
 * the correct container height and measurement points.
 *
 * KEY FIXES vs. the previous implementation:
 *   1. Capture gate: previously required `continuingIds.has(elementId)`, which
 *      meant Slide 1 positions were NEVER recorded, so the animation never fired.
 *      Now the capture is gated only on not-editing / not-list — it always runs.
 *   2. transitionId in React keys: forces Framer Motion to remount animated spans
 *      on every transition, ensuring `initial` fires (it only fires on mount).
 *   3. LCS matching: `lcsDiffTokens` pairs characters in reading order, preventing
 *      paths from crossing (e.g. "Apple" → "Pineapple").
 *   4. useLayoutEffect for measurement: fires synchronously before paint, preventing
 *      a 1-frame flash of the unmorphed text.
 */
export function useTextMagicMove({
  text,
  fontSize,
  color,
  isEditing,
  listStyle,
}: TextMagicMoveOptions): TextMagicMoveResult {
  const { durationSec, ease, isTimelinePreview } = useMotionContext();
  const isPresenting = useEditorStore(s => s.isPresenting);
  const { isReadOnly } = usePermissions();

  // Ghost tokens: tokenized representation of the current text.
  const [ghostTokens, setGhostTokens] = useState(() => tokenizeText(text));
  // AnimTokens: absolutely-positioned token descriptors for the stage layer.
  const [animTokens, setAnimTokens] = useState<AnimToken[]>([]);

  const layoutContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Map of span DOM nodes keyed by CharToken.key.
   * Populated via spanRefCallback below.
   */
  const spanRefsMap = useRef<Map<string, HTMLSpanElement>>(new Map());

  /**
   * Positions captured at the end of each settled frame (same role as
   * prevPositionsRef in CodeElement).
   */
  const prevPositionsRef = useRef<Map<string, SteadyStateRecord>>(new Map());

  /**
   * The ghost tokens from the PREVIOUS render cycle — used as the "before"
   * sequence for LCS diff.
   */
  const prevTokensRef = useRef<CharToken[]>([]);

  /**
   * Incremented before every setGhostTokens call. Baked into each AnimToken
   * and used as a suffix in React keys to force remount on every transition.
   */
  const transitionIdRef = useRef(0);

  // ── Element-level eligibility ─────────────────────────────────────────────
  // We activate the ghost/stage pipeline whenever the element is inside a
  // presentation context (editor play mode or export view) and is not being
  // edited / is not a list.
  //
  // Do NOT gate on continuingIds — that was the P0 bug that blocked Slide 1
  // position capture, meaning the first transition never had stored positions.
  const isAnimationMode =
    (isPresenting || isReadOnly || isTimelinePreview) &&
    !isEditing &&
    listStyle !== 'bullet' &&
    listStyle !== 'numbered';

  // ── Ref callback ──────────────────────────────────────────────────────────

  const spanRefCallback = useCallback(
    (key: string, el: HTMLSpanElement | null) => {
      if (el) spanRefsMap.current.set(key, el);
      else    spanRefsMap.current.delete(key);
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1 — content changes → tokenize → update ghost tokens
  // (useEffect: async-friendly, low priority — just re-tokenizes the text)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAnimationMode) {
      // Clear everything when leaving animation mode (e.g. user starts editing).
      setGhostTokens([]);
      setAnimTokens([]);
      prevPositionsRef.current = new Map();
      prevTokensRef.current = [];
      return;
    }

    // Advance BEFORE setGhostTokens so useLayoutEffect reads the new id.
    transitionIdRef.current += 1;
    setGhostTokens(tokenizeText(text));
  // fontSize / color are intentionally excluded: we re-tokenize only when text
  // changes. Font/color changes are picked up via the SteadyStateRecord update
  // inside the useLayoutEffect, which always runs with fresh closure values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, isAnimationMode]);

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2 — ghost renders → measure DOM → build FLIP animTokens
  //
  // useLayoutEffect fires synchronously after DOM mutations, before paint.
  // The ghost already shows the new tokens when we measure — no flash.
  // ─────────────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!isAnimationMode || ghostTokens.length === 0) return;

    // Measure current (next-slide) positions from the ghost spans.
    const nextPositions = new Map<string, CharLayout>();
    spanRefsMap.current.forEach((span, key) => {
      if (!span) return;
      nextPositions.set(key, {
        x:      span.offsetLeft,
        y:      span.offsetTop,
        width:  span.offsetWidth,
        height: span.offsetHeight,
      });
    });

    const tid     = transitionIdRef.current;
    const isFirst = prevTokensRef.current.length === 0;
    const prevPos = prevPositionsRef.current;

    const newAnimTokens: AnimToken[] = [];

    if (isFirst) {
      // First render: snap every character into place with no animation.
      // dx === 0 / dy === 0 → the `initial={false}` path in TextAnimationLayer.
      for (const tok of ghostTokens) {
        if (tok.isWhitespace) continue;
        const next = nextPositions.get(tok.key);
        if (!next) continue;
        newAnimTokens.push({
          type:         'continuing',
          key:          tok.key,
          prevKey:      tok.key,
          nextKey:      tok.key,
          char:         tok.char,
          toX:          next.x,
          toY:          next.y,
          dx:           0,
          dy:           0,
          fromFontSize: fontSize,
          toFontSize:   fontSize,
          fromColor:    color,
          toColor:      color,
          transitionId: tid,
        });
      }
    } else {
      // LCS diff: match as many characters as possible without crossing paths.
      const { continuing, entering, leaving } = lcsDiffTokens(
        prevTokensRef.current,
        ghostTokens,
      );

      // Continuing: FLIP from old position to new position.
      for (const { prevKey, nextKey, char } of continuing) {
        const prev = prevPos.get(prevKey);
        const next = nextPositions.get(nextKey);
        if (!prev || !next) continue;
        newAnimTokens.push({
          type:         'continuing',
          key:          `${prevKey}__cont__${nextKey}`,
          prevKey,
          nextKey,
          char,
          toX:          next.x,
          toY:          next.y,
          dx:           prev.x - next.x,
          dy:           prev.y - next.y,
          fromFontSize: prev.fontSize,
          toFontSize:   fontSize,
          fromColor:    prev.color,
          toColor:      color,
          transitionId: tid,
        });
      }

      // Entering: new characters — fade in.
      let staggerIndex = 0;
      for (const { key, char } of entering) {
        const next = nextPositions.get(key);
        if (!next) continue;
        newAnimTokens.push({
          type:         'entering',
          key,
          char,
          x:            next.x,
          y:            next.y,
          fontSize,
          color,
          staggerIndex: staggerIndex++,
          transitionId: tid,
        });
      }

      // Leaving: characters that don't exist on the next slide — fade out.
      for (const { key, char } of leaving) {
        const prev = prevPos.get(key);
        if (!prev) continue;
        newAnimTokens.push({
          type:         'leaving',
          key,
          char,
          x:            prev.x,
          y:            prev.y,
          fontSize:     prev.fontSize,
          color:        prev.color,
          transitionId: tid,
        });
      }
    }

    // Persist positions and tokens for the next transition.
    const nextSteadyState = new Map<string, SteadyStateRecord>();
    nextPositions.forEach((layout, key) => {
      nextSteadyState.set(key, { ...layout, fontSize, color });
    });
    prevPositionsRef.current = nextSteadyState;
    prevTokensRef.current    = ghostTokens;

    setAnimTokens(newAnimTokens);
  // ghostTokens identity change is the only trigger we need.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghostTokens]);

  // Re-capture positions after font/color changes (without triggering a text FLIP).
  // This keeps prevPositionsRef accurate for the next slide transition.
  useEffect(() => {
    if (!isAnimationMode || prevTokensRef.current.length === 0) return;
    const updated = new Map<string, SteadyStateRecord>(prevPositionsRef.current);
    updated.forEach((record, key) => {
      updated.set(key, { ...record, fontSize, color });
    });
    prevPositionsRef.current = updated;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize, color]);

  return {
    animTokens:         isAnimationMode ? animTokens : [],
    layoutContainerRef,
    spanRefCallback,
  };
}

// Re-export the CharToken type so TextElement can import from one place.
export type { CharToken } from './charTokenizer';
