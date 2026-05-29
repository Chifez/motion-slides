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

export interface TransitionSets {
  continuing: Array<{ key: string; char: string }>;
  entering:   Array<{ key: string; char: string }>;
  leaving:    Array<{ key: string; char: string }>;
}

// Discriminated union for the animation layer
export type ContinuingToken = {
  type: 'continuing';
  key: string;
  char: string;
  toX: number;
  toY: number;
  /** Initial translate offset: prevX - toX */
  dx: number;
  /** Initial translate offset: prevY - toY */
  dy: number;
  fromFontSize: number;
  toFontSize: number;
  fromColor: string;
  toColor: string;
};

export type EnteringToken = {
  type: 'entering';
  key: string;
  char: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

export type LeavingToken = {
  type: 'leaving';
  key: string;
  char: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
};

export type AnimToken = ContinuingToken | EnteringToken | LeavingToken;

/**
 * Split text into CharTokens, giving each non-whitespace character a
 * collision-safe key based on its occurrence count (e.g. the 3rd 'e' → "e_2").
 * Whitespace tokens receive keys too so they can be rendered in the layout
 * layer, but they are flagged `isWhitespace: true` and excluded from
 * measurement and animation.
 */
export function tokenizeText(text: string): CharToken[] {
  const counts: Record<string, number> = {};

  return [...text].map((char, index) => {
    const isWhitespace = char === ' ' || char === '\n' || char === '\r' || char === '\t';

    // Readable slug so whitespace keys never clash with real character keys
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
 * Compare prev and next token lists and bucket non-whitespace tokens into:
 *   continuing — same key exists on both sides (character travels)
 *   entering   — key only in next (fade in)
 *   leaving    — key only in prev (fade out)
 */
export function diffTokens(
  prev: CharToken[],
  next: CharToken[],
): TransitionSets {
  const prevMap = new Map(
    prev.filter(t => !t.isWhitespace).map(t => [t.key, t]),
  );
  const nextMap = new Map(
    next.filter(t => !t.isWhitespace).map(t => [t.key, t]),
  );

  const continuing: TransitionSets['continuing'] = [];
  const entering:   TransitionSets['entering']   = [];
  const leaving:    TransitionSets['leaving']    = [];

  for (const [key, t] of nextMap) {
    if (prevMap.has(key)) continuing.push({ key, char: t.char });
    else                  entering.push({ key, char: t.char });
  }

  for (const [key, t] of prevMap) {
    if (!nextMap.has(key)) leaving.push({ key, char: t.char });
  }

  return { continuing, entering, leaving };
}
