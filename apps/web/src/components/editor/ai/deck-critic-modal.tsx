import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Wand2,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  Type,
  Sparkles,
  Move,
  ArrowRight,
  CircleDashed,
  Plus,
} from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import type { DeckEvaluationReport, DimensionKey } from '@/lib/agent/evaluation/evaluation-types'
import { applyRemediationPlan } from '@/lib/agent/evaluation/remediation-engine'
import { getEvaluationHistory, saveEvaluationReport } from '@/lib/agent/evaluation/evaluation-history-store'

interface Props {
  report: DeckEvaluationReport
  onClose: () => void
}

const DIMENSION_CONFIG: Record<
  DimensionKey,
  { label: string; icon: React.ElementType; description: string }
> = {
  accessibility: {
    label: 'Contrast & Readability',
    icon: Eye,
    description: 'WCAG AA 4.5:1 relative luminance',
  },
  visualDensity: {
    label: 'Spatial Layout & Bounds',
    icon: Layers,
    description: '16:9 safe margins and collision physics',
  },
  typography: {
    label: 'Typography Hierarchy',
    icon: Type,
    description: 'Word density and text scale balance',
  },
  narrative: {
    label: 'Narrative Arc',
    icon: Sparkles,
    description: 'Headline clarity and logical progression',
  },
  motionAndFlow: {
    label: 'Motion & Magic Move',
    icon: Move,
    description: 'Cross-slide entity ID consistency',
  },
}

