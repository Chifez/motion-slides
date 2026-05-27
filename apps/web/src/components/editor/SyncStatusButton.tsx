import { Cloud, GitCommit, Send, RefreshCw } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useSuggestionSubmit } from '@/hooks/useSuggestionSubmit'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import type { Project } from '@motionslides/shared'
import { SuggestionsDropdown } from './toolbar/SuggestionsDropdown'

interface Props {
  isAuthenticated: boolean
  isReadOnly: boolean
}

export function SyncStatusButton({ isAuthenticated, isReadOnly }: Props) {
  const project = useEditorStore(state => state.activeProject())
  const userId = useEditorStore(state => state.user?.id ?? null)
  const localAuthorId = useEditorStore(state => state.localAuthorId)
  const isOnline = useOnlineStatus()

  if (!isOnline || !project) return null

  const isOwner = !!userId && project.ownerId === userId
  const isLocalAuthor = !!localAuthorId && project.localAuthorId === localAuthorId
  const isCollaborator = !isOwner && !isLocalAuthor && project.visibility === 'collaborative'

  if (isReadOnly && !isCollaborator) return null

  if (!isCollaborator) {
    const showSave = !project.synced && isAuthenticated
    return (
      <div className="flex items-center gap-2">
        <SuggestionsDropdown />
        {showSave && <OwnerSaveButton />}
      </div>
    )
  }

  if (project.synced) return null

  return <CollaboratorSuggestionButton project={project} />
}

function OwnerSaveButton() {
  const isSyncing = useEditorStore(state => state.isSyncing)
  const syncProjects = useEditorStore(state => state.syncProjects)

  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        syncProjects()
      }}
      disabled={isSyncing}
      className="flex items-center gap-1.5 text-[10px] text-orange-400 hover:text-orange-300 bg-orange-500/10 backdrop-blur-sm border border-orange-500/30 rounded-md px-2 py-1 cursor-pointer transition-colors disabled:opacity-50 whitespace-nowrap"
      title="Unsaved changes - click to sync to cloud"
    >
      <Cloud size={11} className={isSyncing ? 'animate-pulse' : ''} />
      <span>{isSyncing ? 'Saving...' : 'Save'}</span>
    </button>
  )
}

interface CollaboratorProps {
  project: Project
}

function CollaboratorSuggestionButton({ project }: CollaboratorProps) {
  const {
    isEnteringName,
    setIsEnteringName,
    tempName,
    setTempName,
    isSubmitting,
    submitError,
    handleSubmit,
  } = useSuggestionSubmit(project)

  if (isSubmitting) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-blue-400 bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-md px-2 py-1 select-none">
        <RefreshCw size={11} className="animate-spin" />
        <span>Submitting suggestion...</span>
      </div>
    )
  }

  if (isEnteringName) {
    return (
      <div className="flex flex-col gap-1">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit(tempName)
          }}
          onClick={(event) => event.stopPropagation()}
          className="flex items-center gap-1 bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-md p-0.5"
        >
          <input
            type="text"
            placeholder="Your name..."
            value={tempName}
            onChange={(event) => setTempName(event.target.value)}
            className="bg-transparent border-none text-[10px] text-blue-400 placeholder-blue-400/50 w-24 focus:outline-none px-1 py-0.5"
            autoFocus
            required
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded p-0.5 border-none cursor-pointer flex items-center justify-center disabled:opacity-50"
            title="Submit"
          >
            <Send size={10} />
          </button>
        </form>
        {submitError && (
          <span className="text-[9px] text-red-400 max-w-[130px] leading-tight select-none">
            {submitError}
          </span>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={(event) => {
        event.stopPropagation()
        setIsEnteringName(true)
      }}
      className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-md px-2 py-1 cursor-pointer transition-colors whitespace-nowrap"
      title="Submit changes as a suggestion for the owner"
    >
      <GitCommit size={11} />
      <span>Submit Suggestion</span>
    </button>
  )
}
