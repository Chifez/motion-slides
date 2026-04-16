import { Trash2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import type { TextContent, CodeContent, ShapeContent, ShapeType } from '../../types'

const SHAPE_OPTIONS: { value: ShapeType; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'database', label: 'Database' },
  { value: 'server', label: 'Server' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'client', label: 'Client / Screen' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'user', label: 'User / Actor' },
  { value: 'bucket', label: 'Storage / Bucket' },
  { value: 'queue', label: 'Queue' },
  { value: 'document', label: 'Document' },
]

export function InspectorPanel() {
  const { selectedElementId, activeSlide, updateElement, deleteElement } = useEditorStore()
  const slide = activeSlide()
  const element = slide?.elements.find((el) => el.id === selectedElementId)

  if (!element) {
    return (
      <aside className="panel-right">
        <div className="inspector-section">
          <span className="inspector-label">Inspector</span>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Select an element to inspect its properties.
          </div>
        </div>
      </aside>
    )
  }

  const update = (data: Parameters<typeof updateElement>[1]) => updateElement(element.id, data)

  const textContent = element.content as TextContent
  const codeContent = element.content as CodeContent
  const shapeContent = element.content as ShapeContent

  return (
    <aside className="panel-right">
      {/* Type badge + delete */}
      <div className="inspector-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="inspector-label" style={{ marginBottom: 0 }}>
          {element.type.toUpperCase()}
        </span>
        <button className="btn btn-danger btn-icon" onClick={() => deleteElement(element.id)}>
          <Trash2 size={13} />
        </button>
      </div>

      {/* Position & Size */}
      <div className="inspector-section">
        <span className="inspector-label">Transform</span>
        <div className="inspector-row">
          <label>X</label>
          <input
            type="number"
            className="inspector-input"
            value={Math.round(element.position.x)}
            onChange={(e) => update({ position: { ...element.position, x: +e.target.value } })}
          />
          <label>Y</label>
          <input
            type="number"
            className="inspector-input"
            value={Math.round(element.position.y)}
            onChange={(e) => update({ position: { ...element.position, y: +e.target.value } })}
          />
        </div>
        <div className="inspector-row">
          <label>W</label>
          <input
            type="number"
            className="inspector-input"
            value={Math.round(element.size.width)}
            onChange={(e) => update({ size: { ...element.size, width: +e.target.value } })}
          />
          <label>H</label>
          <input
            type="number"
            className="inspector-input"
            value={Math.round(element.size.height)}
            onChange={(e) => update({ size: { ...element.size, height: +e.target.value } })}
          />
        </div>
        <div className="inspector-row">
          <label>°</label>
          <input
            type="number"
            className="inspector-input"
            value={element.rotation}
            onChange={(e) => update({ rotation: +e.target.value })}
          />
          <label>α</label>
          <input
            type="number"
            className="inspector-input"
            min={0} max={1} step={0.01}
            value={element.opacity}
            onChange={(e) => update({ opacity: +e.target.value })}
          />
        </div>
      </div>

      {/* Text properties */}
      {element.type === 'text' && (
        <div className="inspector-section">
          <span className="inspector-label">Text</span>
          <div className="inspector-row">
            <label style={{ width: 'auto' }}>Color</label>
            <input
              type="color"
              value={textContent.color}
              onChange={(e) => update({ content: { ...textContent, color: e.target.value } })}
              style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </div>
          <div className="inspector-row">
            <label style={{ width: 'auto' }}>Size</label>
            <input
              type="number"
              className="inspector-input"
              value={textContent.fontSize}
              onChange={(e) => update({ content: { ...textContent, fontSize: +e.target.value } })}
            />
          </div>
          <textarea
            style={{
              width: '100%', background: 'var(--bg-panel-2)', border: '1px solid var(--border)',
              borderRadius: 5, padding: '6px 8px', color: 'var(--text-primary)', fontSize: 12,
              fontFamily: 'var(--font-sans)', resize: 'vertical', marginTop: 4, minHeight: 60,
            }}
            value={textContent.value}
            onChange={(e) => update({ content: { ...textContent, value: e.target.value } })}
          />
        </div>
      )}

      {/* Code properties */}
      {element.type === 'code' && (
        <div className="inspector-section">
          <span className="inspector-label">Code</span>
          <textarea
            style={{
              width: '100%', background: 'var(--bg-panel-2)', border: '1px solid var(--border)',
              borderRadius: 5, padding: '6px 8px', color: '#e2e8f0', fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace', resize: 'vertical', minHeight: 120,
            }}
            value={codeContent.value}
            onChange={(e) => update({ content: { ...codeContent, value: e.target.value } })}
            spellCheck={false}
          />
        </div>
      )}

      {/* Shape properties */}
      {element.type === 'shape' && (
        <div className="inspector-section">
          <span className="inspector-label">Shape</span>
          <div className="inspector-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <select
              className="inspector-input"
              value={shapeContent.shapeType}
              onChange={(e) => update({ content: { ...shapeContent, shapeType: e.target.value as ShapeType } })}
            >
              {SHAPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="inspector-row" style={{ marginTop: 6 }}>
            <label style={{ width: 'auto' }}>Fill</label>
            <input
              type="color"
              value={shapeContent.fill}
              onChange={(e) => update({ content: { ...shapeContent, fill: e.target.value } })}
              style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
            />
            <label style={{ width: 'auto' }}>Border</label>
            <input
              type="color"
              value={shapeContent.stroke}
              onChange={(e) => update({ content: { ...shapeContent, stroke: e.target.value } })}
              style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </div>
          <div className="inspector-row" style={{ marginTop: 4 }}>
            <label style={{ width: 'auto', flexShrink: 0 }}>Label</label>
            <input
              type="text"
              className="inspector-input"
              value={shapeContent.label ?? ''}
              onChange={(e) => update({ content: { ...shapeContent, label: e.target.value } })}
              placeholder="e.g. API Server"
            />
          </div>
        </div>
      )}
    </aside>
  )
}
