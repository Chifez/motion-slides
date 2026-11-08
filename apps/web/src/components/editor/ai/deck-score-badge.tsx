import { ShieldCheck, AlertCircle, AlertTriangle, Sparkles } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { evaluateStaticDeck } from '@/lib/agent/evaluation/static-evaluator'
import { DeckCriticModal } from './deck-critic-modal'

export function DeckScoreBadge() {
  const hasAiGenerated = useEditorStore((s) => s.hasAiGenerated)
  const isCriticModalOpen = useEditorStore((s) => s.isCriticModalOpen)
  const openCriticModal = useEditorStore((s) => s.openCriticModal)
  const closeCriticModal = useEditorStore((s) => s.closeCriticModal)
  const project = useEditorStore((s) => s.activeProject())

  // The deck quality report strictly only surfaces when AI generation was invoked for this deck
  if (!hasAiGenerated || !project || project.slides.length === 0) {
    return null
  }

  // Compute evaluation score
  const report = evaluateStaticDeck(project)
  if (report.isEmptyDeck) {
    return null
  }

  const score = report.overallScore
  const criticalCount = report.criticalIssues.length

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
      return <AlertCircle size={12} className="text-rose-400 shrink-0" />
    }
    if (score >= 85) {
      return <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
    }
    if (score >= 70) {
      return <AlertTriangle size={12} className="text-amber-400 shrink-0" />
    }
    return <AlertCircle size={12} className="text-rose-400 shrink-0" />
  }

  return (
    <>
      <button
        onClick={openCriticModal}
        title={`AI Deck Quality Report: ${score}/100 (${report.grade})`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer shadow-xs active:scale-[0.97] shrink-0 ${getScoreStyle()}`}
      >
        <Sparkles size={11} className="opacity-80 shrink-0" />
        {getStatusIcon()}
          <span className="font-mono tabular-nums tracking-tight font-semibold text-[11.5px]">
            {score}
            <span className="hidden sm:inline opacity-50 text-[10px] font-normal">/100</span>
          </span>
            <span className="hidden sm:inline text-[9.5px] font-bold tracking-wider px-1 py-0.5 rounded bg-white/10 opacity-90">
              Grade {report.grade}
            </span>
          </button>

          {isCriticModalOpen && (
            <DeckCriticModal report={report} onClose={closeCriticModal} />
          )}
        </>
        )
}
