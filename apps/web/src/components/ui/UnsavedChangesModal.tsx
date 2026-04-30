import { motion, AnimatePresence } from 'framer-motion'
import { Save, LogOut, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void // Save & Leave
  onDiscard: () => void // Just Leave
}

export function UnsavedChangesModal({ isOpen, onClose, onConfirm, onDiscard }: Props) {
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
                <div className="p-3 rounded-xl bg-amber-900/20 text-amber-500">
                  <Save size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Unsaved Changes</h3>
                  <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
                    You have changes that haven't been synced to the cloud yet. 
                    Would you like to save them before leaving?
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 text-neutral-500 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-8">
                <button
                  onClick={onConfirm}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-black bg-white hover:bg-neutral-200 transition-all border-none cursor-pointer shadow-lg active:scale-[0.98]"
                >
                  <Save size={16} />
                  Save and Leave
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={onDiscard}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all border border-white/5 cursor-pointer bg-transparent"
                  >
                    <LogOut size={16} />
                    Leave Anyway
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-all border border-white/10 cursor-pointer bg-transparent"
                  >
                    Stay
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
