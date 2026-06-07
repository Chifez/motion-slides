import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CodeContent } from '@motionslides/shared'
import { CODE_DEBOUNCE_MS } from '@/constants/animation'
import { getTokenizedLines } from '@/lib/shikiHighlighter'
import { tokenKey, CODE_PHASE } from '@/lib/motionEngine'
import { useMotionContext } from '@/context/MotionContext'

interface Props {
  content: CodeContent
  elementId: string
}



interface FlatToken {
  key: string
  content: string
  color: string
  fontStyle: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface AnimToken extends FlatToken {
  x: number
  y: number
  width: number
  height: number
  /**
   * FLIP offsets: delta from the token's NEW position back to its OLD position.
   * We render at `style.left=newX, style.top=newY`, then `initial={{ x:dx, y:dy }}`
   * visually places it at the old position, and `animate={{ x:0, y:0 }}` flies it forward.
   */
  dx: number
  dy: number
  status: 'unchanged' | 'added' | 'removed'
  staggerIndex: number
  /**
   * Incremented on every content change. Used as a React key suffix on "unchanged"
   * tokens so they remount on every transition — which is the only way to guarantee
   * that Framer Motion's `initial` prop fires (it only fires on mount, not re-renders).
   * Without this, unchanged tokens snap instead of flying because `initial` is ignored.
   */
  transitionId: number
}



/**
 * Punctuation chars that Shiki sometimes bundles (e.g. `{}`, `=>`) and sometimes
 * emits individually. Splitting normalises them so the same structural character
 * always gets the same stable key regardless of Shiki's grouping decision.
 */
const PUNCTUATION_CHARS = new Set([
  '{', '}', '(', ')', '[', ']', '<', '>',
  ';', ':', ',', '.', '|', '&', '?', '!',
  '+', '-', '*', '/', '=', '%', '^', '~',
])

function isPurelyPunctuation(text: string): boolean {
  return text.length > 1 && [...text].every((ch) => PUNCTUATION_CHARS.has(ch))
}

function splitToken(tok: { content: string; color: string; fontStyle: number }) {
  if (!isPurelyPunctuation(tok.content)) return [tok]
  return [...tok.content].map((ch) => ({ content: ch, color: tok.color, fontStyle: tok.fontStyle }))
}

async function buildFlatTokens(value: string, language: string): Promise<FlatToken[]> {
  const lines = await getTokenizedLines(value || ' ', language || 'javascript')
  const occMap = new Map<string, number>()
  const flat: FlatToken[] = []

  for (let li = 0; li < lines.length; li++) {
    for (const rawTok of lines[li]) {
      for (const tok of splitToken(rawTok)) {
        const occ = occMap.get(tok.content) ?? 0
        occMap.set(tok.content, occ + 1)
        flat.push({ key: tokenKey(tok.content, occ), content: tok.content, color: tok.color, fontStyle: tok.fontStyle })
      }
    }
    if (li < lines.length - 1) {
      flat.push({ key: `__nl${li}`, content: '\n', color: '', fontStyle: 0 })
    }
  }
  return flat
}

/**
 * Measure token positions from the ghost layer, converting from viewport px
 * (getBoundingClientRect, post-transform) to local CSS px (pre-transform).
 * This corrects for the presentation canvas's `transform: scale(n)`.
 */
function measureGhostRects(ghostEl: HTMLElement, wrapperEl: HTMLElement): Map<string, Rect> {
  const wrapperRect = wrapperEl.getBoundingClientRect()
  const scaleX = wrapperRect.width / wrapperEl.offsetWidth
  const scaleY = wrapperRect.height / wrapperEl.offsetHeight

  const map = new Map<string, Rect>()
  ghostEl.querySelectorAll<HTMLElement>('[data-tok]').forEach((span) => {
    const k = span.getAttribute('data-tok')!
    if (k.startsWith('__nl')) return
    const r = span.getBoundingClientRect()
    map.set(k, {
      x: (r.left - wrapperRect.left) / scaleX,
      y: (r.top - wrapperRect.top) / scaleY,
      width: r.width / scaleX,
      height: r.height / scaleY,
    })
  })
  return map
}



export function CodeElement({ content, elementId: _elementId }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)

  const [ghostTokens, setGhostTokens] = useState<FlatToken[]>([])
  const [animTokens, setAnimTokens] = useState<AnimToken[]>([])

  const prevPositionsRef = useRef<Map<string, Rect>>(new Map())
  const prevTokensRef = useRef<FlatToken[]>([])
  const transitionIdRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { durationSec: ctxDuration, ease: ctxEase, isTransitioning } = useMotionContext()

  const totalDur = isTransitioning
    ? ctxDuration
    : CODE_PHASE.EXIT_DUR + CODE_PHASE.LAYOUT_DUR + CODE_PHASE.ENTER_DUR
  const exitDur = totalDur * 0.20
  const layoutDur = totalDur * 0.55
  const enterDur = totalDur * 0.30
  const enterDelay = exitDur + layoutDur * 0.7

