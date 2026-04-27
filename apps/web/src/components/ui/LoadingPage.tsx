import { motion } from 'framer-motion'
import { Logo } from './Logo'
import { Loader2 } from 'lucide-react'

/**
 * LoadingPage — A high-fidelity full-screen loading state
 * Used by TanStack Router as the `pendingComponent` while hydrating stores or fetching data.
 */
export function LoadingPage() {
  return (
    <div className="fixed inset-0 bg-[#0d0d0d] flex flex-col items-center justify-center z-9999">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center gap-8"
      >
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        >
          <Logo expanded size={48} />
        </motion.div>

        <div className="flex items-center gap-3 text-white/40">
          <Loader2 size={16} className="animate-spin text-blue-500" />
          <span className="text-xs font-semibold tracking-widest uppercase text-white/50">
            Initializing Workspace...
          </span>
        </div>
      </motion.div>
    </div>
  )
}
