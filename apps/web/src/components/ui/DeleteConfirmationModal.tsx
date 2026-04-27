import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, projectName }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >


            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-900/20 text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Delete Project</h3>
                  <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                    Are you sure you want to delete <span className="text-neutral-200 font-medium">"{projectName}"</span>? 
                    This action cannot be undone and will permanently remove all slides and prototype data.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 text-neutral-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-all border border-white/10 cursor-pointer bg-transparent"
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
                  Delete Permanently
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
