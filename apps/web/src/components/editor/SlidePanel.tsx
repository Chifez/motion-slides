import { useState } from 'react'
import { Plus, Copy, Trash2, Sparkles, Type, Code2, Square, Minus, ChevronDown, ChevronRight, Lock, Unlock, BarChart3, X, Combine, Ungroup } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { useEditorStore } from '@/store/editorStore'
import type { SceneElement } from '@motionslides/shared'

import { SlideThumb } from './slide-panel/SlideThumb'

export function SlidePanel() {
  const slides = useEditorStore(s => s.activeProject()?.slides || [])
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const mobileSlidesOpen = useEditorStore(s => s.mobileSlidesOpen)
  
  const addSlide = useEditorStore(s => s.addSlide)
  const setMobileSlidesOpen = useEditorStore(s => s.setMobileSlidesOpen)
  const isMobile = useIsMobile()
  const totalSlides = slides.length


  const panelContent = (
    <div className={`h-full flex flex-col bg-(--ms-bg-surface) ${isMobile ? 'rounded-t-2xl shadow-2xl' : 'border-l border-(--ms-border)'} transition-colors`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-(--ms-border) sticky top-0 bg-(--ms-bg-surface) z-10 transition-colors">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted)">Slides & Layers</span>
        <div className="flex items-center gap-1">
          <button
            onClick={addSlide}
            className="p-1 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) transition-colors cursor-pointer border-none bg-transparent"
          >
            <Plus size={14} />
          </button>
          {isMobile && (
            <button
              onClick={() => setMobileSlidesOpen(false)}
              className="p-1 rounded-md text-neutral-500 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Slide list */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar pb-10 md:pb-0">
        {slides.map((s, i) => (
          <SlideThumb
            key={s.id}
            slideId={s.id}
            index={i}
            isActive={activeSlideIndex === i}
            totalSlides={totalSlides}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-(--ms-border)">
        <button
          onClick={addSlide}
          className="w-full flex items-center justify-center gap-1.5 bg-(--ms-bg-base) hover:bg-(--ms-border) border border-(--ms-border) text-(--ms-text-secondary) hover:text-(--ms-text-primary) text-xs font-medium py-1.5 rounded-md transition-all cursor-pointer"
        >
          <Plus size={13} /> Add Slide
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileSlidesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSlidesOpen(false)}
              className="fixed inset-0 bg-black/60 z-100 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[280px] z-101 flex flex-col overflow-hidden"
            >
              <div className="flex-1 h-full flex flex-col min-h-0">
                {panelContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-(--ms-bg-surface) overflow-hidden border-r border-(--ms-border) transition-colors">
      {panelContent}
    </aside>
  )
}

