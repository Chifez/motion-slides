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
  const updateProject = useEditorStore(s => s.updateProject)
  const isSyncing = useEditorStore(s => s.isSyncing)
  const syncProjects = useEditorStore(s => s.syncProjects)
  
  useClickOutside(ref, () => setIsOpen(false))

  const [baseUrl, setBaseUrl] = useState('')
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  type ShareState =
    | { status: 'unsynced' }
    | { status: 'syncing' }
    | { status: 'private' }
    | { status: 'link-shared' }
    | { status: 'collaborative' }

  const shareState: ShareState = !project.synced 
    ? { status: 'unsynced' } 
    : isSyncing 
      ? { status: 'syncing' } 
      : { status: project.visibility as any }

  const isShared = project.visibility !== 'private'
  const isCollaborative = project.visibility === 'collaborative'

  const copyToClipboard = async (type: 'edit' | 'view') => {
    if (shareState.status === 'unsynced') return
    if (!baseUrl) return

    // Always include the shareKey for any shared link (view or edit)
    const url = `${baseUrl}/p/${project.id}?mode=${type}&key=${project.shareKey}`

    try {
      await navigator.clipboard.writeText(url)
      setCopiedType(type)
      
      // Soft warning if syncing
      if (shareState.status === 'syncing') {
        // We could use a toast here, but for now we'll just show the success state
      }

      setTimeout(() => setCopiedType(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const toggleSharing = () => {
    const nextVisibility = isShared ? 'private' : 'link-shared'
    const updates: Partial<Project> = { 
      visibility: nextVisibility,
      updatedAt: Date.now()
    }
    
    // Always rotate key when enabling sharing
    if (!isShared) {
      updates.shareKey = crypto.randomUUID()
    }
    
    updateProject(project.id, updates)
    // Force immediate sync so the guest doesn't get 'Access Denied'
    syncProjects()
  }

  const toggleCollaborative = () => {
    const nextVisibility = isCollaborative ? 'link-shared' : 'collaborative'
    updateProjectVisibility(project.id, nextVisibility)
    syncProjects()
  }

  const handleRotateKey = async () => {
    if (isRotating) return
    setIsRotating(true)
    try {
      const { rotateShareKeyAction } = await import('@/lib/actions/project')
      const result = await rotateShareKeyAction({ data: { projectId: project.id } })
      if (result.success) {
        updateProject(project.id, { shareKey: result.newKey })
        syncProjects()
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
        <span className="hidden md:inline">
          {shareState.status === 'unsynced' ? 'Syncing...' : 'Share'}
        </span>
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
                  {shareState.status === 'unsynced' 
                    ? 'Wait for sync to share' 
                    : isShared ? 'Anyone with the link' : 'Only you can access'}
                </div>
              </div>
            </div>
            
            <button
              onClick={toggleSharing}
              disabled={shareState.status === 'unsynced'}
              className={`relative w-9 h-5 rounded-full transition-colors border-none cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed ${isShared ? 'bg-blue-600' : 'bg-neutral-800'}`}
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
                  disabled={!isShared || isRotating || shareState.status === 'syncing'}
                  className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-0"
                >
                  {isRotating ? 'Rotating...' : 'Revoke & Rotate Link'}
                </button>
              </div>
              <button
                onClick={() => copyToClipboard('view')}
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
                onClick={() => copyToClipboard('edit')}
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
              {shareState.status === 'unsynced'
                ? "This project hasn't been saved to the cloud yet. Please wait a moment before sharing."
                : shareState.status === 'syncing'
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
