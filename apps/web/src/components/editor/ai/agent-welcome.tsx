interface Suggestion {
  label: string
  prompt: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: 'Synthesize Deck',
    prompt: 'Synthesize a 4-slide technical presentation explaining our Distributed Video Processing Pipeline with API Gateway, S3, SQS, and GPU Worker nodes.',
  },
  {
    label: 'Insert Redis Cache',
    prompt: 'Add a Redis Caching layer between the API Gateway and the Database with a 0.4s delay, and connect it with a dotted line labeled "cache lookup".',
  },
  {
    label: 'Choreograph Flow',
    prompt: 'Choreograph the execution flow on this slide in causal order starting from Client to API Gateway to S3 with a 0.5s step delay.',
  },
  {
    label: 'Audit Quality',
    prompt: 'Audit the presentation quality for WCAG contrast violations, node density overload, and orphaned connector lines, and auto-fix any issues found.',
  },
  {
    label: 'Exploratory Branch',
    prompt: 'Create an exploratory branch called "feature/event-driven-kafka" to test an alternative streaming architecture.',
  },
  {
    label: 'Apply Theme',
    prompt: 'Apply the "obsidian-cyan" theme across the entire presentation deck with Outfit typography and harmonize the slide styles.',
  },
]

interface Props {
  onPrompt: (prompt: string) => void
}

export function AgentWelcome({ onPrompt }: Props) {
  return (
    <div className="my-auto flex w-full flex-col items-center justify-center gap-6 py-4 text-center select-none">
      {/* Centered Header */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-[14px] leading-5 font-semibold tracking-tight text-(--ms-text-primary)">
          How can I help with your slides?
        </h2>
        <p className="max-w-[260px] text-xs leading-relaxed text-(--ms-text-muted)">
          Build architecture slides, choreograph flows, or audit deck quality.
        </p>
      </div>

      {/* Centered Quick Actions (No Decorative Icons) */}
      <div className="flex w-full flex-col items-center gap-2.5">
        <span className="text-center text-[10px] font-medium tracking-wider text-(--ms-text-muted) uppercase">
          Quick Actions
        </span>
        <div className="flex max-w-[340px] flex-wrap items-center justify-center gap-2">
          {SUGGESTIONS.map(({ label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => onPrompt(prompt)}
              className="ms-focus-ring group inline-flex cursor-pointer items-center rounded-full border border-(--ms-border) bg-(--ms-bg-elevated) px-3 py-1.5 text-xs font-medium whitespace-nowrap text-(--ms-text-secondary) shadow-2xs transition-[transform,background-color,border-color,color] duration-150 hover:border-(--ms-border-strong) hover:bg-(--ms-bg-surface) hover:text-(--ms-text-primary) active:scale-[0.97]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
