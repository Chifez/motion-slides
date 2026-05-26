import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorStore } from '@/store/editorStore'
import { useIsMobile } from '@/hooks/useMediaQuery'

import { EmptyInspector } from './inspector/EmptyInspector'
import { MultiInspector } from './inspector/MultiInspector'
import { SingleInspector } from './inspector/SingleInspector'

export const InspectorPanel = memo(function InspectorPanel() {
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
    <div className={`h-full flex flex-col bg-(--ms-bg-surface) ${isMobile ? 'rounded-t-2xl shadow-2xl' : 'border-l border-(--ms-border)'}`}>
      {renderContent()}
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {selectedElementIds.length > 0 && mobileInspectorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/60 z-100 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[60vh] z-101 overflow-hidden"
            >
              {panelContainer}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside id="tour-inspector-panel" className="w-[280px] shrink-0 bg-(--ms-bg-surface) overflow-hidden">
      {panelContainer}
    </aside>
  )
})
