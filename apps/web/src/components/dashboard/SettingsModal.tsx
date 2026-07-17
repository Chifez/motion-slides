import { useState, useEffect } from 'react'
import { X, Key, Database, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateAPIKeysAction, getUserQuotaAction } from '@/lib/actions/ai-studio'
import { useEditorStore } from '@/store/editorStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'api-keys' | 'quota'>('api-keys')
  const [openAIKey, setOpenAIKey] = useState('')
  const [elevenLabsKey, setElevenLabsKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [quota, setQuota] = useState<{ tokenQuota: number; tokenBalance: number } | null>(null)
  
  const user = useEditorStore(s => s.user)

  useEffect(() => {
    if (isOpen && activeTab === 'quota') {
      getUserQuotaAction().then(res => setQuota(res)).catch(console.error)
    }
  }, [isOpen, activeTab])

  const handleSaveKeys = async () => {
    setIsSaving(true)
    try {
      await updateAPIKeysAction({ openAIKey, elevenLabsKey })
      // In a real app we'd show a success toast here
    } catch (e) {
      alert('Failed to save API keys')
    }
    setIsSaving(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-(--ms-bg-surface) border border-(--ms-border-strong) rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-(--ms-border)">
              <h2 className="text-lg font-semibold text-(--ms-text-primary)">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-bg-elevated) rounded-lg transition-colors bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-(--ms-border) px-2 bg-black/20">
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors border-none bg-transparent cursor-pointer ${
                  activeTab === 'api-keys' ? 'border-blue-500 text-blue-400' : 'border-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
              >
                <Key size={16} /> API Keys
              </button>
              <button
                onClick={() => setActiveTab('quota')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors border-none bg-transparent cursor-pointer ${
                  activeTab === 'quota' ? 'border-blue-500 text-blue-400' : 'border-transparent text-(--ms-text-muted) hover:text-(--ms-text-primary)'
                }`}
              >
                <Database size={16} /> Monthly Quota
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'api-keys' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-(--ms-text-primary) mb-1">Bring Your Own Key (BYOK)</h3>
                    <p className="text-xs text-(--ms-text-muted) mb-4">
                      Add your own API keys to bypass monthly quota limits. Keys are encrypted at rest using AES-256.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-(--ms-text-secondary)">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={openAIKey}
                        onChange={e => setOpenAIKey(e.target.value)}
                        className="w-full bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg px-3 py-2 text-sm text-(--ms-text-primary) focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-(--ms-text-secondary)">ElevenLabs API Key</label>
                      <input
                        type="password"
                        placeholder="sk_..."
                        value={elevenLabsKey}
                        onChange={e => setElevenLabsKey(e.target.value)}
                        className="w-full bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg px-3 py-2 text-sm text-(--ms-text-primary) focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveKeys}
                    disabled={isSaving}
                    className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors border-none cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : 'Save API Keys'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-(--ms-text-primary) mb-1">Current Usage</h3>
                    <p className="text-xs text-(--ms-text-muted)">
                      Your monthly token allocation for generative features.
                    </p>
                  </div>
                  
                  {quota ? (
                    <div className="p-4 bg-(--ms-bg-elevated) rounded-xl border border-(--ms-border)">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-(--ms-text-secondary)">Tokens Remaining</span>
                        <span className="text-sm font-bold text-(--ms-text-primary)">
                          {quota.tokenBalance.toLocaleString()} / {quota.tokenQuota.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${(quota.tokenBalance / quota.tokenQuota) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-(--ms-text-muted) mt-3 text-center">
                        Resets on the 1st of every month.
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-center p-8">
                      <RefreshCw size={24} className="animate-spin text-(--ms-text-muted)" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
