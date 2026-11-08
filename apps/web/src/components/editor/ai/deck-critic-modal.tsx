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
  ChevronRight,
  Sliders,
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
    description: 'WCAG AA 4.5:1 luminance standard',
  },
  visualDensity: {
    label: 'Spatial Layout & Bounds',
    icon: Layers,
    description: '16:9 safe margins & bounding boxes',
  },
  typography: {
    label: 'Typography Hierarchy',
    icon: Type,
    description: 'Word density & text scale balance',
  },
  narrative: {
    label: 'Narrative Arc',
    icon: Sparkles,
    description: 'Headline clarity & slide progression',
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

  useEffect(() => {
    let ignore = false
    if (activeProjectId) {
      getEvaluationHistory(activeProjectId).then((data) => {
        if (!ignore) setHistory(data)
      })
    }
    return () => {
      ignore = true
    }
  }, [activeProjectId])

  // ESC key listener with explicit cleanup
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

      setFixSuccessMessage(`Auto-remediated ${result.actionsApplied.length} issue(s)`)
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

  const totalFixable = [...report.criticalIssues, ...report.warningIssues].filter((i) => i.autoFixable).length
  const totalIssuesCount = report.criticalIssues.length + report.warningIssues.length

  const getGradeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/25'
    return 'text-rose-400 bg-rose-500/10 border-rose-500/25'
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
          className="relative w-full max-w-xl bg-(--ms-bg-elevated) border border-(--ms-border) shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--ms-border) bg-(--ms-bg-base)/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-(--ms-text-primary) tracking-tight">
                  Deck Quality & Health Report
                </h2>
                <p className="text-[11px] text-(--ms-text-muted) mt-0.5">
                  {project?.name || 'Presentation Deck'} • {project?.slides.length ?? 0} slide(s) evaluated
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent active:scale-[0.95]"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>

          {/* Segmented Tab Navigation */}
          <div className="px-5 pt-3 pb-1 border-b border-(--ms-border) bg-(--ms-bg-base)/20">
            <div className="inline-flex items-center p-0.5 rounded-lg bg-(--ms-bg-base) border border-(--ms-border)">
              <button
                onClick={() => setActiveTab('overview')}
                className={`relative px-3.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border-none ${
                  activeTab === 'overview'
                    ? 'text-(--ms-text-primary)'
                    : 'text-(--ms-text-muted) hover:text-(--ms-text-secondary) bg-transparent'
                }`}
              >
                {activeTab === 'overview' && (
                  <motion.div
                    layoutId="critic-tab-pill"
                    transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                    className="absolute inset-0 rounded-md bg-(--ms-bg-surface) shadow-xs border border-(--ms-border-strong)"
                  />
                )}
                <span className="relative z-10">Quality Scorecard</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`relative px-3.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border-none flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'text-(--ms-text-primary)'
                    : 'text-(--ms-text-muted) hover:text-(--ms-text-secondary) bg-transparent'
                }`}
              >
                {activeTab === 'history' && (
                  <motion.div
                    layoutId="critic-tab-pill"
                    transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
                    className="absolute inset-0 rounded-md bg-(--ms-bg-surface) shadow-xs border border-(--ms-border-strong)"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  History {history.length > 0 && <span className="text-[10px] opacity-60">({history.length})</span>}
                </span>
              </button>
            </div>
          </div>

          {/* Body Content */}
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

            {activeTab === 'overview' ? (
              <>
                {/* Score Summary Hero Card */}
                <div className="p-4 rounded-xl bg-(--ms-bg-surface) border border-(--ms-border) flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center min-w-[72px]">
                      <span className="text-3xl font-extrabold font-mono tracking-tight text-(--ms-text-primary) tabular-nums">
                        {report.overallScore}
                      </span>
                      <span className="text-[10px] font-mono text-(--ms-text-muted)">out of 100</span>
                    </div>

                    <div className="h-10 w-px bg-(--ms-border) hidden sm:block" />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getGradeColor(report.overallScore)}`}>
                          Grade {report.grade}
                        </span>
                        <span className="text-xs font-semibold text-(--ms-text-primary)">
                          {report.overallScore >= 85
                            ? 'Ready for Presentation'
                            : report.overallScore >= 70
                            ? 'Good Baseline • Minor Adjustments'
                            : 'Review Required'}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-(--ms-text-muted) mt-1">
                        {totalIssuesCount === 0
                          ? 'Zero contrast, collision, or layout issues found.'
                          : `${totalIssuesCount} issue(s) detected across ${project?.slides.length || 0} slide(s).`}
                      </p>
                    </div>
                  </div>

                  {totalFixable > 0 && (
                    <button
                      onClick={handleAutoFixAll}
                      disabled={isRemediating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer border-none shadow-xs active:scale-[0.97] disabled:opacity-50 shrink-0"
                    >
                      <Wand2 size={13} />
                      <span>{isRemediating ? 'Remediating...' : `Auto-Fix (${totalFixable})`}</span>
                    </button>
                  )}
                </div>

                {/* Dimension Breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-(--ms-text-muted)">
                    <Sliders size={11} />
                    <span>Evaluation Dimensions</span>
                  </div>

                  <div className="space-y-2">
                    {(Object.entries(report.dimensions) as [DimensionKey, any][]).map(([key, dim]) => {
                      const config = DIMENSION_CONFIG[key]
                      const Icon = config.icon
                      const isHigh = dim.score >= 85
                      const isMid = dim.score >= 70

                      return (
                        <div
                          key={key}
                          className="p-2.5 rounded-xl bg-(--ms-bg-base)/60 border border-(--ms-border)/70 space-y-1.5"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-2 font-medium text-(--ms-text-primary)">
                              <Icon size={13} className="text-(--ms-text-muted)" />
                              <span>{config.label}</span>
                            </span>
                            <span className="font-mono text-[11px] tabular-nums font-semibold text-(--ms-text-primary)">
                              {dim.score}%
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-(--ms-border) overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isHigh ? 'bg-emerald-400' : isMid ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${dim.score}%` }}
                            />
                          </div>

                          <div className="text-[10px] text-(--ms-text-muted)">
                            {config.description}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-(--ms-text-muted)">
                      Detected Issues ({totalIssuesCount})
                    </span>
                  </div>

                  {totalIssuesCount === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-(--ms-bg-surface) border border-(--ms-border) space-y-1.5">
                      <ShieldCheck size={26} className="mx-auto text-emerald-400" />
                      <div className="text-xs font-semibold text-(--ms-text-primary)">All Standards Passed</div>
                      <p className="text-[11px] text-(--ms-text-muted)">
                        All slides satisfy WCAG AA contrast, spatial boundaries, and element alignment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {report.criticalIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-start justify-between p-3 rounded-xl bg-rose-500/[0.06] border border-rose-500/20 text-xs transition-colors"
                        >
                          <div className="flex items-start gap-2.5 pr-2">
                            <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                                  Slide {issue.slideIndex + 1}
                                </span>
                                <span className="font-semibold text-rose-200">
                                  {issue.message}
                                </span>
                              </div>
                              <p className="text-[11px] text-rose-300/70 font-normal">
                                {issue.suggestedFix}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleJumpToSlide(issue.slideIndex)}
                            title={`Jump to Slide ${issue.slideIndex + 1}`}
                            className="p-1 rounded-md hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer border-none bg-transparent shrink-0 active:scale-[0.95]"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      ))}

                      {report.warningIssues.map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-start justify-between p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-xs transition-colors"
                        >
                          <div className="flex items-start gap-2.5 pr-2">
                            <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                                  Slide {issue.slideIndex + 1}
                                </span>
                                <span className="font-semibold text-amber-200">
                                  {issue.message}
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-300/70 font-normal">
                                {issue.suggestedFix}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleJumpToSlide(issue.slideIndex)}
                            title={`Jump to Slide ${issue.slideIndex + 1}`}
                            className="p-1 rounded-md hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer border-none bg-transparent shrink-0 active:scale-[0.95]"
                          >
                            <ArrowRight size={14} />
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
                  <div className="py-12 text-center text-xs text-(--ms-text-muted)">
                    No prior evaluation snapshots recorded for this deck.
                  </div>
                ) : (
                  history.map((run, idx) => (
                    <div
                      key={run.runId || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-(--ms-bg-surface) border border-(--ms-border) text-xs hover:border-(--ms-border-strong) transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs tabular-nums border ${getGradeColor(
                            run.overallScore
                          )}`}
                        >
                          {run.overallScore}
                        </div>
                        <div>
                          <div className="font-semibold text-(--ms-text-primary)">
                            Grade {run.grade}
                          </div>
                          <div className="text-[11px] text-(--ms-text-muted) flex items-center gap-1.5 mt-0.5 font-mono">
                            <Clock size={11} />
                            {new Date(run.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })} • {run.triggeredBy}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-(--ms-text-muted)">
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
