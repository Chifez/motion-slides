import { useState } from 'react'
import { X, Keyboard } from 'lucide-react'

interface ShortcutItem {
  name: string
  keys: string[]
}

interface ShortcutCategory {
  title: string
  items: ShortcutItem[]
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'Essential',
    items: [
      { name: 'Shortcuts Panel', keys: ['Ctrl', '/'] },
      { name: 'Undo Action', keys: ['Ctrl', 'Z'] },
      { name: 'Redo Action', keys: ['Ctrl', 'Y'] },
      { name: 'Copy Element', keys: ['Ctrl', 'C'] },
      { name: 'Paste Element', keys: ['Ctrl', 'V'] },
      { name: 'Delete Element', keys: ['Backspace'] }
    ]
  },
  {
    title: 'Tools',
    items: [
      { name: 'Select Tool', keys: ['V'] },
      { name: 'Section (Frame) Tool', keys: ['S'] },
      { name: 'Hand (Pan) Tool', keys: ['H'] },
      { name: 'Temporary Pan', keys: ['Hold Space'] }
    ]
  },
  {
    title: 'Canvas',
    items: [
      { name: 'Zoom In / Out', keys: ['Ctrl', 'Scroll'] },
      { name: 'Pan Board', keys: ['Space', 'Drag'] },
      { name: 'Middle-Click Pan', keys: ['Middle Click', 'Drag'] }
    ]
  },
  {
    title: 'Design & Transform',
    items: [
      { name: 'Duplicate Element', keys: ['Ctrl', 'D'] },
      { name: 'Alt-Drag Duplicate', keys: ['Alt', 'Drag'] },
      { name: 'Symmetrical Resize', keys: ['Alt', 'Drag Handle'] },
      { name: 'Proportional Resize', keys: ['Shift', 'Drag Handle'] },
      { name: 'Axis-Locked Drag', keys: ['Shift', 'Drag'] },
      { name: 'Nudge 1px', keys: ['Arrow Keys'] },
      { name: 'Nudge 10px', keys: ['Shift', 'Arrow Keys'] },
      { name: 'Group Elements', keys: ['Ctrl', 'G'] },
      { name: 'Ungroup Elements', keys: ['Ctrl', 'Shift', 'G'] }
    ]
  }
]

interface ShortcutsHelperProps {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsHelper({ isOpen, onClose }: ShortcutsHelperProps) {
  const [activeTab, setActiveTab] = useState(0)

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end justify-center z-[9999] select-none"
      onClick={onClose}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-2xl bg-neutral-900/95 border border-white/10 rounded-t-2xl shadow-2xl p-6 flex flex-col h-[320px] backdrop-blur-md text-white animate-in slide-in-from-bottom duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-blue-400" />
            <h3 className="font-semibold text-sm text-neutral-100">Keyboard Shortcuts</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1 rounded-md hover:bg-white/5 border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-1 border-b border-white/5 pb-2 mb-4 overflow-x-auto">
          {SHORTCUT_CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer border-none bg-transparent ${
                activeTab === idx 
                  ? 'bg-blue-500/25 text-blue-400 border border-blue-500/20' 
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Shortcuts Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-x-8 gap-y-3 custom-scrollbar">
          {SHORTCUT_CATEGORIES[activeTab].items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-0.5 border-b border-white/5 pb-1">
              <span className="text-xs text-neutral-300 font-medium">{item.name}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((k, kIdx) => (
                  <span key={kIdx} className="flex items-center gap-1">
                    {kIdx > 0 && <span className="text-[10px] text-neutral-500">+</span>}
                    <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-neutral-200 bg-neutral-800 border border-neutral-700 rounded shadow-sm">
                      {k}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
