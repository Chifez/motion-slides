import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { GitCommit, FileDiff, GitBranch, ArrowRight, Plus, Minus } from 'lucide-react'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const LINE_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const

interface CodeLine {
  key: string
  text: string
  type: 'code' | 'added' | 'changed'
}

const BEFORE_LINES: readonly CodeLine[] = [
  { key: 'fn-def', text: 'function fetchUser(id) {', type: 'code' },
  { key: 'const-url', text: '  const url = `/api/user/${id}`;', type: 'code' },
  { key: 'ret', text: '  return fetch(url);', type: 'code' },
  { key: 'close', text: '}', type: 'code' },
]

const AFTER_LINES: readonly CodeLine[] = [
  { key: 'fn-def', text: 'async function fetchUser(id: string) {', type: 'code' },
  { key: 'const-url', text: '  const url = `/api/user/${id}`;', type: 'code' },
  { key: 'new-validate', text: '  if (!id) throw new Error("id required");', type: 'added' },
  { key: 'ret', text: '  return await fetch(url);', type: 'changed' },
  { key: 'close', text: '}', type: 'code' },
]

const COMMITS = [
  { hash: 'a3f91c', branch: 'feature/kafka-stream', message: 'chore(slides): decouple upload queue via Kafka', date: '2m ago', added: 3, removed: 1 },
  { hash: 'b72e4d', branch: 'main', message: 'fix(contrast): elevate section border tokens', date: '1h ago', added: 1, removed: 0 },
  { hash: 'c19d8a', branch: 'main', message: 'feat(deck): add p95 latency benchmark slide', date: '3h ago', added: 4, removed: 2 },
] as const

