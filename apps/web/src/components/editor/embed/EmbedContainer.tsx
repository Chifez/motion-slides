import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useLoaderData, Link } from '@tanstack/react-router'
import { Play, Pause, ChevronRight, ChevronLeft } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { MotionStage } from '@/components/editor/MotionStage'
import { getCanvasDimensions } from '@motionslides/shared'
import { useAutoplay } from '@/hooks/useAutoplay'
import { Logo } from '@/components/ui/Logo'
import type { Project } from '@motionslides/shared'

interface LoaderData {
  project: Project | null
  accessDenied?: boolean
}

// Define specific AccessControl context for the embed page
const EMBED_ACCESS = {
  mode: 'present' as const,
  canEdit: false,
  isReadOnly: true,
  autoplay: false,
  isAuthenticated: true,
  isDenied: false,
  isPending: false,
}

export function EmbedContainer() {
  const loaderData = useLoaderData({ strict: false }) as unknown as LoaderData
  const loaderProject = loaderData?.project
  const { projectId } = useParams({ strict: false })

  // Find or load the project inside the store
  const project = useEditorStore(state => state.projects.find(p => p.id === projectId))
  const importProject = useEditorStore(state => state.importProject)
  const loadProject = useEditorStore(state => state.loadProject)

  const initializedProjectIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (projectId && initializedProjectIdRef.current === projectId) return

    if (loaderProject) {
      importProject(loaderProject)
    }
    if (projectId) {
      loadProject(projectId)
      initializedProjectIdRef.current = projectId
    }
  }, [projectId, loaderProject, importProject, loadProject])

  // Get Route search parameters with safe fallback defaults
  const search = useMemo(() => {
    // Read route search using window search params as fallback if not in TanStack route context
    try {
      const urlParams = new URLSearchParams(window.location.search)
      return {
        theme: urlParams.get('theme') || 'dark',
        autoplay: urlParams.get('autoplay') || 'true',
        loop: urlParams.get('loop') || 'true',
        controls: urlParams.get('controls') || 'true',
      }
    } catch {
      return { theme: 'dark', autoplay: 'true', loop: 'true', controls: 'true' }
    }
  }, [])

  const { theme, autoplay, loop, controls } = search
  const isAutoplay = autoplay === 'true'
  const isLoop = loop !== 'false'
  const showControls = controls !== 'false'

  // Retrieve active slide details from editor store
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const previousSlideIndex = useEditorStore(s => s.previousSlideIndex)
  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const setActiveSlide = useEditorStore(s => s.setActiveSlide)

  // Reset to first slide on initial mount
  useEffect(() => {
    setActiveSlide(0)
  }, [setActiveSlide])

  const totalSlides = project?.slides.length ?? 0
  const activeSlide = project?.slides[activeSlideIndex] ?? null
  const previousSlide = previousSlideIndex !== null ? (project?.slides[previousSlideIndex] ?? null) : null

  const { activeTransition, clickTransition, autoTransition } = useMemo(() => {
    if (!project) return { activeTransition: null, clickTransition: null, autoTransition: null }

    const currentSlide = project.slides[activeSlideIndex]
    const prevSlide = previousSlideIndex !== null ? (project.slides[previousSlideIndex] ?? null) : null

    if (!currentSlide) return { activeTransition: null, clickTransition: null, autoTransition: null }

    const transitions = project.transitions ?? []
    const activeTransition = prevSlide 
      ? transitions.find(t => t.fromSlideId === prevSlide.id && t.toSlideId === currentSlide.id) ?? null
      : null

    const outgoing = transitions.filter(t => t.fromSlideId === currentSlide.id)

    return {
      activeTransition,
      clickTransition: outgoing.find(t => t.trigger === 'click') ?? null,
      autoTransition: outgoing.find(t => t.trigger === 'auto') ?? null
    }
  }, [project, activeSlideIndex, previousSlideIndex])

  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const isAutoplayActive = isAutoplay && !autoplayPaused

  const handleNext = useCallback(() => {
    if (clickTransition) {
      const targetIndex = project?.slides.findIndex(s => s.id === clickTransition.toSlideId) ?? -1
      if (targetIndex !== -1) setActiveSlide(targetIndex)
    } else {
      if (activeSlideIndex < totalSlides - 1) setActiveSlide(activeSlideIndex + 1)
      else if (isLoop) setActiveSlide(0)
    }
  }, [clickTransition, project?.slides, activeSlideIndex, totalSlides, isLoop, setActiveSlide])

  const handlePrev = useCallback(() => {
    if (activeSlideIndex > 0) setActiveSlide(activeSlideIndex - 1)
  }, [activeSlideIndex, setActiveSlide])

  // Handle Keyboard Navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext, handlePrev])

  // Slide Autoplay Timing
  const entranceDuration = activeTransition?.duration ?? playbackSettings.transitionDuration
  const configuredSlideDuration = autoTransition
    ? (autoTransition.autoDelay ?? 0)
    : playbackSettings.autoplayDelay
  const autoplayDelay = configuredSlideDuration + entranceDuration
  const shouldAutoplay = isAutoplayActive && (!clickTransition)

  useAutoplay(
    shouldAutoplay,
    autoplayDelay,
    () => {
      if (autoTransition) {
        const targetIndex = project?.slides.findIndex(s => s.id === autoTransition.toSlideId) ?? -1
        if (targetIndex !== -1) setActiveSlide(targetIndex)
      } else {
        const { activeSlideIndex: idx } = useEditorStore.getState()
        if (idx < totalSlides - 1) setActiveSlide(idx + 1)
        else if (isLoop) setActiveSlide(0)
        else setAutoplayPaused(true)
      }
    },
    [activeSlideIndex, isAutoplayActive, autoTransition, project?.slides, totalSlides],
  )

  // Clear transition previous slide after duration ms + 50ms buffer
  useLayoutEffect(() => {
    if (previousSlideIndex === null) return

    const durationMs = activeTransition?.duration ?? playbackSettings.transitionDuration
    const timer = setTimeout(() => {
      useEditorStore.setState({ previousSlideIndex: null })
    }, durationMs + 50)

    return () => clearTimeout(timer)
  }, [activeSlideIndex, previousSlideIndex, activeTransition, playbackSettings.transitionDuration])

  // Scale computation to fit iframe stage
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const { width: canvasW, height: canvasH } = useMemo(() => {
    return getCanvasDimensions(playbackSettings.aspectRatio)
  }, [playbackSettings.aspectRatio])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      const controlsHeight = showControls ? 44 : 0
      const availableH = h - controlsHeight
      setScale(Math.min(w / canvasW, availableH / canvasH))
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [canvasW, canvasH, showControls])

  if (!project || !activeSlide) {
    return (
      <div className={`w-screen h-screen flex items-center justify-center ${theme === 'light' ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-950 text-zinc-600'}`}>
        <div className="animate-pulse text-xs font-medium uppercase tracking-wider">Loading Presentation...</div>
      </div>
    )
  }

  const embedThemeClass = theme === 'light' 
    ? 'bg-zinc-50 border-zinc-200 text-zinc-800' 
    : 'bg-[#09090b] border-zinc-900 text-zinc-200'

  return (
    <div
      ref={containerRef}
      className={`w-screen h-screen flex flex-col items-center justify-center overflow-hidden select-none relative ${
        theme === 'light' ? 'bg-zinc-100' : 'bg-black'
      }`}
    >
      {/* Canvas Slide Viewport */}
      <div
        style={{
          width: canvasW,
          height: canvasH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          backgroundColor: (activeSlide.background || '#0a0a0a').startsWith('url') ? 'transparent' : (activeSlide.background || '#0a0a0a'),
          backgroundImage: (activeSlide.background || '#0a0a0a').startsWith('url') ? activeSlide.background : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        className="relative shadow-2xl flex-shrink-0"
      >
        <MotionStage
          mode="presentation"
          slide={activeSlide}
          previousSlide={previousSlide}
          settings={playbackSettings}
          activeTransition={activeTransition}
        />
      </div>

      {/* Control Bar overlay at the bottom */}
      {showControls && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-[44px] border-t backdrop-blur-md flex items-center justify-between px-4 z-50 transition-colors ${embedThemeClass}`}
        >
          {/* Controls buttons */}
          <div className="flex items-center gap-2">
            {isAutoplay && (
              <button
                onClick={() => setAutoplayPaused(!autoplayPaused)}
                className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
                  theme === 'light' ? 'hover:bg-zinc-200/50 text-zinc-600 hover:text-zinc-900' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
                }`}
                title={autoplayPaused ? 'Play autoplay' : 'Pause autoplay'}
              >
                {autoplayPaused ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}

            <button
              onClick={handlePrev}
              disabled={activeSlideIndex === 0}
              className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
                activeSlideIndex === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : theme === 'light' ? 'hover:bg-zinc-200/50 text-zinc-600 hover:text-zinc-900' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
              }`}
            >
              <ChevronLeft size={15} />
            </button>

            <span className={`text-[10px] font-bold min-w-8 text-center select-none ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {activeSlideIndex + 1} / {totalSlides}
            </span>

            <button
              onClick={handleNext}
              disabled={!isLoop && activeSlideIndex === totalSlides - 1}
              className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
                !isLoop && activeSlideIndex === totalSlides - 1 
                  ? 'opacity-30 cursor-not-allowed' 
                  : theme === 'light' ? 'hover:bg-zinc-200/50 text-zinc-600 hover:text-zinc-900' : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'
              }`}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Branding Logo */}
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-1.5 no-underline opacity-80 hover:opacity-100 transition-opacity"
          >
            <Logo size={18} />
            <span className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
              MotionSlides
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
