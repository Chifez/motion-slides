import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Plus,
  Undo2,
  X,
} from 'lucide-react'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

interface CopilotTab {
  id: 'synthesize' | 'patch' | 'audit'
  label: string
  threadTitle: string
  description: string
  highlights: string[]
  fileChip?: string
  userPrompt: string
  workedDuration: string
  steps: string[]
  responseLead: string
  slideRef: number
  responseTail: string
}

const TABS: CopilotTab[] = [
  {
    id: 'synthesize',
    label: 'Synthesize from Spec',
    threadTitle: 'Synthesize video pipeline RFC',
    description:
      'Attach a technical RFC, Markdown doc, PDF, or DOCX directly in the composer. Copilot extracts structure client-side and builds multi-slide decks with charts, code blocks, and Magic Move IDs.',
    highlights: [
      'Client-side PDF, DOCX, Markdown & code extraction',
      'Shared component IDs preserved across slides for Magic Move',
      'Native Bar/Line/Area charts & Shiki code blocks',
    ],
    fileChip: 'video-pipeline-rfc.md',
    userPrompt:
      'Turn this RFC into a 5-slide architecture walkthrough with latency charts and worker config.',
    workedDuration: '12s',
    steps: [
      'Project state read',
      'Presentation deck synthesized (5 slides)',
      'Deck theme applied (obsidian-cyan)',
    ],
    responseLead: 'Created a 5-slide deck starting on ',
    slideRef: 2,
    responseTail:
      ' with VPC ingestion boundaries, latency p95 chart metrics, and worker config.',
  },
  {
    id: 'patch',
    label: 'Patch Diagram',
    threadTitle: 'Add Redis cache layer',
    description:
      'Iterate surgically without wiping manual adjustments. Patch tools insert nodes, reroute port-snapped connectors, and swap chart types in place while leaving surrounding elements intact.',
    highlights: [
      'Incremental node & connector patching via patchDiagram',
      'Existing element positions and styles stay untouched',
      'Inline approval gate before destructive slide/element deletes',
    ],
    userPrompt:
      'Insert a Redis cache between the API Gateway and Postgres with a dashed lookup connector.',
    workedDuration: '6s',
    steps: [
      'Project state read',
      'Diagram layout patched (+1 node, +2 edges)',
    ],
    responseLead: 'Inserted Redis Cache on ',
    slideRef: 2,
    responseTail:
      ' and routed a dashed “cache lookup” connector from API Gateway.',
  },
  {
    id: 'audit',
    label: 'Audit & Choreograph',
    threadTitle: 'Contrast & flow audit',
    description:
      'Run deterministic WCAG AA contrast, node density, and orphaned connector audits—or sequence entrance delays and line draws along your system’s causal execution path.',
    highlights: [
      'Automated contrast, overlap & orphaned connector detection',
      'Causal execution choreography with staggered delays',
      'Interactive Slide N pills jump straight to any target slide',
    ],
    userPrompt:
      'Audit deck contrast and choreograph the data flow starting from Client → Gateway → Queue.',
    workedDuration: '8s',
    steps: [
      'Quality audit completed (Score: 96/100)',
      'Motion flow choreographed (0.4s stagger)',
    ],
    responseLead: 'Resolved 2 contrast warnings on ',
    slideRef: 3,
    responseTail:
      ' and synchronized causal draw animations across the request path.',
  },
]

const CAPABILITY_BAR = [
  { label: '34 Native Tools', detail: 'Diagrams, charts, code, git & slides' },
  { label: 'PDF / DOCX / Markdown', detail: 'Local extraction in the composer' },
  { label: 'BYOK + Groq / Ollama', detail: 'OpenAI, Anthropic, or local open models' },
  { label: '1-Click Time-Travel Undo', detail: 'Automatic snapshot before every turn' },
] as const

