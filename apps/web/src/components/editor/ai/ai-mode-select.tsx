import { memo } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Layers, MessageSquare } from 'lucide-react'
import { ModeCard } from './mode-card'

interface Props {
  onSelectTab: (tab: 'readme' | 'architecture') => void
}

export const AIModeSelect = memo(function AIModeSelect({ onSelectTab }: Props) {
  return (
    <motion.div
      key="select"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <header>
        <h2 className="text-xl font-bold text-(--ms-text-primary) mb-2">Magic Move Slides</h2>
        <p className="text-xs text-(--ms-text-muted) leading-relaxed">
          Transform your documentation or ideas into stunning presentations using AI.
        </p>
      </header>

      <div className="grid gap-3 pt-2">
        <ModeCard
          icon={<BookOpen size={20} />}
          title="From README"
          description="Paste or upload a Markdown file to generate project slides."
          onClick={() => onSelectTab('readme')}
          color="blue"
        />
        <ModeCard
          icon={<Layers size={20} />}
          title="Architecture Walkthrough"
          description="Describe your system and generate a multi-slide diagram."
          onClick={() => onSelectTab('architecture')}
          color="purple"
        />
        <ModeCard
          icon={<MessageSquare size={20} />}
          title="Free Prompt (Coming soon)"
          description="Describe what you want to see and the AI will build it."
          onClick={() => { }}
          color="neutral"
          disabled
        />
      </div>
    </motion.div>
  )
})
