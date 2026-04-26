import { useLayoutEffect, useRef, useEffect } from 'react'
import type { SceneElement, TextContent } from '@motionslides/shared'
import { FONT_WEIGHT_MAP } from '@/constants/editor'
import { useEditorStore } from '@/store/editorStore'

interface Props {
  element: SceneElement
}

export function TextElement({ element }: Props) {
  const content = element.content as TextContent
  const updateElement = useEditorStore((s) => s.updateElement)
  const { isEditingId, setEditingId } = useEditorStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const editableRef = useRef<HTMLDivElement>(null)

  const isEditing = isEditingId === element.id

  // ── Auto-Height logic ──
  useLayoutEffect(() => {
    if (!element.autoHeight || !containerRef.current) return

    const measure = () => {
      const el = containerRef.current!
      const originalHeight = el.style.height
      el.style.height = 'auto'
      const newHeight = el.scrollHeight // Use scrollHeight for better accuracy
      el.style.height = originalHeight

      if (Math.abs(newHeight - element.size.height) > 1) {
        updateElement(element.id, {
          size: { ...element.size, height: newHeight }
        })
      }
    }

    measure()
  }, [element.id, element.autoHeight, element.size.width, content.value, content.fontSize, content.fontWeight, content.fontFamily, updateElement, element.size.height])

  // ── Focus logic ──
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus()
      // Select all text on focus
      const range = document.createRange()
      range.selectNodeContents(editableRef.current)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }, [isEditing])

  const handleBlur = () => {
    if (editableRef.current) {
      const newValue = editableRef.current.innerText
      if (newValue !== content.value) {
        updateElement(element.id, {
          content: { ...content, value: newValue }
        })
      }
    }
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      editableRef.current?.blur()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setEditingId(null)
    }
  }

  const commonStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    fontSize: content.fontSize,
    fontWeight: FONT_WEIGHT_MAP[content.fontWeight],
    fontFamily: `"${content.fontFamily || 'Inter'}", sans-serif`,
    fontStyle: content.fontStyle || 'normal',
    color: content.color,
    textAlign: content.align,
    lineHeight: 1.3,
    wordBreak: 'break-word',
    outline: 'none',
  }

  // Bullet/Numbered list support is display-only for now when NOT editing
  // When editing, we just use plain text for simplicity in this version
  const renderInner = () => {
    if (isEditing) {
      return (
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: 'auto',
            minHeight: '1em',
            cursor: 'text',
          }}
        >
          {content.value}
        </div>
      )
    }

    if (content.listStyle === 'bullet' || content.listStyle === 'numbered') {
      const Tag = content.listStyle === 'bullet' ? 'ul' : 'ol'
      const lines = content.value.split('\n').filter(l => l.trim().length > 0)

      return (
        <Tag style={{
          margin: 0,
          paddingLeft: '1.4em',
          listStyleType: content.listStyle === 'bullet' ? 'disc' : 'decimal',
          width: '100%',
          pointerEvents: 'none',
        }}>
          {lines.map((line, i) => (
            <li key={i} style={{ marginBottom: '0.2em' }}>
              {line.replace(/^[-*]\s+/, '')}
            </li>
          ))}
        </Tag>
      )
    }

    return <span style={{ pointerEvents: 'none' }}>{content.value}</span>
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...commonStyle,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: isEditing ? 'visible' : 'hidden',
      }}
    >
      {renderInner()}
    </div>
  )
}
