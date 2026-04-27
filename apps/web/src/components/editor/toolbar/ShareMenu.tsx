import { useState, useRef, useEffect } from 'react'
import { Share2, Copy, Lock, Check, Link as LinkIcon, Globe, Eye, Unlock } from 'lucide-react'
import type { Project } from '@motionslides/shared'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useEditorStore } from '@/store/editorStore'
import { motion } from 'framer-motion'

interface Props {
  project: Project
}

export function ShareMenu({ project }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedType, setCopiedType] = useState<'edit' | 'view' | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const updateProjectVisibility = useEditorStore(s => s.updateProjectVisibility)
  
  useClickOutside(ref, () => setIsOpen(false))

  const isShared = project.visibility !== 'private'
  const isCollaborative = project.visibility === 'collaborative'
  const [baseUrl, setBaseUrl] = useState('')
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const copyToClipboard = async (type: 'edit' | 'view') => {
    if (!isShared && type === 'view') return
    if (!baseUrl) return

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

  const toggleSharing = () => {
    const nextVisibility = isShared ? 'private' : 'link-shared'
    updateProjectVisibility(project.id, nextVisibility)
  }

  const toggleCollaborative = () => {
    const nextVisibility = isCollaborative ? 'link-shared' : 'collaborative'
    updateProjectVisibility(project.id, nextVisibility)
  }

  const handleRotateKey = async () => {
    if (isRotating) return
    setIsRotating(true)
    try {
      const { rotateShareKeyAction } = await import('@/lib/actions/project')
      const result = await rotateShareKeyAction({ data: { projectId: project.id } })
      if (result.success) {
        // Local update to store to avoid waiting for sync
        useEditorStore.getState().updateProject(project.id, { shareKey: result.newKey })
      }
    } catch (err) {
      console.error('Rotation failed:', err)
    } finally {
      setIsRotating(false)
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl z-[100] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                {isShared ? <Unlock size={16} /> : <Lock size={16} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-(--ms-text-primary)">Link Sharing</div>
                <div className="text-[10px] text-(--ms-text-muted)">{isShared ? 'Anyone with the link' : 'Only you can access'}</div>
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
                  onClick={handleRotateKey}
                  disabled={!isShared || isRotating}
                  className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-0"
                >
                  {isRotating ? 'Rotating...' : 'Revoke & Rotate Link'}
                </button>
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
            <div className={`space-y-1.5 transition-opacity duration-300 ${isShared ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-(--ms-text-secondary) flex items-center gap-1">
                  <Unlock size={10} className={isCollaborative ? 'text-orange-400' : ''} /> Collaborative Edit
                </span>
                <button
                  onClick={toggleCollaborative}
                  className={`relative w-7 h-4 rounded-full transition-colors border-none cursor-pointer outline-none ${isCollaborative ? 'bg-orange-500' : 'bg-neutral-800'}`}
                >
                  <motion.div
                    animate={{ x: isCollaborative ? 14 : 2 }}
                    initial={false}
                    className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
              <button
                onClick={() => copyToClipboard('edit')}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-(--ms-bg-base) border border-(--ms-border) hover:border-blue-500/50 transition-all cursor-pointer text-left group"
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
                  : "Only you can edit. Link sharing is view-only."}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-(--ms-border)">
            <div className="text-[10px] text-(--ms-text-muted) leading-relaxed">
              {isShared 
                ? "Link sharing is active. You can revoke access anytime by rotating the link."
                : "Enable link sharing to allow others to view this presentation."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
