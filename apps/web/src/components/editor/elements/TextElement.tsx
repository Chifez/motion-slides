import { useLayoutEffect, useRef, useEffect } from 'react'
import type { SceneElement, TextContent } from '@motionslides/shared'
import { FONT_WEIGHT_MAP } from '@/constants/editor'
import { useEditorStore } from '@/store/editorStore'
import { usePermissions } from '@/context/PermissionContext'
import { useMotionContext } from '@/context/MotionContext'
import { tokenizeText } from './text/charTokenizer'
import { useTextMagicMove } from './text/useTextMagicMove'
import { TextAnimationLayer } from './text/TextAnimationLayer'

interface Props {
  element: SceneElement
}

export function TextElement({ element }: Props) {
  const content = element.content as TextContent
  const updateElement = useEditorStore((s) => s.updateElement)
  const { isEditingId, setEditingId } = useEditorStore()
  const isPresenting = useEditorStore(s => s.isPresenting)
  const containerRef = useRef<HTMLDivElement>(null)
  const editableRef = useRef<HTMLDivElement>(null)

  const isEditing = isEditingId === element.id

  const { isReadOnly } = usePermissions()
  const { durationSec, ease, transitionAnimation, isTimelinePreview } = useMotionContext()

  const {
    animTokens,
    layoutContainerRef,
    spanRefCallback,
  } = useTextMagicMove({
    elementId: element.id,
    text:      content.value,
    fontSize:  content.fontSize,
    color:     content.color,
    isEditing,
    listStyle: content.listStyle,
  })
  useLayoutEffect(() => {
    if (!element.autoHeight || !containerRef.current) return

    const measure = () => {
      const el = containerRef.current!
      const originalHeight = el.style.height
      el.style.height = 'auto'
      const newHeight = el.scrollHeight
      el.style.height = originalHeight

      if (Math.abs(newHeight - element.size.height) > 1) {
        updateElement(element.id, {
          size: { ...element.size, height: newHeight }
        })
      }
    }

    measure()
  }, [element.id, element.autoHeight, element.size.width, content.value, content.fontSize, content.fontWeight, content.fontFamily, updateElement, element.size.height])
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus()
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
    width:     '100%',
    height:    '100%',
    display:   'flex',
    fontSize:  content.fontSize,
    fontWeight: FONT_WEIGHT_MAP[content.fontWeight],
    fontFamily: `"${content.fontFamily || 'Inter'}", sans-serif`,
    fontStyle: content.fontStyle || 'normal',
    color:     content.color,
    textAlign: content.align,
    lineHeight: 1.3,
    wordBreak: 'break-word',
    outline:   'none',
  }

  const fontFamily = `"${content.fontFamily || 'Inter'}", sans-serif`
  const fontWeight = FONT_WEIGHT_MAP[content.fontWeight]

  const isAnimationMode =
    (isPresenting || isReadOnly || isTimelinePreview) &&
    !isEditing &&
    !content.listStyle &&
    transitionAnimation === 'magic-move'

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
            width:      '100%',
            height:     'auto',
            minHeight:  '1em',
            cursor:     'text',
            outline:    'none',
            border:     'none',
            background: 'transparent',
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
          margin:         0,
          paddingLeft:    '1.4em',
          listStyleType:  content.listStyle === 'bullet' ? 'disc' : 'decimal',
          width:          '100%',
        }}>
          {lines.map((line, i) => (
            <li key={i} style={{ marginBottom: '0.2em' }}>
              {line.replace(/^[-*]\s+/, '')}
            </li>
          ))}
        </Tag>
      )
    }

    if (isAnimationMode || isReadOnly || isTimelinePreview) {
      const tokens = tokenizeText(content.value)

      return (
        <div ref={layoutContainerRef} style={{ position: 'relative', width: '100%' }}>

          <div
            aria-hidden="true"
            style={{
              opacity:    0,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak:  'break-word',
              lineHeight: 1.3,
            }}
          >
            {tokens.map(token =>
              token.char === '\n' ? (
                <br key={token.key} />
              ) : (
                <span
                  key={token.key}
                  ref={
                    token.isWhitespace
                      ? undefined
                      : el => spanRefCallback(token.key, el)
                  }
                >
                  {token.char}
                </span>
              )
            )}
          </div>

          <TextAnimationLayer
            tokens={animTokens}
            durationSec={durationSec}
            ease={ease}
            fontFamily={fontFamily}
            fontWeight={fontWeight}
            fontStyle={content.fontStyle || 'normal'}
            lineHeight={1.3}
          />
        </div>
      )
    }

    return (
      <span style={{ width: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: content.align }}>
        {content.value}
      </span>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...commonStyle,
        alignItems:     'center',
        flexDirection:  'column',
        justifyContent: 'center',
        overflow:       isEditing ? 'visible' : 'hidden',
      }}
    >
      {renderInner()}
    </div>
  )
}
