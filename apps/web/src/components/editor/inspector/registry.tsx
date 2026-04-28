import type { TextContent, CodeContent, ShapeContent, LineContent, ChartContent, SceneElement } from '@motionslides/shared'
import { TextSection } from './TextSection'
import { CodeSection } from './CodeSection'
import { ShapeSection } from './ShapeSection'
import { LineSection } from './LineSection'
import { ChartSection } from './ChartSection'

export interface InspectorSectionProps {
  element: SceneElement
  onUpdate: (data: Partial<SceneElement>) => void
  onDelete: () => void
}

export const INSPECTOR_REGISTRY: Record<string, React.ComponentType<InspectorSectionProps>> = {
  text: (props) => (
    <TextSection 
      content={props.element.content as TextContent} 
      onUpdate={(c) => props.onUpdate({ content: c })} 
    />
  ),
  code: (props) => (
    <CodeSection 
      content={props.element.content as CodeContent} 
      onUpdate={(c) => props.onUpdate({ content: c })} 
    />
  ),
  shape: (props) => (
    <ShapeSection 
      content={props.element.content as ShapeContent} 
      onUpdate={(c) => props.onUpdate({ content: c })} 
    />
  ),
  line: (props) => (
    <LineSection 
      content={props.element.content as LineContent} 
      onUpdate={(c) => props.onUpdate({ content: c })} 
      onDelete={props.onDelete}
    />
  ),
  chart: (props) => (
    <ChartSection 
      content={props.element.content as ChartContent} 
      onUpdate={(c) => props.onUpdate({ content: c })} 
    />
  ),
}
