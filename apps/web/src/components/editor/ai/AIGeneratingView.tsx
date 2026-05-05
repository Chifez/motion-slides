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
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="relative">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={16} className="text-purple-400 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-(--ms-text-primary)">Generating Slides</h3>
        <p className="text-xs text-(--ms-text-muted) max-w-[200px] leading-relaxed">
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