export function DeckCriticModal({ report: initialReport, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')
  const [report, setReport] = useState<DeckEvaluationReport>(initialReport)
  const [history, setHistory] = useState<DeckEvaluationReport[]>([])
  const [isRemediating, setIsRemediating] = useState(false)
  const [fixSuccessMessage, setFixSuccessMessage] = useState<string | null>(null)

  const project = useEditorStore((s) => s.activeProject())
  const setActiveSlideIndex = useEditorStore((s) => s.setActiveSlideIndex)
  const activeProjectId = useEditorStore((s) => s.activeProjectId)
  const toggleChat = useEditorStore((s) => s.toggleChat)

  useEffect(() => {
    if (activeProjectId) {
      getEvaluationHistory(activeProjectId).then(setHistory)
    }
  }, [activeProjectId])

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleAutoFixAll = async () => {
    if (!project || !activeProjectId) return
    setIsRemediating(true)

    try {
      useEditorStore.getState().pushSnapshot()
      const result = applyRemediationPlan(project, report)

      useEditorStore.setState((s) => ({
        projects: s.projects.map((p) => (p.id !== activeProjectId ? p : result.updatedProject)),
      }))
      useEditorStore.getState().recalculateLines()

      await saveEvaluationReport(activeProjectId, result.remediatedReport)
      setReport(result.remediatedReport)

      const updatedHistory = await getEvaluationHistory(activeProjectId)
      setHistory(updatedHistory)

      setFixSuccessMessage(`Applied ${result.actionsApplied.length} auto-remediation fix(es)`)
      setTimeout(() => setFixSuccessMessage(null), 3500)
    } catch (err) {
      console.error('[DeckCritic] Auto-fix error:', err)
    } finally {
      setIsRemediating(false)
    }
  }

  const handleJumpToSlide = (slideIndex: number) => {
    setActiveSlideIndex(slideIndex)
    onClose()
  }

  const isEmpty = report.isEmptyDeck
  const totalFixable = [...report.criticalIssues, ...report.warningIssues].filter((i) => i.autoFixable).length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
          className="relative w-full max-w-xl bg-[#0f111a]/95 border border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)] rounded-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">Presentation Health</h2>
              <p className="text-xs text-white/40 mt-0.5">
                {project ? project.name : 'Untitled Deck'} • {project?.slides.length ?? 0} slide(s)
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer border-none bg-transparent active:scale-[0.95]"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>

          {/* Segmented Tab Navigation */}
          {!isEmpty && (
            <div className="px-5 pt-3 pb-1 border-b border-white/[0.06] bg-white/[0.01]">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`relative px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border-none ${
                    activeTab === 'overview' ? 'text-white' : 'text-white/50 hover:text-white/80 bg-transparent'
                  }`}
                >
                  {activeTab === 'overview' && (
                    <motion.div
                      layoutId="critic-tab-pill"
                      transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                      className="absolute inset-0 rounded-md bg-white/[0.12] shadow-xs"
                    />
                  )}
                  <span className="relative z-10">Scorecard</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`relative px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border-none flex items-center gap-1.5 ${
                    activeTab === 'history' ? 'text-white' : 'text-white/50 hover:text-white/80 bg-transparent'
                  }`}
                >
                  {activeTab === 'history' && (
                    <motion.div
                      layoutId="critic-tab-pill"
                      transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                      className="absolute inset-0 rounded-md bg-white/[0.12] shadow-xs"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    History {history.length > 0 && <span className="text-[10px] opacity-60">({history.length})</span>}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
            {fixSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
              >
                <CheckCircle2 size={15} />
                <span>{fixSuccessMessage}</span>
              </motion.div>
            )}

            {isEmpty ? (
              /* Empty Canvas State */
              <div className="py-12 px-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-white/40">
                  <CircleDashed size={24} className="animate-spin-slow" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">Canvas is Empty</h3>
                  <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                    This deck is currently a blank draft. Add shapes, architecture diagrams, or synthesize slides with AI to evaluate contrast, spatial layout, and flow.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose()
                      toggleChat()
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer border-none shadow-sm active:scale-[0.98]"
                  >
                    <Sparkles size={13} />
                    <span>Open AI Copilot</span>
                  </button>
                </div>
              </div>
            ) : activeTab === 'overview' ? (
              <>
                {/* Score Summary Card */}
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="col-span-1 flex flex-col items-center justify-center border-r border-white/[0.06] pr-4">
                    <div className="text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
                      {report.overallScore}
                      <span className="text-xs font-normal text-white/30 ml-0.5">/100</span>
                    </div>
                    <div className="text-[11px] font-semibold text-blue-400 mt-1 uppercase tracking-wider">
                      Grade {report.grade}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-2 pl-2">
                    {(Object.entries(report.dimensions) as [DimensionKey, any][]).map(([key, dim]) => {
                      const config = DIMENSION_CONFIG[key]
                      const Icon = config.icon
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs items-center">
                            <span className="text-white/60 flex items-center gap-1.5 font-medium">
                              <Icon size={12} className="text-white/40" />
                              <span>{config.label}</span>
                            </span>
                            <span className="font-mono text-[11px] tabular-nums font-semibold text-white/80">
                              {dim.score}%
                            </span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                dim.score >= 85
                                  ? 'bg-emerald-400'
                                  : dim.score >= 70
                                  ? 'bg-amber-400'
                                  : 'bg-rose-400'
                              }`}
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white/50 tracking-wide uppercase">
                      Issues ({report.criticalIssues.length + report.warningIssues.length})
                    </h3>

                    {totalFixable > 0 && (
                      <button
                        onClick={handleAutoFixAll}
                        disabled={isRemediating}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer border-none shadow-xs active:scale-[0.98] disabled:opacity-50"
                      >
                        <Wand2 size={12} />
                        <span>{isRemediating ? 'Fixing...' : `Auto-Fix (${totalFixable})`}</span>
                      </button>
                    )}
                  </div>

                  {report.criticalIssues.length === 0 && report.warningIssues.length === 0 ? (
                    <div className="p-5 text-center rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <ShieldCheck size={22} className="mx-auto text-emerald-400" />
                      <div className="text-xs font-semibold text-white">No Issues Detected</div>
                      <p className="text-[11px] text-white/40">All elements comply with contrast, bounds, and layout rules.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {report.criticalIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-start justify-between p-3 rounded-xl bg-rose-500/[0.07] border border-rose-500/15 text-xs text-rose-300 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 pr-2">
                            <AlertCircle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <div className="font-medium text-rose-200">
                                Slide {issue.slideIndex + 1}: {issue.message}
                              </div>
                              <div className="text-[11px] text-rose-300/60 font-normal">
                                {issue.suggestedFix}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleJumpToSlide(issue.slideIndex)}
                            title="Jump to slide"
                            className="p-1 rounded-md hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer border-none bg-transparent shrink-0 active:scale-[0.95]"
                          >
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}

                      {report.warningIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-start justify-between p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 text-xs text-amber-300 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 pr-2">
                            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <div className="font-medium text-amber-200">
                                Slide {issue.slideIndex + 1}: {issue.message}
                              </div>
                              <div className="text-[11px] text-amber-300/60 font-normal">
                                {issue.suggestedFix}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleJumpToSlide(issue.slideIndex)}
                            title="Jump to slide"
                            className="p-1 rounded-md hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer border-none bg-transparent shrink-0 active:scale-[0.95]"
                          >
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* History Tab */
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="py-12 text-center text-xs text-white/30">
                    No prior evaluation snapshots recorded for this deck.
                  </div>
                ) : (
                  history.map((run, idx) => (
                    <div
                      key={run.runId || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs tabular-nums ${
                            run.overallScore >= 85
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : run.overallScore >= 70
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {run.overallScore}
                        </div>
                        <div>
                          <div className="font-medium text-white">Grade {run.grade}</div>
                          <div className="text-[11px] text-white/40 flex items-center gap-1.5 mt-0.5 font-mono">
                            <Clock size={11} />
                            {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {run.triggeredBy}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-white/40">
                        {run.criticalIssues.length} critical • {run.warningIssues.length} warnings
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
