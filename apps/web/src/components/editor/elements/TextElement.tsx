import type { TextContent } from '@motionslides/shared'
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
        fontFamily: `"${content.fontFamily || 'Inter'}", sans-serif`,
        fontStyle: content.fontStyle || 'normal',
        color: content.color,
        textAlign: content.align,
        lineHeight: 1.2,
        wordBreak: 'break-word',
        overflow: 'hidden',
      }}
    >
      {content.value}
    </div>
  )
}
