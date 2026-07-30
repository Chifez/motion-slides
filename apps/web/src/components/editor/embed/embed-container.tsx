import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useLoaderData } from '@tanstack/react-router'
import { useEditorStore } from '@/store/editor-store'
import { MotionStage } from '@/components/editor/motion-stage'
import { getCanvasDimensions } from '@motionslides/shared'
import { useAutoplay } from '@/hooks/use-autoplay'
import { useEmbedProject } from '@/hooks/use-embed-project'
import { useEmbedCanvasScale } from '@/hooks/use-embed-canvas-scale'
import { EmbedPreviewControls } from './embed-preview-controls'
import { EmbedFooter } from './embed-footer'
import type { Project } from '@motionslides/shared'

interface LoaderData {
  project: Project | null
  accessDenied?: boolean
}

export interface EmbedSettings {
  theme: 'dark' | 'light'
  autoplay: boolean
  loop: boolean
  controls: boolean
}

export interface EmbedContainerProps {
  project?: Project
  isPreview?: boolean
  previewSettings?: EmbedSettings
}

function parseSearchParams(): EmbedSettings {
  try {
    const p = new URLSearchParams(window.location.search)
    return {
      theme: (p.get('theme') as 'dark' | 'light') ?? 'dark',
      autoplay: p.get('autoplay') !== 'false',
      loop: p.get('loop') !== 'false',
      controls: p.get('controls') !== 'false',
    }
  } catch {
    return { theme: 'dark', autoplay: true, loop: true, controls: true }
  }
}

function useEmbedSettings(previewSettings?: EmbedSettings): EmbedSettings {
  return useMemo(
    () => previewSettings ?? parseSearchParams(),
    [
      previewSettings?.theme,
      previewSettings?.autoplay,
      previewSettings?.loop,
      previewSettings?.controls,
    ],
  )
}

function useActiveTransitions(project: Project | undefined) {
  const activeSlideIndex = useEditorStore(s => s.activeSlideIndex)
  const previousSlideIndex = useEditorStore(s => s.previousSlideIndex)

  return useMemo(() => {
    const empty = { activeTransition: null, clickTransition: null, autoTransition: null }
    if (!project) return empty

    const currentSlide = project.slides[activeSlideIndex]
    if (!currentSlide) return empty

    const prevSlide =
      previousSlideIndex !== null ? (project.slides[previousSlideIndex] ?? null) : null
    const transitions = project.transitions ?? []

    const activeTransition = prevSlide
      ? (transitions.find(
        t => t.fromSlideId === prevSlide.id && t.toSlideId === currentSlide.id,
      ) ?? null)
      : null

    const outgoing = transitions.filter(t => t.fromSlideId === currentSlide.id)

    return {
      activeTransition,
      clickTransition: outgoing.find(t => t.trigger === 'click') ?? null,
      autoTransition: outgoing.find(t => t.trigger === 'auto') ?? null,
    }
  }, [project, activeSlideIndex, previousSlideIndex])
}

