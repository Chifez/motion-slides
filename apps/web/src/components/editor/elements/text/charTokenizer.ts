export interface CharToken {
  /** Unique key per occurrence: "e_0", "e_1", "__sp_0", "__nl_0" etc. */
  key: string;
  char: string;
  /** Original index in the source string — used for debug/ordering only. */
  index: number;
  isWhitespace: boolean;
}

export interface CharLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SteadyStateRecord extends CharLayout {
  fontSize: number;
  color: string;
}



export interface LCSDiffResult {
  /** Characters matched by LCS — travel from old position to new position. */
  continuing: Array<{ prevKey: string; nextKey: string; char: string }>;
  /** Characters only in next slide — fade in. */
  entering: Array<{ key: string; char: string }>;
  /** Characters only in prev slide — fade out. */
  leaving: Array<{ key: string; char: string }>;
}



export type ContinuingToken = {
  type: 'continuing';
  /**
   * Composite key: "${prevKey}__cont__${nextKey}".
   * Unique per matched pair. Combined with transitionId in the React key
   * to force remount on every transition.
   */
  key: string;
  /** Key in prevPositionsRef (previous slide's token). */
  prevKey: string;
  /** Key in nextLayoutMap (current slide's token). */
  nextKey: string;
  char: string;
  /** Final rendered position (top-left corner, relative to layout container). */
  toX: number;
  toY: number;
  /** FLIP offsets: initial translate that visually places the span at the OLD position. */
  dx: number;
  dy: number;
  fromFontSize: number;
  toFontSize: number;
  fromColor: string;
  toColor: string;
  /**
   * Incremented on every content change. Used as a suffix in the React key so
   * Framer Motion's `initial` fires on every transition (it only fires on mount).
   * Without this the span stays mounted across transitions and snaps instead of flying.
   */
  transitionId: number;
};

export type EnteringToken = {
  type: 'entering';
  key: string;
  char: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  /** Index within the entering set — drives stagger delay. */
  staggerIndex: number;
  transitionId: number;
};

export type LeavingToken = {
  type: 'leaving';
  key: string;
  char: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  transitionId: number;
};

export type AnimToken = ContinuingToken | EnteringToken | LeavingToken;



/**
 * Split text into CharTokens, giving each non-whitespace character a
 * collision-safe key based on its occurrence count (e.g. the 3rd 'e' → "e_2").
 * Whitespace tokens receive keys too so they can be rendered in the ghost
 * layer for correct layout, but they are flagged `isWhitespace: true` and
 * excluded from measurement and animation.
 */
export function tokenizeText(text: string): CharToken[] {
  const counts: Record<string, number> = {};

  return [...text].map((char, index) => {
    const isWhitespace =
      char === ' ' || char === '\n' || char === '\r' || char === '\t';

    const slug =
      char === ' '  ? '__sp' :
      char === '\n' ? '__nl' :
      char === '\r' ? '__cr' :
      char === '\t' ? '__tb' :
      char;

    const n = counts[slug] ?? 0;
    counts[slug] = n + 1;

    return { key: `${slug}_${n}`, char, index, isWhitespace };
  });
}



/**
 * Compute the Longest Common Subsequence of two character token sequences and
 * use it to assign travel pairs. Characters matched by LCS travel from their
 * old position to their new position. Unmatched chars in prev fade out;
 * unmatched chars in next fade in.
 *
 * Unlike occurrence-index matching (e.g. always pairing the Nth 'e' with the
 * Nth 'e'), LCS ensures that the maximum number of characters travel in the
 * forward reading direction, preventing paths from crossing.
 *
 * Example: "Apple" → "Pineapple"
 *   Occurrence-index: 'e_0' in "Apple" matches 'e_0' in "Pine" → crosses "apple"
 *   LCS: 'e_0' in "Apple" matches 'e_1' in "Pineapple" → whole "apple" travels together
 */
export function lcsDiffTokens(
  prev: CharToken[],
  next: CharToken[],
): LCSDiffResult {
  const prevNws = prev.filter(t => !t.isWhitespace);
  const nextNws = next.filter(t => !t.isWhitespace);
  const m = prevNws.length;
  const n = nextNws.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        prevNws[i - 1].char === nextNws[j - 1].char
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const matchedPrev = new Set<number>();
  const matchedNext = new Set<number>();
  const continuing: LCSDiffResult['continuing'] = [];

  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (prevNws[i - 1].char === nextNws[j - 1].char) {
      continuing.unshift({
        prevKey: prevNws[i - 1].key,
        nextKey: nextNws[j - 1].key,
        char:    prevNws[i - 1].char,
      });
      matchedPrev.add(i - 1);
      matchedNext.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const leaving = prevNws
    .filter((_, idx) => !matchedPrev.has(idx))
    .map(t => ({ key: t.key, char: t.char }));

  const entering = nextNws
    .filter((_, idx) => !matchedNext.has(idx))
    .map(t => ({ key: t.key, char: t.char }));

  return { continuing, entering, leaving };
}
