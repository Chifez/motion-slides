import { memo } from 'react'
import { TextElement } from './elements/TextElement'
import { CodeElement } from './elements/CodeElement'
import { ShapeElement } from './elements/ShapeElement'
import { LineElement } from './elements/LineElement'
import { ChartElement } from './elements/ChartElement'
import { SectionElement } from './elements/SectionElement'

import type { CodeContent, ShapeContent, ChartContent, SectionContent } from '@motionslides/shared'

interface Props {
  element: any
  isSelected: boolean
}

export const ElementRenderer = memo(function ElementRenderer({ element, isSelected }: Props) {
  switch (element.type) {
    case 'text': return <TextElement element={element} />
    case 'code': return <CodeElement content={element.content as CodeContent} elementId={element.id} />
    case 'shape': return <ShapeElement content={element.content as ShapeContent} />
    case 'line': return <LineElement element={element} isSelected={isSelected} />
    case 'chart': return <ChartElement content={element.content as ChartContent} />
    case 'section': return <SectionElement element={element} content={element.content as SectionContent} />
    default: return null
  }
})