export function EmbedContainer({
  project: propProject,
  isPreview = false,
  previewSettings,
}: EmbedContainerProps = {}) {
  const loaderData = useLoaderData({ strict: false }) as unknown as LoaderData
  const { projectId } = useParams({ strict: false })

  const settings = useEmbedSettings(previewSettings)
  const { theme, autoplay: isAutoplay, loop: isLoop, controls: showControls } = settings

  // Load and manage project state using custom hook
  const {
    project,
    activeSlideIndex,
    previousSlideIndex,
    playbackSettings,
    setActiveSlide
  } = useEmbedProject({
    projectId,
    propProject,
    loaderProject: loaderData?.project
  })

  const totalSlides = project?.slides.length ?? 0
  const activeSlide = project?.slides[activeSlideIndex] ?? null
  const previousSlide =
    previousSlideIndex !== null ? (project?.slides[previousSlideIndex] ?? null) : null

  const { activeTransition, clickTransition, autoTransition } = useActiveTransitions(project)

  // Autoplay state
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const isAutoplayActive = isAutoplay && !autoplayPaused

  // Navigation
  const handleNext = useCallback(() => {
    if (clickTransition) {
      const idx = project?.slides.findIndex(s => s.id === clickTransition.toSlideId) ?? -1
      if (idx !== -1) setActiveSlide(idx)
      return
    }
    const { activeSlideIndex: idx } = useEditorStore.getState()
    if (idx < totalSlides - 1) setActiveSlide(idx + 1)
    else if (isLoop) setActiveSlide(0)
  }, [clickTransition, project?.slides, totalSlides, isLoop, setActiveSlide])

  const handlePrev = useCallback(() => {
    const { activeSlideIndex: idx } = useEditorStore.getState()
    if (idx > 0) setActiveSlide(idx - 1)
  }, [setActiveSlide])

  // Keyboard navigation
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

  // Autoplay timing
  const entranceDuration = activeTransition?.duration ?? playbackSettings.transitionDuration
  const configuredSlideDuration = autoTransition
    ? (autoTransition.autoDelay ?? 0)
    : playbackSettings.autoplayDelay
  const autoplayDelay = configuredSlideDuration + entranceDuration

  useAutoplay(
    isAutoplayActive,
    autoplayDelay,
    () => {
      if (autoTransition) {
        const idx = project?.slides.findIndex(s => s.id === autoTransition.toSlideId) ?? -1
        if (idx !== -1) setActiveSlide(idx)
        return
      }
      const { activeSlideIndex: idx } = useEditorStore.getState()
      if (idx < totalSlides - 1) {
        const target =
          clickTransition
            ? (project?.slides.findIndex(s => s.id === clickTransition.toSlideId) ?? -1)
            : -1
        setActiveSlide(target !== -1 ? target : idx + 1)
      } else if (isLoop) {
        setActiveSlide(0)
      } else {
        setAutoplayPaused(true)
      }
    },
    [activeSlideIndex, isAutoplayActive, autoTransition, clickTransition, project?.slides, totalSlides, isLoop],
  )

  // Previous slide transition cleanup
  useEffect(() => {
    if (previousSlideIndex === null) return
    const transitionDuration = activeTransition?.duration ?? playbackSettings.transitionDuration
    const timer = setTimeout(() => {
      useEditorStore.setState({ previousSlideIndex: null })
    }, transitionDuration + 50)

    return () => clearTimeout(timer)
  }, [activeSlideIndex, previousSlideIndex, activeTransition, playbackSettings.transitionDuration])

  // Canvas dimensions
  const defaultDims = useMemo(
    () => getCanvasDimensions(playbackSettings.aspectRatio),
    [playbackSettings.aspectRatio],
  )
  const canvasW = activeSlide?.customWidth ?? defaultDims.width
  const canvasH = activeSlide?.customHeight ?? defaultDims.height

  // Scale to fit container using custom hook (attached directly to viewport container)
  const { scale, containerRef } = useEmbedCanvasScale({
    canvasW,
    canvasH
  })

  // Background derived from active slide
  const bg = activeSlide?.background ?? '#0a0a0a'
  const isImageBg = bg.startsWith('url')

  // Loading state
  if (!project || !activeSlide) {
    return (
      <div
        className={`${isPreview ? 'w-full h-full' : 'w-screen h-screen'} flex items-center justify-center ${theme === 'light' ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-950 text-zinc-600'}`}
      >
        <div className="animate-pulse text-xs font-medium uppercase tracking-wider">
          Loading Presentation...
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${isPreview ? 'w-full h-full' : 'w-screen h-screen'} flex flex-col items-center justify-between overflow-hidden select-none relative ${
        theme === 'light' ? 'bg-zinc-100' : 'bg-black'
      }`}
    >
      {/* Canvas viewport */}
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden relative"
      >
        <div
          style={{
            width: canvasW,
            height: canvasH,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            backgroundColor: isImageBg ? 'transparent' : bg,
            backgroundImage: isImageBg ? bg : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            flexShrink: 0,
          }}
          className="relative shadow-2xl"
        >
          <MotionStage
            mode="presentation"
            slide={activeSlide}
            previousSlide={previousSlide}
            settings={playbackSettings}
            activeTransition={activeTransition}
          />

          {/* Preview overlays */}
          {isPreview && (
            <EmbedPreviewControls
              totalSlides={totalSlides}
              activeSlideIndex={activeSlideIndex}
              showControls={showControls}
              theme={theme}
              onSelectSlide={setActiveSlide}
            />
          )}
        </div>
      </div>

      {/* Full-embed control bar */}
      {!isPreview && showControls && (
        <EmbedFooter
          theme={theme}
          isAutoplay={isAutoplay}
          autoplayPaused={autoplayPaused}
          activeSlideIndex={activeSlideIndex}
          totalSlides={totalSlides}
          isLoop={isLoop}
          onToggleAutoplay={() => setAutoplayPaused(p => !p)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  )
}
