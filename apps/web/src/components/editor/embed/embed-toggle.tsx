import { motion } from 'framer-motion'

interface EmbedToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function EmbedToggle({ label, description, checked, onChange }: EmbedToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-xs text-(--ms-text-primary) font-semibold">{label}</span>
        <span className="text-[9px] text-(--ms-text-muted)">{description}</span>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors border-none cursor-pointer flex items-center p-0.5 ${
          checked ? 'bg-blue-600 justify-end' : 'bg-neutral-800 justify-start'
        }`}
      >
        <motion.div
          layout
          className="w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  )
}
