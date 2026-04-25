import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { MotionProvider } from '@/context/MotionContext'
import { CanvasElement } from './CanvasElement'
import type { Slide, PlaybackSettings, SlideTransition } from '@motionslides/shared'

interface Props {
  slide: Slide | null
  previousSlide: Slide | null
  settings: PlaybackSettings
  activeTransition?: SlideTransition | null
  mode: 'editor' | 'presentation'
}

/**
 * 🎬 MotionStage — The Unified Render Engine
 * 
 * Handles the Match → Diff → Measure → Invert → Animate lifecycle.
 * Used in both the Editor and Presentation mode to ensure visual parity.
 */
export function MotionStage({ slide, previousSlide, settings, activeTransition }: Props) {
  if (!slide) return null

  return (
    <MotionProvider
      settings={settings}
      previousSlide={previousSlide}
      currentSlide={slide}
      activeTransition={activeTransition}
    >
      <LayoutGroup>
        <AnimatePresence mode="sync" initial={false}>
          {slide.elements.map((el) => (
            <CanvasElement 
              key={el.id} 
              element={el} 
              // staggerIndex is used for sequential builds in presentation mode
              // staggerIndex={isPresentation ? ... : undefined}
            />
          ))}
        </AnimatePresence>
      </LayoutGroup>
    </MotionProvider>
  )
}
