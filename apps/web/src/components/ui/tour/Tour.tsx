import { useEffect, useState, useRef, createContext, useContext, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { DASHBOARD_STEPS, EDITOR_STEPS, type TourStep } from '@/store/slices/onboardingSlice'

const isSSR = typeof window === 'undefined'

// ─────────────────────────────────────────────
// Compound Component Context
// ─────────────────────────────────────────────
interface TourContextValue {
  steps: TourStep[]
  activeStep: number
  activeStepData: TourStep
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  targetRect: DOMRect | null
}

const TourContext = createContext<TourContextValue | null>(null)

/**
 * Custom hook to safely consume the Tour context.
 * Delegates to useContext for standard cross-React-version compatibility.
 */
export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('Tour subcomponents must be rendered inside a Tour.Root Provider')
  }
  return context
}

// ─────────────────────────────────────────────
// Tour Root Component
// ─────────────────────────────────────────────
interface RootProps {
  children?: ReactNode
}

function TourRoot({ children }: RootProps) {
  const isOnboardingActive = useEditorStore((s) => s.isOnboardingActive)
  const onboardingStep = useEditorStore((s) => s.onboardingStep)
  const onboardingTourType = useEditorStore((s) => s.onboardingTourType)
  const nextOnboardingStep = useEditorStore((s) => s.nextOnboardingStep)
  const prevOnboardingStep = useEditorStore((s) => s.prevOnboardingStep)
  const completeOnboarding = useEditorStore((s) => s.completeOnboarding)

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const steps = onboardingTourType === 'dashboard' ? DASHBOARD_STEPS : onboardingTourType === 'editor' ? EDITOR_STEPS : []
  const activeStepData = steps[onboardingStep]

  // Single unified effect: find target element, observe it + viewport for layout changes.
  // Previously, a separate effect tracked windowSize as state and piped it as a dependency
  // into this effect — using state as an event bus between effects. Now the ResizeObserver
  // on document.documentElement directly catches viewport changes, eliminating the phantom
  // render and the cross-effect coupling entirely.
  useEffect(() => {
    if (!isOnboardingActive || isSSR) {
      setTargetRect(null)
      return
    }

    // Derive step data inside the effect from onboardingStep alone,
    // avoiding activeStepData as a dependency (it's derived from steps[onboardingStep]
    // and including both would double-fire when both references update).
    const currentSteps = onboardingTourType === 'dashboard' ? DASHBOARD_STEPS : onboardingTourType === 'editor' ? EDITOR_STEPS : []
    const stepData = currentSteps[onboardingStep]

    if (!stepData?.selector) {
      setTargetRect(null)
      return
    }

    const element = document.querySelector(stepData.selector)
    if (!element) {
      setTargetRect(null)
      return
    }

    const updateRect = () => {
      setTargetRect(element.getBoundingClientRect())
    }

    // Measure initially and scroll target into viewport
    updateRect()
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // Observe the target element for size/position changes, and document.documentElement
    // for viewport resizes — this replaces the old window 'resize' listener + state approach.
    const observer = new ResizeObserver(updateRect)
    observer.observe(element)
    observer.observe(document.documentElement)

    // Capture scrolling inside any container to update the spotlight position in real time
    const handleScroll = () => {
      updateRect()
    }
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [isOnboardingActive, onboardingStep, onboardingTourType])

  // Dev warning for configuration issues
  if (isOnboardingActive && steps.length === 0 && onboardingTourType) {
    console.warn(`[Tour] Active onboarding tour type "${onboardingTourType}" returned 0 steps. Check your onboardingSlice configuration.`)
  }

  const shouldRender = isOnboardingActive && steps.length > 0

  const contextValue: TourContextValue = {
    steps,
    activeStep: onboardingStep,
    activeStepData,
    nextStep: nextOnboardingStep,
    prevStep: prevOnboardingStep,
    skipTour: completeOnboarding,
    targetRect,
  }

  return (
    <TourContext.Provider value={contextValue}>
      <AnimatePresence>
        {shouldRender && (
          <div className="fixed inset-0 z-[8000] pointer-events-none">
            <TourSpotlight />
            <TourContent />
            {children}
          </div>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  )
}

// ─────────────────────────────────────────────
// Tour Spotlight Component
// ─────────────────────────────────────────────
function TourSpotlight() {
  const { targetRect, skipTour } = useTour()

  // If no targetRect, we render a solid dark overlay with backdrop blur
  if (!targetRect) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        onClick={skipTour}
      />
    )
  }

  // Padding around target element spotlight
  const pad = 8
  const x = targetRect.left - pad
  const y = targetRect.top - pad
  const w = targetRect.width + pad * 2
  const h = targetRect.height + pad * 2
  const r = 8 // border radius of spotlight cutout

  // SVG path for the spotlight mask. Uses a large fixed rectangle (10000×10000)
  // instead of tracking window dimensions as state, since the SVG viewBox and
  // CSS inset-0 handle viewport coverage. This eliminates the need for windowSize
  // state entirely.
  const S = 10000
  const path = `
    M 0 0
    h ${S}
    v ${S}
    h ${-S}
    z
    M ${x + r} ${y}
    h ${w - r * 2}
    a ${r} ${r} 0 0 1 ${r} ${r}
    v ${h - r * 2}
    a ${r} ${r} 0 0 1 ${-r} ${r}
    h ${-(w - r * 2)}
    a ${r} ${r} 0 0 1 ${-r} ${-r}
    v ${-(h - r * 2)}
    a ${r} ${r} 0 0 1 ${r} ${-r}
    z
  `

  return (
    <>
      {/* Interactive blocker overlay with cut-out */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={skipTour}
        style={{ filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.2))' }}
      >
        <motion.path
          d={path}
          fill="rgba(0, 0, 0, 0.65)"
          fillRule="evenodd"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </svg>

      {/* Pulse ring indicating targeted item */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.5,
          ease: "easeInOut",
        }}
        style={{
          position: 'absolute',
          left: x - 2,
          top: y - 2,
          width: w + 4,
          height: h + 4,
          border: '2px solid rgba(59, 130, 246, 0.6)',
          borderRadius: `${r + 2}px`,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

// ─────────────────────────────────────────────
// Tour Content Component
// ─────────────────────────────────────────────
function TourContent() {
  const { steps, activeStep, activeStepData, nextStep, prevStep, skipTour, targetRect } = useTour()
  const [cardSize, setCardSize] = useState({ width: 320, height: 180 })
  const cardRef = useRef<HTMLDivElement>(null)



  // Track the actual rendered size of the card dynamically to prevent content overflow or magic number mismatch.
  // Using offsetWidth/offsetHeight gets the border-box size (including padding and border) without being affected by scale transforms.
  useEffect(() => {
    const cardEl = cardRef.current
    if (!cardEl) return

    const observer = new ResizeObserver(() => {
      setCardSize({
        width: cardEl.offsetWidth || 320,
        height: cardEl.offsetHeight || 180,
      })
    })
    observer.observe(cardEl)
    return () => observer.disconnect()
  }, [])

  // During AnimatePresence exit, the component renders one last frame after
  // the tour is deactivated. activeStepData may be undefined if the step
  // index is out of bounds — bail out to prevent the crash.
  if (!activeStepData) return null

  // Position calculation based on dynamic target and card dimensions.
  // Reads viewport dimensions inline at render time — this is fine because:
  // 1. targetRect already updates on resize (via ResizeObserver on documentElement)
  // 2. This component only renders during the active tour (not a hot path)
  const positionStyle = (() => {
    const vw = isSSR ? 1024 : window.innerWidth
    const vh = isSSR ? 768 : window.innerHeight

    if (vw < 768) {
      return {
        left: '16px',
        bottom: '16px',
        position: 'fixed' as const,
        width: 'calc(100% - 32px)',
      }
    }

    if (!targetRect) {
      return {
        left: `calc(50% - ${cardSize.width / 2}px)`,
        top: `calc(50% - ${cardSize.height / 2}px)`,
        position: 'fixed' as const,
      }
    }

    const pad = 16
    const viewportWidth = vw
    const viewportHeight = vh
    const cardWidth = cardSize.width
    const cardHeight = cardSize.height

    const isSidebarOrStage = targetRect.height > viewportHeight * 0.6

    if (isSidebarOrStage) {
      const targetCenter = targetRect.left + targetRect.width / 2
      const isLeft = targetCenter < viewportWidth / 2

      if (activeStepData.selector === '#tour-canvas-stage') {
        return {
          left: `${targetRect.left + (targetRect.width - cardWidth) / 2}px`,
          top: `${targetRect.top + pad}px`,
          position: 'absolute' as const,
        }
      }

      if (isLeft) {
        return {
          left: `${targetRect.right + pad}px`,
          top: `${targetRect.top + pad}px`,
          position: 'absolute' as const,
        }
      } else {
        return {
          left: `${targetRect.left - cardWidth - pad}px`,
          top: `${targetRect.top + pad}px`,
          position: 'absolute' as const,
        }
      }
    }

    let top = targetRect.bottom + pad
    let left = targetRect.left + (targetRect.width - cardWidth) / 2

    if (left < pad) {
      left = pad
    } else if (left + cardWidth > viewportWidth - pad) {
      left = viewportWidth - cardWidth - pad
    }

    if (top + cardHeight > viewportHeight) {
      top = targetRect.top - cardHeight - pad
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      position: 'absolute' as const,
    }
  })()

  const isLast = activeStep === steps.length - 1

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={positionStyle}
      className="w-full max-w-xs md:max-w-sm pointer-events-auto rounded-2xl border border-(--ms-border-strong) bg-(--ms-bg-elevated)/80 backdrop-blur-xl shadow-2xl p-5 select-none relative overflow-hidden"
    >
      {/* Aesthetic glowing highlight */}
      <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-purple-500/10 blur-xl pointer-events-none" />

      {/* Skip Button */}
      <button
        onClick={skipTour}
        className="absolute top-4 right-4 p-1 rounded-md text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors border-none bg-transparent cursor-pointer"
        title="Skip Tour"
      >
        <X size={15} />
      </button>

      {/* Content */}
      <div className="flex flex-col gap-3 relative z-10">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-3"
          >
            <header className="flex items-center gap-2">
              {!targetRect && (
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles size={13} className="animate-pulse" />
                </div>
              )}
              <h3 className="text-sm font-bold text-(--ms-text-primary) tracking-tight">
                {activeStepData.title}
              </h3>
            </header>

            <p className="text-xs text-(--ms-text-secondary) leading-relaxed">
              {activeStepData.content}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Footer actions */}
        <footer className="flex items-center justify-between mt-4 pt-3 border-t border-(--ms-border)">
          {/* Progress Indicator */}
          <div className="text-[10px] font-semibold text-(--ms-text-muted) tracking-wider uppercase">
            {activeStep + 1} of {steps.length}
          </div>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 text-[11px] font-medium text-(--ms-text-secondary) hover:text-(--ms-text-primary) px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer"
              >
                <ChevronLeft size={12} /> Back
              </button>
            )}

            <button
              onClick={nextStep}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-blue-600/15 hover:shadow-blue-600/25 transition-all cursor-pointer border-none"
            >
              {isLast ? 'Get Started' : 'Next'} <ChevronRight size={12} />
            </button>
          </div>
        </footer>
      </div>
    </motion.div>
  )
}

export const Tour = {
  Root: TourRoot,
  Spotlight: TourSpotlight,
  Content: TourContent,
}
