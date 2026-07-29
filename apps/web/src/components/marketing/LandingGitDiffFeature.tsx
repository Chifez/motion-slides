import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCommit, FileDiff, GitBranch, ArrowRight, Plus, Minus } from 'lucide-react'

const BEFORE_LINES = [
  { key: 'fn-def', text: 'function fetchUser(id) {', type: 'code' },
  { key: 'const-url', text: '  const url = `/api/user/${id}`;', type: 'code' },
  { key: 'ret', text: '  return fetch(url);', type: 'code' },
  { key: 'close', text: '}', type: 'code' },
]

const AFTER_LINES = [
  { key: 'fn-def', text: 'async function fetchUser(id: string) {', type: 'code' },
  { key: 'const-url', text: '  const url = `/api/user/${id}`;', type: 'code' },
  { key: 'new-validate', text: '  if (!id) throw new Error("id required");', type: 'added' },
  { key: 'ret', text: '  return await fetch(url);', type: 'changed' },
  { key: 'close', text: '}', type: 'code' },
]

const COMMITS = [
  { hash: 'a3f91c', message: 'feat: add type-safe fetch helper', date: '2m ago', added: 3, removed: 1 },
  { hash: 'b72e4d', message: 'fix: handle null user id edge case', date: '1h ago', added: 1, removed: 0 },
  { hash: 'c19d8a', message: 'refactor: extract API base URL', date: '3h ago', added: 4, removed: 6 },
]

function DiffLine({ line, show }: { line: typeof AFTER_LINES[number]; show: boolean }) {
  const bg =
    line.type === 'added' ? 'rgba(34,197,94,0.08)' :
    line.type === 'changed' ? 'rgba(234,179,8,0.08)' :
    'transparent'
  const border =
    line.type === 'added' ? '#22c55e' :
    line.type === 'changed' ? '#eab308' :
    'transparent'
  const textColor =
    line.type === 'added' ? '#86efac' :
    line.type === 'changed' ? '#fde047' :
    '#a1a1aa'
  const prefix =
    line.type === 'added' ? '+' :
    line.type === 'changed' ? '~' :
    ' '

  return (
    <motion.div
      layoutId={`diff-${line.key}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : -8 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16 }}
      className="flex items-center gap-2 font-mono text-[11px] rounded px-2 py-0.5"
      style={{ background: bg, borderLeft: `2px solid ${border}` }}
    >
      <span className="w-4 text-right text-zinc-700 text-[9px] select-none shrink-0">
        {prefix}
      </span>
      <span style={{ color: textColor }}>{line.text}</span>
    </motion.div>
  )
}

export function LandingGitDiffFeature() {
  const [showDiff, setShowDiff] = useState(false)

  return (
    <section id="git-diffs" className="px-6 py-24 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-[11px] font-semibold text-zinc-300 mb-5">
            <GitBranch size={12} className="text-zinc-400" />
            Git & Code Intelligence
          </div>

          <h2
            className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight text-white mb-4 leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Turn your codebase into
            {' '}
            <span className="italic font-normal" style={{ fontFamily: '"DM Serif Display", Georgia, serif' }}>
              living slides.
            </span>
          </h2>

          <p className="text-zinc-500 text-[15px] leading-relaxed mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Import a GitHub repository or paste code directly. MotionSlides runs LCS character-level diffing between slides — so when you insert a function argument, it animates into position character by character.
          </p>

          <ul className="flex flex-col gap-2 mb-8">
            {[
              'LCS line & character diffing',
              'GitHub repository importer',
              'Git commit timeline → slide steps',
              'Syntax highlighting (50+ languages)',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-[13px] text-zinc-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                <ArrowRight size={12} className="text-zinc-600 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual */}
        <div className="flex flex-col gap-4">
          {/* Code diff panel */}
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/70">
              <div className="flex items-center gap-2">
                <FileDiff size={12} className="text-zinc-500" />
                <span className="text-[11px] text-zinc-500 font-mono">fetchUser.ts</span>
              </div>
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border-none cursor-pointer transition"
                style={{
                  background: showDiff ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.04)',
                  color: showDiff ? '#fde047' : '#71717a',
                  border: `1px solid ${showDiff ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <FileDiff size={9} />
                {showDiff ? 'After' : 'Before'} → click to toggle
              </button>
            </div>

            <div className="p-4 flex flex-col gap-0.5 min-h-[130px]">
              <AnimatePresence mode="popLayout">
                {(showDiff ? AFTER_LINES : BEFORE_LINES).map(line => (
                  <DiffLine key={line.key} line={line as any} show />
                ))}
              </AnimatePresence>
            </div>

            {showDiff && (
              <div className="px-4 pb-3 flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Plus size={9} /> 2 added
                </div>
                <div className="flex items-center gap-1 text-[10px] text-amber-400">
                  <Minus size={9} /> 1 changed
                </div>
              </div>
            )}
          </div>

          {/* Commit timeline */}
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <GitCommit size={11} className="text-zinc-600" />
              <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest">Commit History → Slides</span>
            </div>
            <div className="flex flex-col">
              {COMMITS.map((commit, i) => (
                <div key={commit.hash} className="flex items-center gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-blue-500 transition-colors shrink-0" />
                    {i < COMMITS.length - 1 && <div className="w-px flex-1 bg-zinc-800 my-0.5 h-5" />}
                  </div>
                  <div className="flex-1 py-1 min-w-0">
                    <p className="text-[11px] text-zinc-400 truncate font-mono">{commit.message}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-zinc-700 font-mono">{commit.hash}</span>
                      <span className="text-[9px] text-zinc-700">{commit.date}</span>
                      <span className="text-[9px] text-emerald-600">+{commit.added}</span>
                      <span className="text-[9px] text-red-600">-{commit.removed}</span>
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
