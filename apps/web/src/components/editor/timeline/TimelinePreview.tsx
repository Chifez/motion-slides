import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Slide, PlaybackSettings, SlideTransition, Project } from '@motionslides/shared'
import { ScaledStage } from './ScaledStage'
import type { SlideWithTiming } from './types'

interface Props {
  liveSlide: Slide | null
  livePrevSlide: Slide | null
  playbackSettings: PlaybackSettings
  activeTransition: SlideTransition | null
  liveSlideIndex: number
  slides: Slide[]
  slidesWithTiming: SlideWithTiming[]
  setActiveSlide: (idx: number) => void
  setCurrentTime: (v: number) => void
  isMobile: boolean
  timelineTracksVisible: boolean
  setTimelineTracksVisible: (v: boolean) => void
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
}

/**
 * The preview area between the toolbar and the timeline tracks.
 * Contains: ambient glow, the screen frame with ScaledStage, corner accents,
 * slide indicator badge, slide dot-nav, and (mobile-only) Loop + Hide Tracks buttons.
 */
export function TimelinePreview({
  liveSlide,
  livePrevSlide,
  playbackSettings,
  activeTransition,
  liveSlideIndex,
  slides,
  slidesWithTiming,
  setActiveSlide,
  setCurrentTime,
  isMobile,
  timelineTracksVisible,
  setTimelineTracksVisible,
  activeProjectId,
  updateProject,
}: Props) {
  const toggleLoop = () => {
    if (!activeProjectId) return
    updateProject(activeProjectId, {
      playbackSettings: { ...playbackSettings, loop: !playbackSettings.loop },
    })
  }

  return (
    <div
      className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 py-4 relative"
      style={{ background: 'linear-gradient(to bottom, var(--ms-tl-bg), var(--ms-tl-surface))' }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[60%] h-[50%] rounded-full bg-violet-900/10 dark:bg-violet-900/10 blur-3xl" />
      </div>

      <div
        className="relative w-full max-w-3xl rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_25px_60px_rgba(0,0,0,0.6)] bg-black"
        style={{ aspectRatio: '16/9' }}
      >
        {liveSlide ? (
          <ScaledStage
            slide={liveSlide}
            previousSlide={livePrevSlide}
            settings={playbackSettings}
            activeTransition={activeTransition}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
            No slides yet
          </div>
        )}

        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-violet-500/40 rounded-tl-xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-violet-500/40 rounded-tr-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-violet-500/40 rounded-bl-xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-500/40 rounded-br-xl pointer-events-none" />

        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-white/50 px-2 py-0.5 rounded-md">
          {liveSlideIndex + 1} / {slides.length}
        </div>
      </div>

      {slides.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveSlide(idx)
                setCurrentTime(slidesWithTiming[idx]?.start ?? 0)
              }}
              className={`rounded-full border-none cursor-pointer transition-all ${
                idx === liveSlideIndex
                  ? 'w-5 h-1.5 bg-violet-500'
                  : 'w-1.5 h-1.5 hover:opacity-70'
              }`}
              style={idx !== liveSlideIndex ? { backgroundColor: 'var(--ms-tl-text-muted)' } : {}}
            />
          ))}
        </div>
      )}

      {isMobile && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={toggleLoop}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-all ${
              playbackSettings.loop
                ? 'bg-violet-600/20 border-violet-500/50 text-violet-500'
                : ''
            }`}
            style={!playbackSettings.loop ? {
              background: 'transparent',
              borderColor: 'var(--ms-tl-border-strong)',
              color: 'var(--ms-tl-text-muted)',
            } : {}}
          >
            Loop
          </button>

          <button
            onClick={() => setTimelineTracksVisible(!timelineTracksVisible)}
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer bg-transparent"
            style={{ borderColor: 'var(--ms-tl-border-strong)', color: 'var(--ms-tl-text-muted)' }}
          >
            {timelineTracksVisible ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {timelineTracksVisible ? 'Hide Tracks' : 'Show Tracks'}
          </button>
        </div>
      )}
    </div>
  )
}
