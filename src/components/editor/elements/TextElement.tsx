import type { TextContent } from '@/types'
import { FONT_WEIGHT_MAP } from '@/constants/editor'

interface Props { content: TextContent }

export function TextElement({ content }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: content.fontSize,
        fontWeight: FONT_WEIGHT_MAP[content.fontWeight],
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
