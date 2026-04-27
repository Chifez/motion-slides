import { useEditorStore } from '@/store/editorStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloud, CloudCheck, RefreshCw } from 'lucide-react'

/**
 * SyncFooter — Minimalist status bar for background synchronization.
 */
export function SyncFooter() {
  const isSyncing = useEditorStore((s) => s.isSyncing)
  const user = useEditorStore((s) => s.user)
  
  if (!user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#0d0d0d] border-t border-white/5 flex items-center justify-end px-4 z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        {isSyncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-[10px] text-blue-400 font-medium"
          >
            <RefreshCw size={10} className="animate-spin" />
            <span>Syncing database...</span>
          </motion.div>
        ) : (
          <motion.div
            key="synced"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="flex items-center gap-2 text-[10px] text-white/40"
          >
            <CloudCheck size={10} />
            <span>All projects synced</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
