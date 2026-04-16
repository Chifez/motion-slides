import type { TextContent } from '../../../types'

interface Props { content: TextContent }

const weightMap = {
  normal: 400, medium: 500, semibold: 600, bold: 700,
}

export function TextElement({ content }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: content.fontSize,
        fontWeight: weightMap[content.fontWeight],
        color: content.color,
        textAlign: content.align,
        lineHeight: 1.2,
        wordBreak: 'break-word',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {content.value}
    </div>
  )
}
