import { useState } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { submitSuggestionAction } from '@/lib/actions/suggestions'
import { getStorageItem, setStorageItem } from '@/lib/safe-storage'
import { toast } from '@/lib/toast'
import type { Project } from '@motionslides/shared'

export function useSuggestionSubmit(project: Project) {
  const updateProject = useEditorStore(state => state.updateProject)

  const [isEnteringName, setIsEnteringName] = useState(false)
  const [tempName, setTempName] = useState(() => getStorageItem('ms-collaborator-name') ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (nameToUse: string) => {
    if (!nameToUse.trim()) return
    setIsSubmitting(true)
    setSubmitError(null)

    setStorageItem('ms-collaborator-name', nameToUse)

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
        updateProject(project.id, { synced: true })
        setIsEnteringName(false)
        toast.success('Suggestion submitted successfully! The owner will be notified to review and merge your changes.')
      } else {
        throw new Error('Submission returned unsuccessful status')
      }
    } catch (err: unknown) {
      console.error('Failed to submit suggestion:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setSubmitError(errorMessage !== '' ? errorMessage : 'Failed to submit suggestion. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isEnteringName,
    setIsEnteringName,
    tempName,
    setTempName,
    isSubmitting,
    submitError,
    handleSubmit,
  }
}
