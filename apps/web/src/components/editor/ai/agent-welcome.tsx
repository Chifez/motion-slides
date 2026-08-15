import { Sparkles, Zap, Film, ShieldCheck, GitBranch, Palette } from 'lucide-react'

interface Suggestion {
  icon: React.ElementType
  label: string
  prompt: string
  color: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: Sparkles,
    label: 'Synthesize Deck',
    prompt: 'Synthesize a 4-slide technical presentation explaining our Distributed Video Processing Pipeline with API Gateway, S3, SQS, and GPU Worker nodes.',
    color: 'text-blue-400',
  },
  {
    icon: Zap,
    label: 'Insert Redis Cache',
    prompt: 'Add a Redis Caching layer between the API Gateway and the Database with a 0.4s delay, and connect it with a dotted line labeled "cache lookup".',
    color: 'text-sky-400',
  },
  {
    icon: Film,
    label: 'Choreograph Flow',
    prompt: 'Choreograph the execution flow on this slide in causal order starting from Client to API Gateway to S3 with a 0.5s step delay.',
    color: 'text-amber-400',
  },
  {
    icon: ShieldCheck,
    label: 'Audit Quality',
    prompt: 'Audit the presentation quality for WCAG contrast violations, node density overload, and orphaned connector lines, and auto-fix any issues found.',
    color: 'text-emerald-400',
  },
  {
    icon: GitBranch,
    label: 'Exploratory Branch',
    prompt: 'Create an exploratory branch called "feature/event-driven-kafka" to test an alternative streaming architecture.',
    color: 'text-violet-400',
  },
  {
    icon: Palette,
    label: 'Apply Theme',
    prompt: 'Apply the "obsidian-cyan" theme across the entire presentation deck with Outfit typography and harmonize the slide styles.',
    color: 'text-teal-400',
  },
]

interface Props {
  onPrompt: (prompt: string) => void
}

export function AgentWelcome({ onPrompt }: Props) {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 select-none animate-in fade-in duration-200 text-center py-4 my-auto">
      {/* Hero Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-xs">
          <Sparkles size={16} />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-(--ms-text-primary) tracking-tight leading-tight">
            How can I help with your slides?
          </h3>
          <p className="text-xs text-(--ms-text-muted) leading-relaxed max-w-[280px]">
            Build architecture slides, choreograph flows, or audit deck quality.
          </p>
        </div>
      </div>

      {/* Suggested Actions: Centered Flex Wrap Pills with Breathing Room */}
      <div className="w-full flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold text-(--ms-text-muted) uppercase tracking-wider text-center">
          Quick Actions
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-[340px]">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => onPrompt(s.prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-(--ms-bg-elevated) hover:bg-(--ms-bg-surface) border border-(--ms-border) hover:border-(--ms-border-strong) text-left transition-all duration-150 active:scale-[0.97] cursor-pointer group shadow-2xs"
              >
                <Icon size={12} className={`${s.color} shrink-0`} />
                <span className="text-xs font-medium text-(--ms-text-secondary) group-hover:text-(--ms-text-primary) transition-colors whitespace-nowrap">
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
