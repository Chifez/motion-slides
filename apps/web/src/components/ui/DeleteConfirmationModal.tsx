import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
  title?: string
  description?: ReactNode
  confirmText?: string
}


export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  title = 'Delete Project',
  description,
  confirmText = 'Delete Permanently'
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-(--z-modal) flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-(--ms-bg-surface) border border-(--ms-border) rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-(--ms-text-primary)">{title}</h3>
                  <p className="text-sm text-(--ms-text-muted) mt-1 leading-relaxed">
                    {description ?? (
                      <>
                        Are you sure you want to delete <span className="text-(--ms-text-primary) font-medium">"{projectName}"</span>?
                        This action cannot be undone and will permanently remove all slides and prototype data.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) transition-all border border-(--ms-border) cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-all border-none cursor-pointer shadow-lg shadow-red-600/10 active:scale-95"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
