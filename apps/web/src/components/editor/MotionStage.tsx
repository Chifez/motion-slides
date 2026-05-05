import { memo } from 'react'
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


export const MotionStage = memo(function MotionStage({ slide, previousSlide, settings, activeTransition }: Props) {
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
              elementId={el.id}
            />
          ))}
        </AnimatePresence>
      </LayoutGroup>
    </MotionProvider>
  )
})


