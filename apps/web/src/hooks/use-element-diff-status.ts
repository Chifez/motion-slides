import { useEditorStore } from '@/store/editor-store'
import type { SceneElement } from '@motionslides/shared'
import { computeElementDiffStatus } from '@/lib/element-diff'

export function useElementDiffStatus(elementId: string, currentElement: SceneElement | undefined): 'added' | 'modified' | null {
  const reviewingSuggestionId = useEditorStore(state => state.reviewingSuggestionId)
  const reviewMode = useEditorStore(state => state.reviewMode)
  const activeSlideIndex = useEditorStore(state => state.activeSlideIndex)
  const originalProjectBackup = useEditorStore(state => state.originalProjectBackup)

  if (!currentElement || !reviewingSuggestionId || reviewMode !== 'suggested' || !originalProjectBackup) {
    return null
  }

  const originalSlide = originalProjectBackup.slides[activeSlideIndex]
  const originalElement = originalSlide?.elements.find((el: SceneElement) => el.id === elementId)

  return computeElementDiffStatus(currentElement, originalElement)
}
