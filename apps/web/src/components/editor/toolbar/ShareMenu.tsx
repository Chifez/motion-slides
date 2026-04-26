import { useState, useRef } from 'react'
import { Share2, Copy, Lock, Check, Link as LinkIcon, Globe } from 'lucide-react'
import type { Project } from '@motionslides/shared'
import { useClickOutside } from '@/hooks/useClickOutside'

interface Props {
  project: Project
}

export function ShareMenu({ project }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<'edit' | 'view' | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  
  useClickOutside(ref, () => setIsOpen(false))

  const baseUrl = window.location.origin

  const copyToClipboard = async (type: 'edit' | 'view') => {
    let url = `${baseUrl}/p/${project.id}?mode=${type}`
    
    if (type === 'view') {
      url += `&key=${project.shareKey}`
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

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
        <div className="absolute right-0 top-full mt-2 w-72 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
              <Share2 size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-(--ms-text-primary)">Share Project</div>
              <div className="text-[10px] text-(--ms-text-muted)">Manage access and sharing</div>
            </div>
          </div>

          <div className="space-y-3">
            {/* View Link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-(--ms-text-secondary) flex items-center gap-1">
                  <Lock size={10} /> View Only
                </span>
                <span className="text-[9px] text-(--ms-text-muted)">Requires Key</span>
              </div>
              <button
                onClick={() => copyToClipboard('view')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) hover:border-blue-500/50 transition-all cursor-pointer text-left group"
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
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-(--ms-text-secondary) flex items-center gap-1">
                  <Globe size={10} /> Collaborative Edit
                </span>
                <span className="text-[9px] text-orange-400/80">Owner Link</span>
              </div>
              <button
                onClick={() => copyToClipboard('edit')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) hover:border-blue-500/50 transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <LinkIcon size={12} className="text-purple-400 shrink-0" />
                  <span className="text-xs text-(--ms-text-muted) truncate">/p/{project.id.slice(0, 8)}...</span>
                </div>
                {copiedType === 'edit' ? (
                  <Check size={12} className="text-emerald-400 shrink-0" />
                ) : (
                  <Copy size={12} className="text-(--ms-text-muted) group-hover:text-blue-400 transition-colors shrink-0" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-(--ms-border)">
            <div className="text-[10px] text-(--ms-text-muted) leading-relaxed">
              Anyone with the <span className="text-blue-400">View</span> link can watch your presentation. 
              Only trusted collaborators should have the <span className="text-purple-400">Edit</span> link.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
