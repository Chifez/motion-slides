import { useState, useRef } from 'react'
import { Share2, Copy, Lock, Check, Link as LinkIcon, Eye, Unlock } from 'lucide-react'
import type { Project } from '@motionslides/shared'
import { useClickOutside } from '@/hooks/useClickOutside'
import { motion } from 'framer-motion'
import { useShareMenu } from '@/hooks/useShareMenu'

interface Props {
  project: Project
}

export function ShareMenu({ project }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<'edit' | 'view' | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  
  const {
    shareState,
    copyLink,
    toggleSharing,
    toggleCollaborative,
    rotateKey
  } = useShareMenu(project)
  
  useClickOutside(ref, () => setIsOpen(false))

  const handleCopy = async (type: 'edit' | 'view') => {
    await copyLink(type)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const isShared = project.visibility !== 'private'
  const isCollaborative = project.visibility === 'collaborative'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-(--ms-text-secondary) hover:text-(--ms-text-primary) text-xs font-medium px-3 py-1.5 rounded-md transition-all border border-(--ms-border) cursor-pointer"
        title="Share Project"
      >
        <Share2 size={13} />
        <span className="hidden md:inline">Share</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                {isShared ? <Unlock size={16} /> : <Lock size={16} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-(--ms-text-primary)">Link Sharing</div>
                <div className="text-[10px] text-(--ms-text-muted)">
                  {isShared ? 'Anyone with the link' : 'Only you can access'}
                </div>
              </div>
            </div>
            
            <button
              onClick={toggleSharing}
              className={`relative w-9 h-5 rounded-full transition-colors border-none cursor-pointer outline-none ${isShared ? 'bg-blue-600' : 'bg-neutral-800'}`}
            >
              <motion.div
                animate={{ x: isShared ? 18 : 2 }}
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          <div className="space-y-4">
            {/* View Link */}
            <div className={`space-y-1.5 transition-opacity duration-300 ${isShared ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-(--ms-text-secondary) flex items-center gap-1">
                  <Eye size={10} /> View Only
                </span>
                <button 
                  onClick={rotateKey}
                  disabled={!isShared || shareState.status === 'syncing'}
                  className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-0"
                >
                  {shareState.status === 'syncing' ? 'Syncing...' : 'Revoke & Rotate Link'}
                </button>
              </div>
              <button
                onClick={() => handleCopy('view')}
                disabled={!isShared}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) hover:border-blue-500/50 transition-all cursor-pointer text-left group disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <LinkIcon size={12} className="text-blue-400 shrink-0" />
                  <span className="text-xs text-(--ms-text-muted) truncate">/p/{project.id.slice(0, 8)}...</span>
                </div>
                {copiedType === 'view' ? (
                  <Check size={12} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={12} className="text-(--ms-text-muted) group-hover:text-blue-400 transition-colors shrink-0" />
                )}
              </button>
            </div>

            {/* Edit Link */}
            <div className={`space-y-1.5 transition-opacity duration-300 ${isCollaborative ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-(--ms-text-secondary) flex items-center gap-1">
                  <Unlock size={10} className={isCollaborative ? 'text-orange-400' : ''} /> Collaborative Edit
                </span>
                <button
                  onClick={toggleCollaborative}
                  disabled={!isShared}
                  className={`relative w-7 h-4 rounded-full transition-colors border-none cursor-pointer outline-none disabled:cursor-not-allowed ${isCollaborative ? 'bg-orange-500' : 'bg-neutral-800'}`}
                >
                  <motion.div
                    animate={{ x: isCollaborative ? 14 : 2 }}
                    initial={false}
                    className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
              <button
                onClick={() => handleCopy('edit')}
                disabled={!isCollaborative}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) hover:border-blue-500/50 transition-all cursor-pointer text-left group disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <LinkIcon size={12} className="text-orange-400 shrink-0" />
                  <span className="text-xs text-(--ms-text-muted) truncate">/p/{project.id.slice(0, 8)}...</span>
                </div>
                {copiedType === 'edit' ? (
                  <Check size={12} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={12} className="text-(--ms-text-muted) group-hover:text-blue-400 transition-colors shrink-0" />
                )}
              </button>
              <div className="text-[9px] text-(--ms-text-muted) pl-1">
                {isCollaborative 
                  ? "⚠️ Anyone with the link can edit the original."
                  : isShared ? "Enable collaborative mode to allow others to edit." : "Sharing must be enabled to use this."}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-(--ms-border)">
            <div className="text-[10px] text-(--ms-text-muted) leading-relaxed">
              {shareState.status === 'syncing'
                  ? "Syncing changes... Guests might see a slightly older version for a few seconds."
                  : isShared 
                    ? "Link sharing is active. You can revoke access anytime by rotating the link."
                    : "Enable link sharing to allow others to view this presentation."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
