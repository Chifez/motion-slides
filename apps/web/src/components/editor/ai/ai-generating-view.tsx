import { memo } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'

interface Props {
  progress: {
    percent: number
    message: string
  }
}

export const AIGeneratingView = memo(function AIGeneratingView({ progress }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-black/20">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={12} className="text-purple-400 animate-pulse" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-(--ms-text-primary)">Designing Slides</h3>
        <p className="text-[10px] text-(--ms-text-muted) max-w-[180px] leading-relaxed truncate">
          {progress.message}
        </p>
      </div>
      <div className="w-full max-w-[240px] h-1.5 bg-(--ms-bg-elevated) rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  )
})
