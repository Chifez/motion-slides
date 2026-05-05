import { memo, type ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
  color: 'blue' | 'purple' | 'neutral'
  disabled?: boolean
}

export const ModeCard = memo(function ModeCard({ icon, title, description, onClick, color, disabled }: Props) {
  const colors: Record<string, string> = {
    blue: 'hover:border-blue-500/40 hover:bg-blue-500/5 text-blue-400',
    purple: 'hover:border-purple-500/40 hover:bg-purple-500/5 text-purple-400',
    neutral: 'opacity-50 cursor-not-allowed',
  }

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border border-(--ms-border) bg-(--ms-bg-elevated) transition-all group border-none cursor-pointer ${colors[color] || ''}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-black/10 group-hover:bg-black/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-(--ms-text-primary)">{title}</h3>
      </div>
      <p className="text-[11px] text-(--ms-text-muted) group-hover:text-(--ms-text-primary) leading-relaxed">
        {description}
      </p>
    </button>
  )
})
