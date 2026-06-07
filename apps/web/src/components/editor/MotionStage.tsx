import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { MotionProvider } from '@/context/MotionContext'
import { CanvasElement } from './CanvasElement'
import type { Slide, PlaybackSettings, SlideTransition, SceneElement } from '@motionslides/shared'
import { useEditorStore } from '@/store/editorStore'
import { ElementRenderer } from './ElementRenderer'
import { getCanvasDimensions } from '@motionslides/shared'
import { cubicBezierToArray } from '@/lib/motionEngine'

interface Props {
  slide: Slide | null
  previousSlide: Slide | null
  settings: PlaybackSettings
  activeTransition?: SlideTransition | null
  mode: 'editor' | 'presentation'
}

function CanvasElementStatic({ element }: { element: SceneElement }) {
  const commonStyle = {
    position: 'absolute' as const,
    left: element.position.x,
    top: element.position.y,
    width: element.size.width,
    height: element.size.height,
    rotate: `${element.rotation}deg`,
    opacity: element.opacity,
    zIndex: element.zIndex,
  }
  return (
    <div style={commonStyle}>
      <ElementRenderer element={element} isSelected={false} />
    </div>
  )
}

function getSlideTransitionVariants(animationType: string, w: number, h: number) {
  switch (animationType) {
    case 'slide-left':
      return {
        outgoing: { initial: { x: 0, opacity: 1 }, animate: { x: -w, opacity: 1 } },
        incoming: { initial: { x: w, opacity: 1 }, animate: { x: 0, opacity: 1 } },
      }
    case 'slide-right':
      return {
        outgoing: { initial: { x: 0, opacity: 1 }, animate: { x: w, opacity: 1 } },
        incoming: { initial: { x: -w, opacity: 1 }, animate: { x: 0, opacity: 1 } },
      }
    case 'slide-up':
      return {
        outgoing: { initial: { y: 0, opacity: 1 }, animate: { y: -h, opacity: 1 } },
        incoming: { initial: { y: h, opacity: 1 }, animate: { x: 0, y: 0, opacity: 1 } },
      }
    case 'slide-down':
      return {
        outgoing: { initial: { y: 0, opacity: 1 }, animate: { y: h, opacity: 1 } },
        incoming: { initial: { y: -h, opacity: 1 }, animate: { x: 0, y: 0, opacity: 1 } },
      }
    case 'zoom':
      return {
        outgoing: { initial: { scale: 1, opacity: 1 }, animate: { scale: 1.3, opacity: 0 } },
        incoming: { initial: { scale: 0.7, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
      }
    case 'flip':
      return {
        outgoing: { initial: { rotateY: 0, opacity: 1 }, animate: { rotateY: -90, opacity: 0 } },
        incoming: { initial: { rotateY: 90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 } },
      }
    case 'fade':
    default:
      return {
        outgoing: { initial: { opacity: 1 }, animate: { opacity: 0 } },
        incoming: { initial: { opacity: 0 }, animate: { opacity: 1 } },
      }
  }
}

export function MotionStage({ slide, previousSlide, settings, activeTransition, mode }: Props) {
  const reviewingSuggestionId = useEditorStore(state => state.reviewingSuggestionId)
  const reviewMode = useEditorStore(state => state.reviewMode)
  const activeSlideIndex = useEditorStore(state => state.activeSlideIndex)
  const originalProjectBackup = useEditorStore(state => state.originalProjectBackup)

  if (!slide) return null

  const animationType = activeTransition?.animation ?? 'none'

  // If a slide-wide transition is active (not magic-move) and we have a previous slide
  if (previousSlide && animationType !== 'magic-move') {
    const durationMs = activeTransition?.duration ?? settings.transitionDuration
    const durationSec = durationMs / 1000
    const ease = activeTransition?.ease
      ? cubicBezierToArray(activeTransition.ease)
      : cubicBezierToArray(settings.transitionEase)
    
    const { width: canvasW, height: canvasH } = getCanvasDimensions(settings.aspectRatio)
    const variants = getSlideTransitionVariants(animationType, canvasW, canvasH)

    return (
      <div 
        style={{
          width: canvasW,
          height: canvasH,
          position: 'relative',
          overflow: 'hidden',
          perspective: animationType === 'flip' ? 1000 : undefined,
        }}
      >
        {/* Outgoing Slide Container */}
        <motion.div
          key={`outgoing-${previousSlide.id}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: canvasW,
            height: canvasH,
            backgroundColor: (previousSlide.background || '#0a0a0a').startsWith('url') ? 'transparent' : (previousSlide.background || '#0a0a0a'),
            backgroundImage: (previousSlide.background || '#0a0a0a').startsWith('url') ? previousSlide.background : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transformStyle: animationType === 'flip' ? 'preserve-3d' : undefined,
            backfaceVisibility: animationType === 'flip' ? 'hidden' : undefined,
          }}
          initial={variants.outgoing.initial}
          animate={variants.outgoing.animate}
          transition={{ duration: durationSec, ease }}
        >
          {previousSlide.elements.map((element) => (
            <CanvasElementStatic key={element.id} element={element} />
          ))}
        </motion.div>

        {/* Incoming Slide Container */}
        <motion.div
          key={`incoming-${slide.id}`}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: canvasW,
            height: canvasH,
            backgroundColor: (slide.background || '#0a0a0a').startsWith('url') ? 'transparent' : (slide.background || '#0a0a0a'),
            backgroundImage: (slide.background || '#0a0a0a').startsWith('url') ? slide.background : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transformStyle: animationType === 'flip' ? 'preserve-3d' : undefined,
            backfaceVisibility: animationType === 'flip' ? 'hidden' : undefined,
          }}
          initial={variants.incoming.initial}
          animate={variants.incoming.animate}
          transition={{ duration: durationSec, ease }}
        >
          {slide.elements.map((element) => (
            <CanvasElementStatic key={element.id} element={element} />
          ))}
        </motion.div>
      </div>
    )
  }

  // Otherwise, fallback to the standard element-level transition (Magic Move)
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
      isTimelinePreview={mode === 'presentation'}
    >
      <LayoutGroup>
        <AnimatePresence mode="sync" initial={false}>
          {slide.elements.map((element) => (
            <CanvasElement
              key={element.id}
              elementId={element.id}
              element={element}
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
