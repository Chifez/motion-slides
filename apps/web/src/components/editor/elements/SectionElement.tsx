import { memo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SceneElement, SectionContent } from '@motionslides/shared'
import { useEditorStore } from '@/store/editorStore'

interface Props {
  element: SceneElement
  content: SectionContent
}

/**
 * SectionElement — renders a visual grouping container for diagram tiers.
 * 
 * High-Fidelity Interaction:
 * 1. Background is transparent to clicks (passes through to children).
 * 2. Border and Label are hit-targets for selecting the section.
 * 3. Immediate inline editing of label on creation.
 */
export const SectionElement = memo(function SectionElement({ element, content }: Props) {
  const {
    backgroundColor,
    borderColor,
    borderStyle,
    borderWidth,
    cornerRadius,
    label,
  } = content

  const isEditingId = useEditorStore(s => s.isEditingId)
  const setEditingId = useEditorStore(s => s.setEditingId)
  const updateElement = useEditorStore(s => s.updateElement)
  const setSelectedElement = useEditorStore(s => s.setSelectedElement)

  const isEditing = isEditingId === element.id
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select()
    }
  }, [isEditing])

  const handleLabelSubmit = (val: string) => {
    updateElement(element.id, { content: { ...content, label: val } as any })
    setEditingId(null)
  }

  const handleBorderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedElement(element.id)
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* 
          HIT ZONE: The Border 
          We render a slightly thicker invisible border to make it easier to grab.
      */}
      <div 
        className="absolute inset-0 pointer-events-auto cursor-default"
        style={{
          border:       `${borderWidth + 4}px solid transparent`, // Larger hit area
          borderRadius: cornerRadius,
        }}
        onClick={handleBorderClick}
      />

      {/* VISUAL: The Container */}
      <motion.div
        layout
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundColor,
          border:       borderStyle === 'none' ? 'none' : `${borderWidth}px ${borderStyle} ${borderColor}`,
          borderRadius: cornerRadius,
        }}
        transition={{ type: 'spring', stiffness: 280, damping: 34 }}
      >
        {/* Label Area */}
        <div
          className="absolute top-0 left-0 px-2.5 py-1 pointer-events-auto cursor-text border-r border-b"
          style={{
            color:        borderColor.includes('var') ? 'var(--ms-text-primary)' : borderColor,
            backgroundColor: 'var(--ms-bg-elevated)',
            borderColor:  borderColor,
            borderRadius: `0 0 ${Math.round(cornerRadius * 0.5)}px 0`,
            backdropFilter: 'blur(8px)',
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            setEditingId(element.id)
          }}
          onClick={handleBorderClick}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              autoFocus
              className="bg-transparent border-none outline-none text-[10px] font-bold w-24 text-(--ms-text-primary)"
              defaultValue={label || ''}
              onBlur={(e) => handleLabelSubmit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelSubmit(e.currentTarget.value)
                if (e.key === 'Escape') setEditingId(null)
              }}
            />
          ) : (
            <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
              {label || 'Section'}
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
})
