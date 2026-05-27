import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { DASHBOARD_STEPS, EDITOR_STEPS, type TourStep } from '@/store/slices/onboardingSlice'

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
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  const steps = onboardingTourType === 'dashboard' ? DASHBOARD_STEPS : onboardingTourType === 'editor' ? EDITOR_STEPS : []

  const activeStepData = steps[onboardingStep]

  // Track window resizing to update coordinates
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Find target element coordinates whenever step or window size changes
  useEffect(() => {
    if (!isOnboardingActive || !activeStepData || typeof window === 'undefined') {
      setTargetRect(null)
      return
    }

    if (!activeStepData.selector) {
      setTargetRect(null)
      return
    }

    const updateRect = () => {
      const element = document.querySelector(activeStepData.selector!)
      if (element) {
        setTargetRect(element.getBoundingClientRect())
        // Scroll into view if not visible
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else {
        setTargetRect(null)
      }
    }

    // Run calculation immediately
    updateRect()

    // If the step targets the AI Chat panel (#tour-ai-chat), the panel slides in with a 400ms transition.
    // We schedule a follow-up recalculation after 500ms once the animation settles.
    if (activeStepData.selector === '#tour-ai-chat') {
      const timer = setTimeout(updateRect, 500)
      return () => clearTimeout(timer)
    }
  }, [isOnboardingActive, onboardingStep, activeStepData, windowSize])

  if (!isOnboardingActive || steps.length === 0) return null

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
    <div className="fixed inset-0 z-[8000] pointer-events-none">
      <AnimatePresence>
        <TourSpotlight key="spotlight" context={contextValue} />
        <TourContent key="content" context={contextValue} />
      </AnimatePresence>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tour Spotlight Component
// ─────────────────────────────────────────────
interface SubComponentProps {
  context: TourContextValue
}

function TourSpotlight({ context }: SubComponentProps) {
  const { targetRect } = context
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDimensions({ width: window.innerWidth, height: window.innerHeight })
    
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // If no targetRect, we render a solid dark overlay with backdrop blur
  if (!targetRect) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        onClick={context.skipTour}
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

  // Create SVG path string for mask.
  // The first rectangle covers the whole screen.
  // The second subpath cuts a hole in the shape of a rounded rectangle.
  const path = `
    M 0 0
    h ${dimensions.width}
    v ${dimensions.height}
    h ${-dimensions.width}
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
        onClick={context.skipTour}
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
function TourContent({ context }: SubComponentProps) {
  const { steps, activeStep, activeStepData, nextStep, prevStep, skipTour, targetRect } = context

  // Position calculation
  const positionStyle = (() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return {
        left: '16px',
        bottom: '16px',
        position: 'fixed' as const,
        width: 'calc(100% - 32px)',
      }
    }

    if (!targetRect) {
      // Centered on screen (using calc to avoid framer-motion transform overrides)
      return {
        left: 'calc(50% - 160px)',
        top: 'calc(50% - 90px)',
        position: 'fixed' as const,
      }
    }

    const pad = 16
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const cardWidth = 320 // matches max-w-sm
    const cardHeight = 180

    // Check if the element is large (e.g. height spans most of the screen)
    const isSidebarOrStage = targetRect.height > viewportHeight * 0.6

    if (isSidebarOrStage) {
      const targetCenter = targetRect.left + targetRect.width / 2
      const isLeft = targetCenter < viewportWidth / 2

      // If it's the canvas stage (large, but spans the middle)
      if (activeStepData.selector === '#tour-canvas-stage') {
        return {
          left: `${targetRect.left + (targetRect.width - cardWidth) / 2}px`,
          top: `${targetRect.top + pad}px`,
          position: 'absolute' as const,
        }
      }

      if (isLeft) {
        // Position on the right side of the element, at the top
        return {
          left: `${targetRect.right + pad}px`,
          top: `${targetRect.top + pad}px`,
          position: 'absolute' as const,
        }
      } else {
        // Position on the left side of the element, at the top
        return {
          left: `${targetRect.left - cardWidth - pad}px`,
          top: `${targetRect.top + pad}px`,
          position: 'absolute' as const,
        }
      }
    }

    // Default: Try placing below target
    let top = targetRect.bottom + pad
    let left = targetRect.left + (targetRect.width - cardWidth) / 2

    // Bound checks
    if (left < pad) {
      left = pad
    } else if (left + cardWidth > viewportWidth - pad) {
      left = viewportWidth - cardWidth - pad
    }

    // If it falls off bottom, place above
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
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
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
