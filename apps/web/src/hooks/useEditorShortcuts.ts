import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { usePermissions } from '@/context/PermissionContext'

/**
 * Global keyboard shortcuts for the editor (Duplicate, Delete, etc.)
 */
export function useEditorShortcuts() {
  const { isReadOnly } = usePermissions()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = 
        target instanceof HTMLInputElement || 
        target instanceof HTMLTextAreaElement || 
        target.isContentEditable
        
      if (isInput) return

      const state = useEditorStore.getState()
      const { 
        selectedElementIds, duplicateElement, deleteElement,
        activeSlideIndex, setActiveSlide, projects, activeProjectId,
        groupElements, ungroupElements
      } = state

      const project = projects.find(p => p.id === activeProjectId)
      if (!project) return


      if (e.key === 'ArrowUp' && activeSlideIndex > 0) {
        e.preventDefault()
        setActiveSlide(activeSlideIndex - 1)
      }
      if (e.key === 'ArrowDown' && activeSlideIndex < project.slides.length - 1) {
        e.preventDefault()
        setActiveSlide(activeSlideIndex + 1)
      }


      if (isReadOnly) return


      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (e.shiftKey) {

          const slide = project.slides[activeSlideIndex]
          const firstSelected = slide?.elements.find(el => selectedElementIds.includes(el.id))
          if (firstSelected?.groupId) {
            ungroupElements(firstSelected.groupId)
          }
        } else {

          if (selectedElementIds.length > 1) {
            groupElements(selectedElementIds)
          }
        }
      }


      if (selectedElementIds.length > 0) {

        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault()

          selectedElementIds.forEach(id => duplicateElement(id))
        }


        if (e.key === 'Backspace' || e.key === 'Delete') {

          selectedElementIds.forEach(id => deleteElement(id))
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isReadOnly])
}
