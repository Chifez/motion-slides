import { memo } from 'react'
import { Cloud } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

interface Props {
  isAuthenticated: boolean
  isReadOnly: boolean
}

export const SyncStatusButton = memo(function SyncStatusButton({ isAuthenticated, isReadOnly }: Props) {
  const project = useEditorStore(s => s.activeProject())
  const isSyncing = useEditorStore(s => s.isSyncing)
  const syncProjects = useEditorStore(s => s.syncProjects)

  if (isReadOnly || !isAuthenticated || !project || project.synced) return null

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        syncProjects()
      }}
      disabled={isSyncing}
      className="flex items-center gap-1.5 text-[10px] text-orange-400 hover:text-orange-300 bg-orange-500/10 backdrop-blur-sm border border-orange-500/30 rounded-md px-2 py-1 cursor-pointer transition-colors disabled:opacity-50"
      title="Unsaved changes - click to sync to cloud"
    >
      <Cloud size={11} className={isSyncing ? 'animate-pulse' : ''} />
      <span>{isSyncing ? 'Saving...' : 'Save'}</span>
    </button>
  )
})
