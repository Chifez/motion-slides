import { motion } from 'framer-motion'
import { BotMessageSquare, Sparkles, Layers, Zap, Film, Palette } from 'lucide-react'

interface Suggestion {
  icon: React.ElementType
  label: string
  prompt: string
  color: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: Sparkles,
    label: 'Create a deck',
    prompt: 'Create a 5-slide pitch deck about a SaaS product with a hero slide, problem, solution, features, and CTA.',
    color: 'text-purple-400',
  },
  {
    icon: Zap,
    label: 'Animate everything',
    prompt: 'Apply staggered slide-up animations to all elements on the current slide.',
    color: 'text-blue-400',
  },
  {
    icon: Film,
    label: 'Cinematic transitions',
    prompt: 'Read my project slides and add magic-move transitions between all consecutive slides.',
    color: 'text-pink-400',
  },
  {
    icon: Layers,
    label: 'Review my deck',
    prompt: 'Read the current project state and give me a quick summary of what slides and transitions I have.',
    color: 'text-emerald-400',
  },
  {
    icon: Palette,
    label: 'Dark gradient slide',
    prompt: 'Set the current slide background to a deep dark blue-purple gradient.',
    color: 'text-orange-400',
  },
]

interface Props {
  onPrompt: (prompt: string) => void
}

export function AgentWelcome({ onPrompt }: Props) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col items-center pt-6 pb-2 gap-6"
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/30 to-blue-600/20 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-900/20"
      >
        <BotMessageSquare size={28} className="text-purple-300" />
      </motion.div>

      <div className="text-center space-y-1 px-2">
        <h3 className="text-sm font-bold text-(--ms-text-primary)">MotionSlide Agent</h3>
        <p className="text-[11px] text-(--ms-text-muted) leading-relaxed max-w-[260px]">
          I can build slides, animate elements, design transitions, and prototype flows — just ask.
        </p>
      </div>

      {/* Quick Actions — Flex Wrap & Centered */}
      <div className="w-full flex flex-col items-center gap-2.5">
        <p className="text-[9px] font-black text-(--ms-text-muted) uppercase tracking-[0.2em] text-center">
          Try asking…
        </p>
        <div className="flex flex-wrap justify-center gap-2 max-w-[360px]">
          {SUGGESTIONS.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.button
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onPrompt(s.prompt)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-(--ms-bg-elevated) border border-(--ms-border) hover:border-purple-500/40 hover:bg-purple-500/10 text-left transition-all group cursor-pointer shadow-sm hover:shadow-purple-500/10"
              >
                <Icon size={14} className={`${s.color} shrink-0 group-hover:scale-110 transition-transform`} />
                <span className="text-xs text-(--ms-text-secondary) group-hover:text-(--ms-text-primary) transition-colors font-medium whitespace-nowrap">
                  {s.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
