import { memo, useState } from 'react'
import { Palette } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

const PRESET_COLORS = [
  '#0a0a0a', '#111827', '#1e1b4b', '#0c4a6e', 
  '#14532d', '#7f1d1d', '#ffffff', '#f5f5f4'
]

/**
 * 🎨 SlideBackgroundPicker — Contextual background controls
 */
export const SlideBackgroundPicker = memo(function SlideBackgroundPicker() {
  const [showPicker, setShowPicker] = useState(false)
  
  const background = useEditorStore(s => s.activeSlide()?.background || '#0a0a0a')
  const updateSlide = useEditorStore(s => s.updateSlide)

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-1.5 text-[10px] text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-(--ms-bg-surface)/80 backdrop-blur-sm border border-(--ms-border) rounded-md px-2 py-1 cursor-pointer transition-colors"
        title="Slide Background"
      >
        <div
          className="w-3 h-3 rounded-sm border border-white/15"
          style={{ background }}
        />
        <Palette size={11} />
      </button>

      {showPicker && (
        <div className="absolute top-full mt-1.5 left-0 bg-(--ms-bg-surface) border border-(--ms-border) rounded-lg shadow-2xl z-50 p-3 w-48 backdrop-blur-md">
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2 font-medium">
            Background Color
          </span>
          
          <input
            type="color"
            value={background}
            onChange={(e) => updateSlide({ background: e.target.value })}
            className="w-full h-8 rounded-md cursor-pointer border-none bg-transparent mb-2"
          />
          
          <div className="flex gap-1 flex-wrap">
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
      )}
    </div>
  )
})
