import { useState } from 'react'
import { Cloud, GitBranch, Send, RefreshCw } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { submitSuggestionAction } from '@/lib/actions/suggestions'

interface Props {
  isAuthenticated: boolean
  isReadOnly: boolean
}

export function SyncStatusButton({ isAuthenticated, isReadOnly }: Props) {
  const project = useEditorStore(state => state.activeProject())
  const userId = useEditorStore(state => state.user?.id ?? null)
  const localAuthorId = useEditorStore(state => state.localAuthorId)
  const isSyncing = useEditorStore(state => state.isSyncing)
  const syncProjects = useEditorStore(state => state.syncProjects)
  const updateProject = useEditorStore(state => state.updateProject)

  const [isEnteringName, setIsEnteringName] = useState(false)
  const [tempName, setTempName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ms-collaborator-name') ?? ''
    }
    return ''
  })
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!project || project.synced) return null

  // Determine if owner/creator or guest collaborator
  const isOwner = !!userId && project.ownerId === userId
  const isLocalAuthor = !!localAuthorId && project.localAuthorId === localAuthorId
  const isCollaborator = !isOwner && !isLocalAuthor && project.visibility === 'collaborative'

  // If read-only and NOT a collaborator, they shouldn't edit or sync anyway
  if (isReadOnly && !isCollaborator) return null

  // If not collaborator, standard save flow for owner/local-creator
  if (!isCollaborator) {
    if (!isAuthenticated && !isLocalAuthor) return null
    return (
      <button
        onClick={(event) => {
          event.stopPropagation()
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
  }

  // Collaborator suggestion flow
  const handleSubmitSuggestion = async (nameToUse: string) => {
    if (!nameToUse.trim()) return
    setIsSubmittingSuggestion(true)
    setSubmitError(null)

    if (typeof window !== 'undefined') {
      localStorage.setItem('ms-collaborator-name', nameToUse)
    }

    try {
      const result = await submitSuggestionAction({
        data: {
          projectId: project.id,
          shareKey: project.shareKey,
          authorName: nameToUse,
          slides: project.slides,
          transitions: project.transitions ?? [],
          prototypeLayout: project.prototypeLayout ?? {},
          parentUpdatedAt: project.parentUpdatedAt ?? project.updatedAt,
        }
      })

      if (result.success) {
        // Mark local project as synced so the button goes away
        updateProject(project.id, { synced: true })
        setIsEnteringName(false)
        alert('Suggestion submitted successfully! The owner will be notified to review and merge your changes.')
      } else {
        throw new Error('Submission returned unsuccessful status')
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setSubmitError(errorMessage !== '' ? errorMessage : 'Failed to submit suggestion. Please try again.')
    } finally {
      setIsSubmittingSuggestion(false)
    }
  }

  if (isSubmittingSuggestion) {
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
            handleSubmitSuggestion(tempName)
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
            disabled={isSubmittingSuggestion}
          />
          <button
            type="submit"
            disabled={isSubmittingSuggestion}
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
      className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-md px-2 py-1 cursor-pointer transition-colors"
      title="Submit changes as a suggestion for the owner"
    >
      <GitBranch size={11} />
      <span>Submit Suggestion</span>
    </button>
  )
}
