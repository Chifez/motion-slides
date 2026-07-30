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
        groupElements, ungroupElements, updateElementsBatch
      } = state

      const project = projects.find(p => p.id === activeProjectId)
      if (!project) return

      // Arrow key element nudging (Figma feel)
      if (selectedElementIds.length > 0) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
        if (arrowKeys.includes(e.key)) {
          e.preventDefault()
          const nudgeAmount = e.shiftKey ? 10 : 1
          let dx = 0
          let dy = 0
          if (e.key === 'ArrowUp') dy = -nudgeAmount
          if (e.key === 'ArrowDown') dy = nudgeAmount
          if (e.key === 'ArrowLeft') dx = -nudgeAmount
          if (e.key === 'ArrowRight') dx = nudgeAmount

          const slide = project.slides[activeSlideIndex]
          if (slide) {
            const updates = selectedElementIds.map(id => {
              const el = slide.elements.find(item => item.id === id)
              if (!el) return null
              return {
                id,
                changes: {
                  position: {
                    x: el.position.x + dx,
                    y: el.position.y + dy
                  }
                }
              }
            }).filter(Boolean) as { id: string; changes: any }[]

            if (updates.length > 0) {
              updateElementsBatch(updates, { silent: false })
            }
          }
          return
        }
      } else {
        // Slide navigation only when selection is empty
        if (e.key === 'ArrowUp' && activeSlideIndex > 0) {
          e.preventDefault()
          setActiveSlide(activeSlideIndex - 1)
        }
        if (e.key === 'ArrowDown' && activeSlideIndex < project.slides.length - 1) {
          e.preventDefault()
          setActiveSlide(activeSlideIndex + 1)
        }
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
