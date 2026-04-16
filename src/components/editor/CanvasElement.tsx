import { motion } from 'framer-motion'
import { useEditorStore } from '../../store/editorStore'
import type { SceneElement, TextContent, CodeContent, ShapeContent } from '../../types'
import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { BoundingBox } from './BoundingBox'

interface Props {
  element: SceneElement
}

export function CanvasElement({ element }: Props) {
  const { selectedElementId, setSelectedElement, updateElement } = useEditorStore()
  const isSelected = selectedElementId === element.id

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedElement(element.id)
  }

  function renderContent() {
    switch (element.type) {
      case 'text':
        return <TextElement content={element.content as TextContent} />
      case 'code':
        return <CodeElement content={element.content as CodeContent} />
      case 'shape':
        return <ShapeElement content={element.content as ShapeContent} />
      default:
        return null
    }
  }

  return (
    <>
      <motion.div
        layoutId={element.id}
        className="canvas-element"
        style={{
          left: element.position.x,
          top: element.position.y,
          width: element.size.width,
          height: element.size.height,
          rotate: element.rotation,
          opacity: element.opacity,
          zIndex: element.zIndex,
        }}
        transition={{
          layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: element.opacity, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        drag
        dragMomentum={false}
        onDragEnd={(_, info) => {
          updateElement(element.id, {
            position: {
              x: element.position.x + info.offset.x,
              y: element.position.y + info.offset.y,
            },
          })
        }}
        onClick={handleClick}
        whileDrag={{ zIndex: 999, cursor: 'grabbing' }}
      >
        {renderContent()}
      </motion.div>

      {/* Bounding box rendered as sibling (outside motion div to avoid dragging it) */}
      {isSelected && <BoundingBox element={element} />}
    </>
  )
}
