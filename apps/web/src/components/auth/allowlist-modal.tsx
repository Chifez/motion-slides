import { useState, useTransition, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, Plus, Trash2, Loader2, Mail, Users, CheckCircle, RefreshCw } from 'lucide-react'
import {
  listAllowedEmailsAction,
  addAllowedEmailAction,
  removeAllowedEmailAction,
} from '@/lib/actions/allowlist'

interface AllowlistModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AllowedItem {
  id: string
  email: string
  notes?: string | null
  addedBy?: string | null
  createdAt: string
}

export function AllowlistModal({ isOpen, onClose }: AllowlistModalProps) {
  const [items, setItems] = useState<AllowedItem[]>([])
  const [isPrivateBeta, setIsPrivateBeta] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const loadList = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await listAllowedEmailsAction()
        setItems(res.items)
        setIsPrivateBeta(res.isPrivateBeta)
        setHasLoaded(true)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load allowlist')
      }
    })
  }

  // Load allowlist whenever the modal opens
  useEffect(() => {
    if (!isOpen) return
    let ignore = false

    setError(null)
    startTransition(async () => {
      try {
        const res = await listAllowedEmailsAction()
        if (!ignore) {
          setItems(res.items)
          setIsPrivateBeta(res.isPrivateBeta)
          setHasLoaded(true)
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load allowlist')
        }
      }
    })

    return () => {
      ignore = true
    }
  }, [isOpen])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      try {
        const trimmed = emailInput.trim().toLowerCase()
        const res = await addAllowedEmailAction({
          data: {
            email: trimmed,
            notes: notesInput.trim() || undefined,
          },
        })

        if (res.success) {
          setEmailInput('')
          setNotesInput('')
          setSuccessMsg(`Added ${trimmed} to beta access!`)
          // Refresh list
          const updated = await listAllowedEmailsAction()
          setItems(updated.items)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to add email')
      }
    })
  }

  const handleRemove = (id: string, email: string) => {
    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      try {
        await removeAllowedEmailAction({ data: { id } })
        setItems((prev) => prev.filter((item) => item.id !== id))
        setSuccessMsg(`Removed ${email} from allowlist`)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to remove email')
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-(--ms-bg-surface) border border-(--ms-border-strong) rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-(--ms-border) flex items-center justify-between bg-(--ms-bg-elevated)/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-(--ms-text-primary)">Early Access Allowlist</h2>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    isPrivateBeta
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isPrivateBeta ? 'Private Beta Active' : 'Public Access (Open)'}
                </span>
              </div>
              <p className="text-[11px] text-(--ms-text-muted)">
                Manage allowed emails and domain patterns without redeploying.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-(--ms-text-muted) hover:text-(--ms-text-primary) transition border-none bg-transparent cursor-pointer rounded-md"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add form */}
          <form onSubmit={handleAdd} className="space-y-3 bg-(--ms-bg-elevated)/60 p-4 rounded-xl border border-(--ms-border)">
            <p className="text-xs font-medium text-(--ms-text-primary) flex items-center gap-1.5">
              <Plus size={14} className="text-blue-400" />
              <span>Invite New User or Domain</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ms-text-muted)" />
                <input
                  type="text"
                  placeholder="e.g. friend@gmail.com or @company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-(--ms-bg-surface) border border-(--ms-border) rounded-lg text-(--ms-text-primary) placeholder:text-(--ms-text-muted) focus:outline-none focus:border-blue-500 transition"
                  disabled={isPending}
                />
              </div>
              <input
                type="text"
                placeholder="Optional notes (e.g. Twitter tester)"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-(--ms-bg-surface) border border-(--ms-border) rounded-lg text-(--ms-text-primary) placeholder:text-(--ms-text-muted) focus:outline-none focus:border-blue-500 transition"
                disabled={isPending}
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-(--ms-text-muted)">
                Tip: Use <code className="text-blue-300">@domain.com</code> to allow everyone at an organization.
              </span>
              <button
                type="submit"
                disabled={isPending || !emailInput.trim()}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer border-none"
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                <span>Add to Beta</span>
              </button>
            </div>
          </form>

          {/* Feedback messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <X size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Allowed List Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-(--ms-text-primary) flex items-center gap-2">
                <Users size={14} className="text-(--ms-text-muted)" />
                <span>Invited Testers ({items.length})</span>
              </p>
              <button
                type="button"
                onClick={loadList}
                disabled={isPending}
                className="text-[11px] text-(--ms-text-muted) hover:text-(--ms-text-primary) flex items-center gap-1 border-none bg-transparent cursor-pointer transition"
              >
                <RefreshCw size={11} className={isPending ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-(--ms-border) rounded-xl">
                <p className="text-xs text-(--ms-text-muted)">No custom emails in database yet.</p>
                <p className="text-[10px] text-(--ms-text-muted) mt-1">
                  (Superusers in <code className="text-blue-300">ADMIN_EMAILS</code> always have access)
                </p>
              </div>
            ) : (
              <div className="border border-(--ms-border) rounded-xl overflow-hidden divide-y divide-(--ms-border)">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-(--ms-bg-surface) hover:bg-(--ms-bg-elevated)/40 transition"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-(--ms-text-primary)">
                          {item.email}
                        </span>
                        {item.email.startsWith('@') && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                            domain wildcard
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-(--ms-text-muted) truncate">{item.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id, item.email)}
                      disabled={isPending}
                      className="p-1.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-md transition border-none bg-transparent cursor-pointer shrink-0"
                      title="Remove from allowlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-(--ms-border) bg-(--ms-bg-elevated)/40 flex items-center justify-between text-[11px] text-(--ms-text-muted)">
          <span>Changes take effect immediately across all edge regions.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-(--ms-bg-elevated) hover:bg-(--ms-border) text-(--ms-text-primary) rounded-lg border border-(--ms-border) transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
