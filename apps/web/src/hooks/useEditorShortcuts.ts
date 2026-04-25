import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * Global keyboard shortcuts for the editor (Duplicate, Delete, etc.)
 */
export function useEditorShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (isInput) return

      const state = useEditorStore.getState()
      const { 
        selectedElementIds, duplicateElement, deleteElement,
        activeSlideIndex, setActiveSlide, projects, activeProjectId,
        groupElements, ungroupElements
      } = state

      const project = projects.find(p => p.id === activeProjectId)
      if (!project) return

      // --- Group / Ungroup Actions ---
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (e.shiftKey) {
          // Ungroup
          const slide = project.slides[activeSlideIndex]
          const firstSelected = slide?.elements.find(el => selectedElementIds.includes(el.id))
          if (firstSelected?.groupId) {
            ungroupElements(firstSelected.groupId)
          }
        } else {
          // Group
          if (selectedElementIds.length > 1) {
            groupElements(selectedElementIds)
          }
        }
      }

      // --- Element Actions ---
      if (selectedElementIds.length > 0) {
        // Duplicate (Cmd/Ctrl + D)
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault()
          // Duplicate all selected
          selectedElementIds.forEach(id => duplicateElement(id))
        }

        // Delete (Backspace / Delete)
        if (e.key === 'Backspace' || e.key === 'Delete') {
          // Delete all selected
          selectedElementIds.forEach(id => deleteElement(id))
        }
      }

      // --- Slide Navigation ---
      if (e.key === 'ArrowUp' && activeSlideIndex > 0) {
        e.preventDefault()
        setActiveSlide(activeSlideIndex - 1)
      }
      if (e.key === 'ArrowDown' && activeSlideIndex < project.slides.length - 1) {
        e.preventDefault()
        setActiveSlide(activeSlideIndex + 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
