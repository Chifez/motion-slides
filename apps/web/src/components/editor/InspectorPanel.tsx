import { motion, AnimatePresence } from 'framer-motion'
import { UI_SPRING } from '@/lib/motionEngine'
import { useEditorStore } from '@/store/editorStore'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Panel } from '@/components/ui/core/Panel'

import { EmptyInspector } from './inspector/EmptyInspector'
import { MultiInspector } from './inspector/MultiInspector'
import { SingleInspector } from './inspector/SingleInspector'

export function InspectorPanel() {
  const selectedElementIds = useEditorStore(s => s.selectedElementIds)
  const mobileInspectorOpen = useEditorStore(s => s.mobileInspectorOpen)
  
  const element = useEditorStore(s => {
    const slide = s.activeSlide()
    return slide?.elements.find(el => el.id === selectedElementIds[0])
  })
  
  const updateElement = useEditorStore(s => s.updateElement)
  const updateElements = useEditorStore(s => s.updateElements)
  const deleteElement = useEditorStore(s => s.deleteElement)
  const setMobileInspectorOpen = useEditorStore(s => s.setMobileInspectorOpen)

  const isMobile = useIsMobile()

  const handleUpdate = (data: any) => {
    if (selectedElementIds.length === 1 && element) {
      updateElement(element.id, data)
    } else if (selectedElementIds.length > 1) {
      updateElements(selectedElementIds, data)
    }
  }

  const handleClose = () => setMobileInspectorOpen(false)

  const renderContent = () => {
    if (selectedElementIds.length === 0) {
      return <EmptyInspector />
    }
    
    if (selectedElementIds.length > 1) {
      return (
        <MultiInspector 
          selectedIds={selectedElementIds} 
          isMobile={isMobile} 
          onClose={handleClose} 
        />
      )
    }
    
    if (element) {
      return (
        <SingleInspector 
          element={element} 
          isMobile={isMobile} 
          onUpdate={handleUpdate}
          onDelete={() => deleteElement(element.id)}
          onClose={handleClose}
        />
      )
    }
    
    return null
  }

  const panelContainer = (
    <div className={`h-full flex flex-col bg-(--ms-bg-surface) ${!isMobile ? 'border-l border-(--ms-border)' : ''}`}>
      {renderContent()}
    </div>
  )

  if (isMobile) {
    return (
      <Panel.Root 
        open={selectedElementIds.length > 0 && mobileInspectorOpen} 
        onOpenChange={setMobileInspectorOpen} 
        side="bottom"
      >
        <Panel.Portal>
          <Panel.Overlay />
          <Panel.Content>
            {panelContainer}
          </Panel.Content>
        </Panel.Portal>
      </Panel.Root>
    )
  }

  return (
    <aside id="tour-inspector-panel" className="w-[280px] shrink-0 bg-(--ms-bg-surface) overflow-hidden relative z-10">
      {panelContainer}
    </aside>
  )
}
