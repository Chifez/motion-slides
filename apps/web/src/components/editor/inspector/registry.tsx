import type { TextContent, CodeContent, ShapeContent, LineContent, ChartContent, SectionContent, SceneElement, HotspotContent } from '@motionslides/shared'
import { TextSection } from './TextSection'
import { CodeSection } from './CodeSection'
import { ShapeSection } from './ShapeSection'
import { LineSection } from './LineSection'
import { ChartSection } from './ChartSection'
import { SectionSection } from './SectionSection'
import { HotspotSection } from './HotspotSection'

export interface InspectorSectionProps {
  element: SceneElement
  onUpdate: (data: Partial<SceneElement>) => void
  onDelete: () => void
}

export const INSPECTOR_REGISTRY: Record<string, React.ComponentType<InspectorSectionProps>> = {
  text: (props) => (
    <TextSection 
      content={props.element.content as TextContent} 
      onUpdate={(c) => props.onUpdate({ content: { ...(props.element.content as TextContent), ...c } })} 
    />
  ),
  code: (props) => (
    <CodeSection 
      content={props.element.content as CodeContent} 
      onUpdate={(c) => props.onUpdate({ content: { ...(props.element.content as CodeContent), ...c } })} 
    />
  ),
  shape: (props) => (
    <ShapeSection 
      content={props.element.content as ShapeContent} 
      onUpdate={(c) => props.onUpdate({ content: { ...(props.element.content as ShapeContent), ...c } })} 
    />
  ),
  line: (props) => (
    <LineSection 
      content={props.element.content as LineContent} 
      onUpdate={(c) => props.onUpdate({ content: { ...(props.element.content as LineContent), ...c } })} 
      onDelete={props.onDelete}
    />
  ),
  chart: (props) => (
    <ChartSection 
      content={props.element.content as ChartContent} 
      onUpdate={(c) => props.onUpdate({ content: { ...(props.element.content as ChartContent), ...c } })} 
    />
  ),
  section: (props) => (
    <SectionSection 
      content={props.element.content as SectionContent} 
      onUpdate={(c: Partial<SectionContent>) => props.onUpdate({ 
        content: { ...(props.element.content as SectionContent), ...c } 
      })} 
    />
  ),
  hotspot: (props) => (
    <HotspotSection
      content={props.element.content as HotspotContent}
      onUpdate={(c) => props.onUpdate({ content: { ...(props.element.content as HotspotContent), ...c } })}
    />
  ),
}
