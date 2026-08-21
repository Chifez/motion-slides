import { memo, useState } from 'react'
import { Palette } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'

const PRESET_COLORS = [
  '#0a0a0a', '#111827', '#1e1b4b', '#0c4a6e', 
  '#14532d', '#7f1d1d', '#ffffff', '#f5f5f4'
]

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'
]

/**
 * 🎨 SlideBackgroundPicker — Contextual background controls
 */
export const SlideBackgroundPicker = memo(function SlideBackgroundPicker() {
  const [showPicker, setShowPicker] = useState(false)
  
  const background = useEditorStore(s => s.activeSlide()?.background || '#0a0a0a')
  const updateSlide = useEditorStore(s => s.updateSlide)

  const [imageUrl, setImageUrl] = useState('')

  return (
    <div 
      className="relative" 
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-1.5 text-[10px] text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-(--ms-bg-surface)/80 backdrop-blur-sm border border-(--ms-border) rounded-md px-2 py-1 cursor-pointer transition-colors"
        title="Slide Background"
      >
        <div
          className="w-3 h-3 rounded-sm border border-white/15 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundColor: background.startsWith('url') ? 'transparent' : background,
            backgroundImage: background.startsWith('url') ? background : 'none'
          }}
        />
        <Palette size={11} />
      </button>

      {showPicker && (
        <div className="absolute top-full mt-1.5 left-0 bg-(--ms-bg-surface) border border-(--ms-border) rounded-lg shadow-2xl z-[100] p-4 w-64 backdrop-blur-md">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2 font-medium">
                Color Fill
              </span>
              <input
                type="color"
                value={background.startsWith('#') ? background : '#000000'}
                onChange={(e) => updateSlide({ background: e.target.value })}
                className="w-full h-8 rounded-md cursor-pointer border border-white/10 bg-transparent p-0 overflow-hidden mb-2"
              />
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateSlide({ background: color })}
                    className="w-6 h-6 rounded-md border border-white/10 cursor-pointer transition-transform hover:scale-110"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2 font-medium">
                Image Presets
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img}
                    onClick={() => updateSlide({ background: `url(${img})` })}
                    className="w-10 h-6 rounded-md border border-white/10 cursor-pointer transition-transform hover:scale-110 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${img})` }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2 font-medium">
                Custom Image URL
              </span>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && imageUrl.trim()) {
                      updateSlide({ background: `url(${imageUrl.trim()})` })
                      setImageUrl('')
                    }
                  }}
                  className="flex-1 min-w-0 bg-black/40 border border-(--ms-border) rounded px-2 py-1 text-[10px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 overflow-hidden text-ellipsis"
                />
                <button
                  onClick={() => {
                    if (imageUrl.trim()) {
                      updateSlide({ background: `url(${imageUrl.trim()})` })
                      setImageUrl('')
                    }
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[9px] uppercase cursor-pointer border-none shrink-0"
                >
                  Set
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-(--ms-border)">
              <button
                onClick={() => {
                  const projectId = useEditorStore.getState().activeProjectId
                  if (projectId) {
                    useEditorStore.getState().updateAllSlidesBackground(projectId, background)
                  }
                }}
                className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-(--ms-text-secondary) hover:text-white text-[10px] font-bold rounded cursor-pointer border border-(--ms-border) transition-colors"
              >
                Apply to All Slides
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})


