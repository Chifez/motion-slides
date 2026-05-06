import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Cloud, ChevronDown } from 'lucide-react'
import { AuthModal } from './AuthModal'

/**
 * User account menu with theme-flexible styling.
 * Uses standard CSS variables for consistent behavior across light/dark modes.
 */
export function UserMenu() {
  const user = useEditorStore((s) => s.user)
  const logout = useEditorStore((s) => s.logout)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors px-4 py-1.5 rounded-full border border-(--ms-border) hover:border-(--ms-border-strong) bg-transparent cursor-pointer"
        >
          Sign In
        </button>
        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-(--ms-bg-elevated) hover:bg-(--ms-border) border border-(--ms-border) transition-all cursor-pointer text-left"
      >
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-inner">
          {user.name?.[0] || 'U'}
        </div>
        <span className="text-[11px] font-medium text-(--ms-text-primary) max-w-[80px] truncate">
          {user.name}
        </span>
        <ChevronDown size={12} className={`text-(--ms-text-muted) transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-48 bg-(--ms-bg-surface) border border-(--ms-border-strong) rounded-xl shadow-2xl overflow-hidden z-50 p-1"
            >
              <div className="px-3 py-2 border-b border-(--ms-border) mb-1">
                <p className="text-[9px] font-bold text-(--ms-text-muted) uppercase tracking-widest mb-0.5">Account</p>
                <p className="text-[11px] font-medium text-(--ms-text-primary) truncate">{user.email}</p>
              </div>

              <button className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) rounded-lg transition-all cursor-pointer border-none bg-transparent">
                <User size={14} />
                <span>Profile Settings</span>
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) rounded-lg transition-all cursor-pointer border-none bg-transparent">
                <Cloud size={14} />
                <span>Sync Preferences</span>
              </button>

              <button
                onClick={() => {
                  logout()
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer border-none bg-transparent mt-1"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
