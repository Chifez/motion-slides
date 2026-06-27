import { useEditorStore } from '@/store/editorStore'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudCheck, RefreshCw } from 'lucide-react'
import { useLocation } from '@tanstack/react-router'

/**
 * SyncFooter — Minimalist status bar for background synchronization.
 * Uses MS design system tokens for theme flexibility.
 */
export function SyncFooter() {
  const isSyncing = useEditorStore((s) => s.isSyncing)
  const syncError = useEditorStore((s) => s.syncError)
  const user = useEditorStore((s) => s.user)
  const location = useLocation()

  const isProject = location.pathname.startsWith('/p')

  if (!user || location.pathname === '/' || location.pathname.startsWith('/embed')) return null

  return (
    <div className="fixed bottom-4 right-4 bg-(--ms-bg-surface) border border-(--ms-border) rounded-full px-3 py-1.5 shadow-lg z-999 pointer-events-none transition-colors">
      <AnimatePresence mode="wait">
        {isSyncing ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-[10px] text-blue-500 font-medium"
          >
            <RefreshCw size={10} className="animate-spin" />
            <span>Syncing database...</span>
          </motion.div>
        ) : syncError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-[10px] text-red-400 font-semibold"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>Sync failed (Offline)</span>
          </motion.div>
        ) : (
          <motion.div
            key="synced"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[10px] text-(--ms-text-muted)"
          >
            <CloudCheck size={10} />
            <span>{isProject ? 'synced' : 'All projects synced'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
