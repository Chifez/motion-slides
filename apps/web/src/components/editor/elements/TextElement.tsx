import { useLayoutEffect, useRef } from 'react'
import type { SceneElement, TextContent } from '@motionslides/shared'
import { FONT_WEIGHT_MAP } from '@/constants/editor'
import { useEditorStore } from '@/store/editorStore'

interface Props {
  element: SceneElement
}

export function TextElement({ element }: Props) {
  const content = element.content as TextContent
  const updateElement = useEditorStore((s) => s.updateElement)
  const containerRef = useRef<HTMLDivElement>(null)


  useLayoutEffect(() => {
    if (!element.autoHeight || !containerRef.current) return

    const measure = () => {
      const { height } = containerRef.current!.getBoundingClientRect()

      const el = containerRef.current!
      const originalHeight = el.style.height
      el.style.height = 'auto'
      const newHeight = el.offsetHeight
      el.style.height = originalHeight

      if (Math.abs(newHeight - element.size.height) > 1) {
        updateElement(element.id, {
          size: { ...element.size, height: newHeight }
        })
      }
    }

    measure()
  }, [element.id, element.autoHeight, element.size.width, content.value, content.fontSize, content.fontWeight, content.fontFamily, updateElement, element.size.height])

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
    overflow: 'hidden',
  }

  const renderInner = () => {
    if (content.listStyle === 'bullet' || content.listStyle === 'numbered') {
      const Tag = content.listStyle === 'bullet' ? 'ul' : 'ol'
      const lines = content.value.split('\n').filter(l => l.trim().length > 0)

      return (
        <Tag style={{
          margin: 0,
          paddingLeft: '1.4em',
          listStyleType: content.listStyle === 'bullet' ? 'disc' : 'decimal',
          width: '100%'
        }}>
          {lines.map((line, i) => (
            <li key={i} style={{ marginBottom: '0.2em' }}>
              {line.replace(/^[-*]\s+/, '')}
            </li>
          ))}
        </Tag>
      )
    }

    return content.value
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...commonStyle,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      {renderInner()}
    </div>
  )
}
