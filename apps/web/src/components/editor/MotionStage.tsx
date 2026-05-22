import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { MotionProvider } from '@/context/MotionContext'
import { CanvasElement } from './CanvasElement'
import type { Slide, PlaybackSettings, SlideTransition, SceneElement } from '@motionslides/shared'
import { useEditorStore } from '@/store/editorStore'
import { ElementRenderer } from './ElementRenderer'

interface Props {
  slide: Slide | null
  previousSlide: Slide | null
  settings: PlaybackSettings
  activeTransition?: SlideTransition | null
  mode: 'editor' | 'presentation'
}


export function MotionStage({ slide, previousSlide, settings, activeTransition }: Props) {
  const reviewingSuggestionId = useEditorStore(state => state.reviewingSuggestionId)
  const reviewMode = useEditorStore(state => state.reviewMode)
  const activeSlideIndex = useEditorStore(state => state.activeSlideIndex)
  const originalProjectBackup = useEditorStore(state => state.originalProjectBackup)

  if (!slide) return null


  const deletedElements = (reviewingSuggestionId && reviewMode === 'suggested' && originalProjectBackup)
    ? (originalProjectBackup.slides[activeSlideIndex]?.elements.filter(
      (originalElement) => !slide.elements.some((element) => element.id === originalElement.id)
    ) ?? [])
    : []

  return (
    <MotionProvider
      settings={settings}
      previousSlide={previousSlide}
      currentSlide={slide}
      activeTransition={activeTransition}
    >
      <LayoutGroup>
        <AnimatePresence mode="sync" initial={false}>
          {slide.elements.map((element) => (
            <CanvasElement
              key={element.id}
              elementId={element.id}
            />
          ))}
        </AnimatePresence>

        {deletedElements.map((element: SceneElement) => {
          const commonStyle = {
            position: 'absolute' as const,
            left: element.position.x,
            top: element.position.y,
            width: element.size.width,
            height: element.size.height,
            rotate: `${element.rotation}deg`,
            opacity: 0.4,
            zIndex: element.zIndex,
            pointerEvents: 'none' as const,
          }

          return (
            <div
              key={element.id}
              style={commonStyle}
              className="canvas-element border-2 border-dashed border-red-500 rounded-sm"
            >
              <div className="absolute -top-5 left-0 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow whitespace-nowrap z-[10] pointer-events-none">
                Deleted
              </div>
              <ElementRenderer element={element} isSelected={false} />
            </div>
          )
        })}
      </LayoutGroup>
    </MotionProvider>
  )
}


