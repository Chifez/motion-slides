import { useState } from 'react'
import { ShieldCheck, AlertCircle, AlertTriangle, CircleDashed } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { evaluateStaticDeck } from '@/lib/agent/evaluation/static-evaluator'
import { DeckCriticModal } from './deck-critic-modal'

export function DeckScoreBadge() {
  const [isOpen, setIsOpen] = useState(false)
  const project = useEditorStore((s) => s.activeProject())

  if (!project || project.slides.length === 0) return null

  // Compute evaluation score
  const report = evaluateStaticDeck(project)
  const isEmpty = report.isEmptyDeck
  const score = report.overallScore
  const criticalCount = report.criticalIssues.length

  if (isEmpty) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          title="Deck Quality & Health (Empty Draft)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-(--ms-border) bg-(--ms-bg-base)/60 text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border)/40 transition-all cursor-pointer shadow-xs active:scale-[0.97]"
        >
          <CircleDashed size={13} className="text-(--ms-text-muted) opacity-70" />
          <span>Draft</span>
        </button>

        {isOpen && <DeckCriticModal report={report} onClose={() => setIsOpen(false)} />}
      </>
    )
  }

  const getScoreStyle = () => {
    if (criticalCount > 0) {
      return 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15'
    }
    if (score >= 85) {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
    }
    if (score >= 70) {
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'
    }
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15'
  }

  const getStatusIcon = () => {
    if (criticalCount > 0) {
      return <AlertCircle size={13} className="text-rose-400 shrink-0" />
    }
    if (score >= 85) {
      return <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
    }
    if (score >= 70) {
      return <AlertTriangle size={13} className="text-amber-400 shrink-0" />
    }
    return <AlertCircle size={13} className="text-rose-400 shrink-0" />
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Deck Quality & Health Report"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs active:scale-[0.97] ${getScoreStyle()}`}
      >
        {getStatusIcon()}
        <span className="font-mono tabular-nums tracking-tight font-semibold">
          {score}
          <span className="opacity-50 text-[10px] font-normal">/100</span>
        </span>
        <span className="text-[10px] font-bold tracking-wider px-1 py-0.2 rounded bg-white/10 opacity-90">
          {report.grade}
        </span>
      </button>

      {isOpen && <DeckCriticModal report={report} onClose={() => setIsOpen(false)} />}
    </>
  )
}
