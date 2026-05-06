import { memo } from 'react'
import { motion } from 'framer-motion'
import type { SceneElement, SectionContent } from '@motionslides/shared'

interface Props {
  element: SceneElement
  content: SectionContent
}

/**
 * SectionElement — renders a visual grouping container for diagram tiers.
 * Animates its geometry fluidly using Framer Motion's layout system.
 * Phase 1: Visual wrapper only — no parent-child ownership.
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

  return (
    <motion.div
      layout
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        backgroundColor,
        border: borderStyle === 'none' ? 'none' : `${borderWidth}px ${borderStyle} ${borderColor}`,
        borderRadius: cornerRadius,
      }}
      transition={{ type: 'spring', stiffness: 280, damping: 34 }}
    >
      {label && (
        <div
          className="absolute top-0 left-0 px-2 py-0.5 text-[10px] font-semibold tracking-wide"
          style={{
            color: borderColor,
            background: backgroundColor,
            borderRadius: `${cornerRadius}px 0 ${Math.round(cornerRadius * 0.5)}px 0`,
          }}
        >
          {label}
        </div>
      )}
    </motion.div>
  )
})
