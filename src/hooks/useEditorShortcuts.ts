import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * Global keyboard shortcuts for the editor (Duplicate, Delete, etc.)
 */
export function useEditorShortcuts() {
  const { 
    selectedElementId, duplicateElement, deleteElement,
    activeSlideIndex, setActiveSlide, projects, activeProjectId
  } = useEditorStore()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (isInput) return

      const project = projects.find(p => p.id === activeProjectId)
      if (!project) return

      // --- Element Actions ---
      if (selectedElementId) {
        // Duplicate (Cmd/Ctrl + D)
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault()
          duplicateElement(selectedElementId)
        }

        // Delete (Backspace / Delete)
        if (e.key === 'Backspace' || e.key === 'Delete') {
          // Check if it's not a text editing state (if we had one)
          deleteElement(selectedElementId)
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
  }, [
    selectedElementId, duplicateElement, deleteElement, 
    activeSlideIndex, setActiveSlide, projects, activeProjectId
  ])
}