function DiffLine({ line, instant }: { line: CodeLine; instant: boolean }) {
  const bg =
    line.type === 'added'
      ? 'rgba(16,185,129,0.08)'
      : line.type === 'changed'
        ? 'rgba(245,158,11,0.08)'
        : 'transparent'
  const textColor =
    line.type === 'added'
      ? '#6ee7b7'
      : line.type === 'changed'
        ? '#fcd34d'
        : '#d4d4d8'
  const prefix = line.type === 'added' ? '+' : line.type === 'changed' ? '~' : ' '

  return (
    <motion.div
      layoutId={`diff-${line.key}`}
      initial={instant ? { opacity: 0 } : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={instant ? { opacity: 0 } : { opacity: 0, x: 6 }}
      transition={instant ? { duration: 0.01 } : LINE_SPRING}
      className="flex items-center gap-[10px] font-mono text-[12px] rounded-[6px] px-[10px] py-[4px]"
      style={{ background: bg }}
    >
      <span className="w-[12px] text-right text-zinc-600 text-[10px] select-none shrink-0">
        {prefix}
      </span>
      <span style={{ color: textColor }}>{line.text}</span>
    </motion.div>
  )
}

export function LandingGitDiffFeature() {
  const [showDiff, setShowDiff] = useState(true)
  const shouldReduceMotion = useReducedMotion()

  const bullets = [
    'LCS syntax-token morphing across 50+ languages (Shiki)',
    'Native deck branching & historical commit checkout',
    'Visual pull-request diff overlay & slide change badges',
    'Agentic merge review summaries',
  ]

  return (
    <section id="code-git" className="max-w-[1120px] mx-auto px-[24px] py-[104px]">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="grid grid-cols-1 md:grid-cols-2 gap-[48px] items-center"
      >
        {/* Text column */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-[12px]">
            03 / CODE &amp; VERSION CONTROL
          </p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-[16px]">
            Morph code token by token. Branch decks like Git.
          </h2>
          <p className="text-[16px] leading-[1.6] text-zinc-400 mb-[28px]">
            Animate refactors without static screenshots—unchanged lines glide smoothly via LCS diffing while additions cascade in. Fork exploratory branches, inspect visual slide diffs, and checkout any commit.
          </p>

          <ul className="flex flex-col gap-[12px] list-none p-0 m-0">
            {bullets.map((item) => (
              <li key={item} className="flex items-center gap-[10px] text-[14px] text-zinc-300">
                <ArrowRight size={13} className="text-zinc-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual column */}
        <div className="flex flex-col gap-[16px]">
          {/* Code diff panel */}
          <div className="rounded-[16px] border border-white/[0.08] bg-[#0C0C0F] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
            <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-white/[0.06] bg-[#09090C]">
              <div className="flex items-center gap-[8px]">
                <FileDiff size={13} className="text-zinc-500" />
                <span className="font-mono text-[12px] text-zinc-300">fetchUser.ts</span>
              </div>

              <div
                role="tablist"
                aria-label="Code diff state"
                className="inline-flex items-center rounded-[8px] border border-white/[0.08] bg-[#121216] p-[2px]"
              >
                {[
                  { id: false, label: 'Before' },
                  { id: true, label: 'After' },
                ].map((opt) => {
                  const active = showDiff === opt.id
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setShowDiff(opt.id)}
                      className={`px-[10px] py-[4px] rounded-[6px] font-mono text-[11px] font-medium border-none cursor-pointer transition-[transform,background-color,color] duration-150 active:scale-[0.97] ${
                        active ? 'bg-white/[0.1] text-white' : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-[16px] flex flex-col gap-[4px] min-h-[156px]">
              <AnimatePresence mode="popLayout" initial={false}>
                {(showDiff ? AFTER_LINES : BEFORE_LINES).map((line) => (
                  <DiffLine key={line.key} line={line} instant={Boolean(shouldReduceMotion)} />
                ))}
              </AnimatePresence>
            </div>

            <div className="px-[16px] py-[10px] border-t border-white/[0.06] flex items-center justify-between bg-[#09090C]">
              {showDiff ? (
                <div className="flex items-center gap-[12px] font-mono text-[11px]">
                  <span className="inline-flex items-center gap-[4px] text-emerald-400">
                    <Plus size={10} /> 1 added
                  </span>
                  <span className="inline-flex items-center gap-[4px] text-amber-400">
                    <Minus size={10} /> 2 modified
                  </span>
                </div>
              ) : (
                <span className="font-mono text-[11px] text-zinc-500">Original function signature</span>
              )}
              <span className="font-mono text-[10px] text-zinc-600">LCS token morph</span>
            </div>
          </div>

          {/* Deck Branches & Commits card */}
          <div className="rounded-[16px] border border-white/[0.08] bg-[#0C0C0F] p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between mb-[14px]">
              <div className="flex items-center gap-[8px]">
                <GitCommit size={13} className="text-zinc-500" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  Deck Branches &amp; Commits
                </span>
              </div>
              <div className="flex items-center gap-[6px]">
                <span className="inline-flex items-center gap-[4px] rounded-[6px] border border-white/[0.08] bg-[#121216] px-[8px] py-[2px] font-mono text-[10px] text-zinc-300">
                  <GitBranch size={10} className="text-zinc-500" /> main
                </span>
                <span className="inline-flex items-center gap-[4px] rounded-[6px] border border-blue-500/30 bg-blue-500/10 px-[8px] py-[2px] font-mono text-[10px] text-blue-400">
                  feature/kafka-stream
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              {COMMITS.map((commit, i) => (
                <div key={commit.hash} className="flex items-start gap-[12px]">
                  <div className="flex flex-col items-center pt-[6px]">
                    <div
                      className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                        i === 0 ? 'bg-blue-400' : 'bg-zinc-600'
                      }`}
                    />
                    {i < COMMITS.length - 1 && <div className="w-px bg-white/[0.08] my-[4px] h-[24px]" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-[8px]">
                    <p className="text-[12px] text-zinc-300 font-mono truncate m-0">{commit.message}</p>
                    <div className="flex items-center gap-[8px] mt-[3px] font-mono text-[10px]">
                      <span className="text-zinc-500">{commit.hash}</span>
                      <span className="text-zinc-600">{commit.date}</span>
                      <span className="text-emerald-400">+{commit.added}</span>
                      <span className="text-rose-400">-{commit.removed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
