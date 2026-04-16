import { Plus, Copy, Trash2 } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'

export function SlidePanel() {
  const {
    activeProject,
    activeSlideIndex,
    setActiveSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
  } = useEditorStore()

  const project = activeProject()
  if (!project) return null
  const { slides } = project

  return (
    <aside className="panel-left">
      <div className="panel-left-header">
        <span>Slides</span>
        <button className="btn btn-ghost btn-icon" onClick={addSlide} title="Add Slide">
          <Plus size={14} />
        </button>
      </div>

      <div className="slides-list">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`slide-thumb${activeSlideIndex === i ? ' active' : ''}`}
            onClick={() => setActiveSlide(i)}
          >
            <span className="slide-thumb-number">{i + 1}</span>
            <div className="slide-thumb-preview">
              {slide.elements.length > 0
                ? <span style={{ fontSize: 9, color: '#555', textAlign: 'center', padding: 4 }}>
                    {slide.elements.length} element{slide.elements.length !== 1 ? 's' : ''}
                  </span>
                : <span>Empty</span>}
            </div>

            {/* Hover actions */}
            {activeSlideIndex === i && (
              <div
                style={{
                  position: 'absolute', bottom: 4, right: 4,
                  display: 'flex', gap: 3,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ padding: 3 }}
                  onClick={() => duplicateSlide(i)}
                  title="Duplicate"
                >
                  <Copy size={10} />
                </button>
                {slides.length > 1 && (
                  <button
                    className="btn btn-danger btn-icon"
                    style={{ padding: 3 }}
                    onClick={() => deleteSlide(i)}
                    title="Delete"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel-left-footer">
        <button className="btn btn-panel" style={{ width: '100%' }} onClick={addSlide}>
          <Plus size={13} /> Add Slide
        </button>
      </div>
    </aside>
  )
}
