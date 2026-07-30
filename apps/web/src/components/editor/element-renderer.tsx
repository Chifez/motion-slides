import { memo } from 'react'
import { TextElement } from './elements/text-element'
import { CodeElement } from './elements/code-element'
import { ShapeElement } from './elements/shape-element'
import { LineElement } from './elements/line-element'
import { ChartElement } from './elements/chart-element'
import { SectionElement } from './elements/section-element'
import { HotspotElement } from './elements/hotspot-element'

import type { HotspotContent, CodeContent, ShapeContent, ChartContent, SectionContent } from '@motionslides/shared'

interface Props {
  element: any
  isSelected: boolean
}

export const ElementRenderer = memo(function ElementRenderer({ element, isSelected }: Props) {
  switch (element.type) {
    case 'text': return <TextElement element={element} />
    case 'code': return <CodeElement content={element.content as CodeContent} elementId={element.id} />
    case 'shape': return <ShapeElement content={element.content as ShapeContent} elementId={element.id} />
    case 'line': return <LineElement element={element} isSelected={isSelected} />
    case 'chart': return <ChartElement content={element.content as ChartContent} />
    case 'section': return <SectionElement element={element} content={element.content as SectionContent} />
    case 'hotspot': return <HotspotElement content={element.content as HotspotContent} elementId={element.id} pulseEffect={element.pulseEffect} />
    default: return null
  }
})