export function LandingAIStudioFeature() {
  const [activeId, setActiveId] = useState<CopilotTab['id']>('synthesize')
  const [ledgerOpen, setLedgerOpen] = useState(true)
  const shouldReduceMotion = useReducedMotion()

  const active = TABS.find((t) => t.id === activeId) ?? TABS[0]

  return (
    <section id="copilot" className="max-w-[1120px] mx-auto px-[24px] py-[104px]">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      >
        {/* Header */}
        <div className="max-w-[640px] mb-[40px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500 mb-[12px]">
            02 / COPILOT
          </p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] leading-[1.08] text-white mb-[14px]">
            An agent that edits your deck, not just a chat box.
          </h2>
          <p className="text-[16px] leading-[1.6] text-zinc-400">
            Drop a spec, PDF, or Markdown file—or ask for surgical changes. Copilot orchestrates 34 native tools directly on your canvas with 1-click turn undo.
          </p>
        </div>

        {/* Interactive Studio Shell */}
        <div className="rounded-[16px] border border-white/[0.08] bg-[#0C0C0F] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
          {/* Tab header */}
          <div className="flex items-center gap-[4px] px-[12px] py-[10px] border-b border-white/[0.06] bg-[#09090C] overflow-x-auto">
            {TABS.map((tab) => {
              const isSelected = tab.id === activeId
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveId(tab.id)
                    setLedgerOpen(true)
                  }}
                  className={`px-[12px] py-[7px] rounded-[8px] text-[12px] font-medium border-none cursor-pointer transition-[transform,background-color,color] duration-150 active:scale-[0.97] whitespace-nowrap ${
                    isSelected
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* 2-Column Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Narrative Left Column */}
            <div className="lg:col-span-5 p-[28px] lg:p-[32px] border-b lg:border-b-0 lg:border-r border-white/[0.06] flex flex-col justify-between gap-[24px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className="flex flex-col gap-[20px]"
                >
                  <p className="text-[15px] leading-[1.6] text-zinc-300">
                    {active.description}
                  </p>

                  <ul className="flex flex-col gap-[10px] list-none p-0 m-0">
                    {active.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-[8px] text-[13px] leading-[1.5] text-zinc-400">
                        <span className="mt-[6px] w-[4px] h-[4px] rounded-full bg-zinc-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              <div>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-[6px] text-[13px] font-medium text-blue-400 hover:text-blue-300 no-underline transition-colors duration-150"
                >
                  Open Copilot in the editor
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Column: Miniature Docked Copilot Rail */}
            <div className="lg:col-span-7 p-[24px] lg:p-[32px] bg-[#070709]/60 flex items-center justify-center">
              <div className="w-full max-w-[460px] rounded-[12px] border border-white/[0.08] bg-[#121216] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {/* 44px Thread Header */}
                <div className="h-[44px] px-[14px] border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-[6px] text-[13px] font-medium text-zinc-100 min-w-0">
                    <span className="truncate">{active.threadTitle}</span>
                    <ChevronDown size={12} className="text-zinc-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-[4px] text-zinc-500 shrink-0">
                    <span className="w-[24px] h-[24px] flex items-center justify-center rounded-[6px]">
                      <Plus size={14} />
                    </span>
                    <span className="w-[24px] h-[24px] flex items-center justify-center rounded-[6px]">
                      <X size={14} />
                    </span>
                  </div>
                </div>

                {/* Single-Column Reading Thread */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    className="p-[18px] flex flex-col gap-[18px]"
                  >
                    {/* User Turn Card */}
                    <div className="rounded-[10px] border border-white/[0.08] bg-[#18181D] px-[14px] py-[12px] flex flex-col gap-[8px]">
                      {active.fileChip && (
                        <span className="inline-flex items-center gap-[6px] self-start rounded-[6px] border border-white/[0.08] bg-[#121216] px-[8px] py-[3px] text-[11px] font-mono text-zinc-300">
                          <FileText size={11} className="text-zinc-500" />
                          {active.fileChip}
                        </span>
                      )}
                      <p className="text-[13px] leading-[1.55] text-zinc-100 m-0">
                        {active.userPrompt}
                      </p>
                    </div>

                    {/* Assistant Turn */}
                    <div className="flex flex-col gap-[12px]">
                      {/* Collapsible Activity Ledger */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setLedgerOpen((prev) => !prev)}
                          aria-expanded={ledgerOpen}
                          className="-ml-[4px] inline-flex items-center gap-[8px] h-[28px] px-[6px] rounded-[6px] border-none bg-transparent hover:bg-white/[0.04] cursor-pointer text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors duration-150"
                        >
                          <Check size={12} strokeWidth={2.5} className="text-emerald-500 shrink-0" />
                          <span>Worked for {active.workedDuration}</span>
                          <ChevronRight
                            size={12}
                            className={`text-zinc-500 transition-transform duration-150 ${ledgerOpen ? 'rotate-90' : ''}`}
                          />
                        </button>

                        {ledgerOpen && (
                          <ol className="relative mt-[8px] flex flex-col gap-[8px] list-none p-0 m-0 pl-[2px] before:absolute before:top-[6px] before:bottom-[6px] before:left-[6px] before:w-px before:bg-white/[0.1] before:content-['']">
                            {active.steps.map((step) => (
                              <li key={step} className="flex items-center gap-[10px]">
                                <span className="relative z-10 flex w-[10px] h-[10px] items-center justify-center bg-[#121216]">
                                  <span className="w-[5px] h-[5px] rounded-full bg-zinc-600" />
                                </span>
                                <span className="text-[12px] text-zinc-400 truncate">{step}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>

                      {/* Agent Markdown Prose + Slide Deep-link Pill */}
                      <p className="text-[13px] leading-[1.6] text-zinc-200 m-0">
                        {active.responseLead}
                        <span className="mx-[2px] inline-flex items-center gap-[2px] rounded-[6px] border border-white/[0.12] bg-[#18181D] px-[6px] py-[1px] text-[11px] font-medium text-blue-400 align-baseline">
                          Slide {active.slideRef}
                          <ArrowUpRight size={10} />
                        </span>
                        {active.responseTail}
                      </p>

                      {/* Turn Action Bar */}
                      <div className="flex items-center gap-[8px] pt-[2px] text-[12px] text-zinc-500">
                        <span className="inline-flex items-center gap-[4px]">
                          <Copy size={12} />
                        </span>
                        <span className="inline-flex items-center gap-[4px]">
                          <Undo2 size={12} />
                          Undo changes
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 4-cell Capability Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-white/[0.06] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] bg-[#09090C]">
            {CAPABILITY_BAR.map((cell) => (
              <div key={cell.label} className="px-[20px] py-[16px]">
                <p className="font-mono text-[12px] font-medium text-zinc-200 mb-[2px]">
                  {cell.label}
                </p>
                <p className="text-[12px] text-zinc-500 leading-[1.45]">
                  {cell.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
