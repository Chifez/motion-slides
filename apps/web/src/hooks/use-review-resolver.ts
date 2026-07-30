import { useState } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { resolveSuggestionAction, listSuggestionsAction } from '@/lib/actions/suggestions'
import type { ProjectSuggestion } from '@/lib/actions/suggestions'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export function useReviewResolver() {
  const queryClient = useQueryClient()
  const activeProjectId = useEditorStore(state => state.activeProjectId)
  const project = useEditorStore(state => state.projects.find(p => p.id === activeProjectId))
  
  const { data: suggestions = [] } = useQuery<ProjectSuggestion[]>({
    queryKey: ['suggestions', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return []
      const res = await listSuggestionsAction({ data: { projectId: activeProjectId } })
      return res as ProjectSuggestion[]
    },
    enabled: !!activeProjectId
  })

  const reviewingSuggestionId = useEditorStore(state => state.reviewingSuggestionId)
  const reviewMode = useEditorStore(state => state.reviewMode)
  
  const toggleReviewMode = useEditorStore(state => state.toggleReviewMode)
  const cancelReview = useEditorStore(state => state.cancelReview)
  const finishReview = useEditorStore(state => state.finishReview)
  const updateProject = useEditorStore(state => state.updateProject)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!reviewingSuggestionId || !project) {
    return {
      project: null,
      suggestion: null,
      reviewMode,
      isPending: false,
      error: null,
      isStale: false,
      toggleReviewMode,
      cancelReview,
      handleResolve: async () => {},
    }
  }

  const suggestion = suggestions.find(s => s.id === reviewingSuggestionId) ?? null
  const isStale = suggestion ? project.updatedAt > suggestion.parentUpdatedAt : false

  const handleResolve = async (status: 'merged' | 'rejected') => {
    setIsPending(true)
    setError(null)
    try {
      if (status === 'merged') {
        const response = await resolveSuggestionAction({
          data: {
            suggestionId: reviewingSuggestionId,
            status: 'merged',
            slides: project.slides,
            transitions: project.transitions ?? [],
            prototypeLayout: project.prototypeLayout ?? {},
          }
        })
        if (response.success) {
          updateProject(project.id, {
            slides: project.slides,
            transitions: project.transitions ?? [],
            prototypeLayout: project.prototypeLayout ?? {},
            updatedAt: response.updatedAt,
            synced: true,
          })
          finishReview()
          queryClient.invalidateQueries({ queryKey: ['suggestions', project.id] })
        }
      } else {
        const response = await resolveSuggestionAction({
          data: {
            suggestionId: reviewingSuggestionId,
            status: 'rejected',
          }
        })
        if (response.success) {
          cancelReview()
          queryClient.invalidateQueries({ queryKey: ['suggestions', project.id] })
        }
      }
    } catch (err: unknown) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage !== '' ? errorMessage : `Failed to ${status} suggestion`)
    } finally {
      setIsPending(false)
    }
  }

  return {
    project,
    suggestion,
    reviewMode,
    isPending,
    error,
    isStale,
    toggleReviewMode,
    cancelReview,
    handleResolve,
  }
}
