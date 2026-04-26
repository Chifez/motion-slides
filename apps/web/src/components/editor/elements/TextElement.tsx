import type { TextContent } from '@motionslides/shared'
import { FONT_WEIGHT_MAP } from '@/constants/editor'

interface Props { content: TextContent }

export function TextElement({ content }: Props) {
  const commonStyle: React.CSSProperties = {
    width: 'max-content',
    maxWidth: '100%',
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

  if (content.listStyle === 'bullet' || content.listStyle === 'numbered') {
    const Tag = content.listStyle === 'bullet' ? 'ul' : 'ol'
    const lines = content.value.split('\n').filter(l => l.trim().length > 0)

    return (
      <div style={{ ...commonStyle, flexDirection: 'column', justifyContent: 'center' }}>
        <Tag style={{ 
          margin: 0, 
          paddingLeft: '1.4em', 
          listStyleType: content.listStyle === 'bullet' ? 'disc' : 'decimal' 
        }}>
          {lines.map((line, i) => (
            <li key={i} style={{ marginBottom: '0.2em' }}>
              {line.replace(/^[-*]\s+/, '')}
            </li>
          ))}
        </Tag>
      </div>
    )
  }

  return (
    <div style={{ ...commonStyle, alignItems: 'center' }}>
      {content.value}
    </div>
  )
}
