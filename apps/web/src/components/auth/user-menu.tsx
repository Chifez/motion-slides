import { useState } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Cloud, ChevronDown, Download, Settings, ShieldCheck } from 'lucide-react'
import { AuthModal } from './auth-modal'
import { AllowlistModal } from './allowlist-modal'
import { usePWAInstall } from '@/hooks/use-pwainstall'
import { SettingsModal } from '../dashboard/settings-modal'
import { getBetaStatusAction } from '@/lib/actions/allowlist'


export function UserMenu({ dashboard }: { dashboard?: boolean }) {
  const user = useEditorStore((s) => s.user)
  const logout = useEditorStore((s) => s.logout)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAllowlistOpen, setIsAllowlistOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(user?.email === 'chifez1@gmail.com')
  const { canInstall, promptInstall } = usePWAInstall()

  const handleToggleDropdown = () => {
    const next = !isDropdownOpen
    setIsDropdownOpen(next)
    if (next) {
      getBetaStatusAction()
        .then((res) => setIsAdmin(res.isAdmin))
        .catch(() => {})
    }
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-semibold text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors px-4 py-1.5 rounded-full border border-(--ms-border) hover:border-(--ms-border-strong) bg-transparent cursor-pointer active:scale-[0.97]"
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
        onClick={handleToggleDropdown}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-(--ms-bg-elevated) hover:bg-(--ms-border) border border-(--ms-border) transition cursor-pointer text-left active:scale-[0.97]"
        title={user.name || user.email}
      >
        <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-inner shrink-0">
          {user.name?.[0] || user.email?.[0] || 'U'}
        </div>
        <span className="text-[11px] font-medium text-(--ms-text-primary) max-w-[120px] truncate hidden sm:inline">
          {user.name || user.email.split('@')[0]}
        </span>
        <ChevronDown size={12} className={`text-(--ms-text-muted) transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AllowlistModal isOpen={isAllowlistOpen} onClose={() => setIsAllowlistOpen(false)} />

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

              {isAdmin && (
                <button
                  onClick={() => {
                    setIsAllowlistOpen(true)
                    setIsDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-amber-400 hover:bg-amber-500/10 rounded-lg transition cursor-pointer border-none bg-transparent"
                >
                  <ShieldCheck size={14} />
                  <span>Early Access Allowlist</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsSettingsOpen(true)
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) rounded-lg transition cursor-pointer border-none bg-transparent"
              >
                <Settings size={14} />
                <span>Account Settings</span>
              </button>

              {canInstall && (
                <button
                  onClick={() => {
                    promptInstall()
                    setIsDropdownOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-(--ms-text-muted) hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition cursor-pointer border-none bg-transparent"
                >
                  <Download size={14} />
                  <span>Install App</span>
                </button>
              )}

              <button
                onClick={() => {
                  logout()
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[11px] text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer border-none bg-transparent mt-1"
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