  const FLIGHT_EASE = isTransitioning
    ? ctxEase
    : ([0.37, 0, 0.63, 1] as [number, number, number, number])
  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]
  const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]


  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const isFirst = ghostTokens.length === 0

    timerRef.current = setTimeout(async () => {
      try {
        const flat = await buildFlatTokens(content.value, content.language || 'javascript')
        transitionIdRef.current += 1
        setGhostTokens(flat)
      } catch {
        const lines = (content.value || '').split('\n')
        const flat: FlatToken[] = []
        lines.forEach((text, i) => {
          flat.push({ key: `__fb${i}`, content: text || '\u200b', color: '#e0e0e0', fontStyle: 0 })
          if (i < lines.length - 1) flat.push({ key: `__nl${i}`, content: '\n', color: '', fontStyle: 0 })
        })
        transitionIdRef.current += 1
        setGhostTokens(flat)
      }
    }, isFirst ? 0 : CODE_DEBOUNCE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [content.value, content.language, content.fontSize, content.lineHeight, content.fontFamily])


  useLayoutEffect(() => {
    if (!wrapperRef.current || !ghostRef.current || ghostTokens.length === 0) return

    const nextPositions = measureGhostRects(ghostRef.current, wrapperRef.current)
    const tid = transitionIdRef.current

    const isFirst = prevTokensRef.current.length === 0
    const prevPos = prevPositionsRef.current
    const prevKeys = new Set(prevTokensRef.current.map((t) => t.key))
    const nextKeys = new Set(ghostTokens.filter((t) => !t.key.startsWith('__nl')).map((t) => t.key))

    const newAnimTokens: AnimToken[] = []
    let addedIdx = 0


    for (const tok of ghostTokens) {
      if (tok.key.startsWith('__nl')) continue
      const next = nextPositions.get(tok.key)
      if (!next) continue

      if (isFirst) {
        newAnimTokens.push({ ...tok, ...next, dx: 0, dy: 0, status: 'unchanged', staggerIndex: 0, transitionId: tid })
      } else if (prevKeys.has(tok.key) && prevPos.has(tok.key)) {
        const prev = prevPos.get(tok.key)!
        newAnimTokens.push({
          ...tok, ...next,
          dx: prev.x - next.x,
          dy: prev.y - next.y,
          status: 'unchanged',
          staggerIndex: 0,
          transitionId: tid,
        })
      } else {
        newAnimTokens.push({ ...tok, ...next, dx: 0, dy: 0, status: 'added', staggerIndex: addedIdx++, transitionId: tid })
      }
    }

    if (!isFirst) {
      for (const tok of prevTokensRef.current) {
        if (tok.key.startsWith('__nl')) continue
        if (!nextKeys.has(tok.key) && prevPos.has(tok.key)) {
          const prev = prevPos.get(tok.key)!
          newAnimTokens.push({ ...tok, ...prev, dx: 0, dy: 0, status: 'removed', staggerIndex: 0, transitionId: tid })
        }
      }
    }

    prevPositionsRef.current = nextPositions
    prevTokensRef.current = ghostTokens
    setAnimTokens(newAnimTokens)
  }, [ghostTokens])



  return (
    <div 
      className="bg-[#121212] rounded-lg px-3.5 py-3 w-full h-full overflow-auto"
      style={{ 
        fontFamily: content.fontFamily || 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: content.fontSize || 12,
        lineHeight: content.lineHeight || 1.5,
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-neutral-600 mb-2 select-none">
        {content.language || 'javascript'}
      </div>

      <div ref={wrapperRef} style={{ position: 'relative' }}>

        <div
          ref={ghostRef}
          aria-hidden="true"
          style={{ 
            opacity: 0, 
            pointerEvents: 'none', 
            userSelect: 'none', 
            whiteSpace: 'pre-wrap',
            fontFamily: content.fontFamily || 'inherit',
            fontSize: content.fontSize || 'inherit',
            lineHeight: content.lineHeight || 'inherit',
          }}
        >
          {ghostTokens.map((tok) => (
            <span key={tok.key} data-tok={tok.key}>{tok.content}</span>
          ))}
        </div>

        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }}>
          <AnimatePresence>
            {animTokens.map((tok) => {
              const baseStyle: React.CSSProperties = {
                position: 'absolute',
                left: tok.x,
                top: tok.y,
                width: tok.width,
                color: tok.color,
                whiteSpace: 'pre',
                fontStyle: tok.fontStyle & 1 ? 'italic' : 'normal',
                fontWeight: tok.fontStyle & 2 ? 'bold' : 'normal',
                textDecoration: tok.fontStyle & 4 ? 'underline' : 'none',
              }

              if (tok.status === 'removed') {
                return (
                  <motion.span
                    key={`${tok.key}__rm${tok.transitionId}`}
                    style={baseStyle}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: exitDur, ease: EASE_IN_OUT }}
                  >
                    {tok.content}
                  </motion.span>
                )
              }

              if (tok.status === 'added') {
                return (
                  <motion.span
                    key={`${tok.key}__add${tok.transitionId}`}
                    style={baseStyle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: enterDur,
                      ease: EASE_OUT,
                      delay: enterDelay + tok.staggerIndex * 0.012,
                    }}
                  >
                    {tok.content}
                  </motion.span>
                )
              }

              const hasMovement = tok.dx !== 0 || tok.dy !== 0
              return (
                <motion.span
                  key={`${tok.key}__t${tok.transitionId}`}
                  style={baseStyle}
                  initial={hasMovement ? { x: tok.dx, y: tok.dy, opacity: 1 } : false}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  transition={{
                    duration: layoutDur,
                    ease: FLIGHT_EASE,
                    delay: exitDur,
                  }}
                >
                  {tok.content}
                </motion.span>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
