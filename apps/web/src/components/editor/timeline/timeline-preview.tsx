import { ChevronDown, ChevronUp } from 'lucide-react'
import { getCanvasDimensions, type Slide, type PlaybackSettings, type SlideTransition, type Project } from '@motionslides/shared'
import { ScaledStage } from './scaled-stage'
import { CaptionOverlay } from '../presentation/caption-overlay'
import { useEditorStore } from '@/store/editor-store'

interface Props {
  liveSlide: Slide | null
  livePrevSlide: Slide | null
  playbackSettings: PlaybackSettings
  activeTransition: SlideTransition | null
  liveSlideIndex: number
  slides: Slide[]
  captionsVisible: boolean
  isMobile: boolean
  timelineTracksVisible: boolean
  setTimelineTracksVisible: (v: boolean) => void
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
  currentTime: number
}

/**
 * Clean 16:9 / aspect-aware presentation preview stage above the timeline dock.
 */
export function TimelinePreview({
  liveSlide,
  livePrevSlide,
  playbackSettings,
  activeTransition,
  liveSlideIndex,
  slides,
  captionsVisible,
  isMobile,
  timelineTracksVisible,
  setTimelineTracksVisible,
  activeProjectId,
  updateProject,
  currentTime,
}: Props) {
  const project = useEditorStore(state => state.activeProject())
  const isPresenting = useEditorStore(state => state.isPresenting)
  const defaultDims = getCanvasDimensions(playbackSettings.aspectRatio)
  const stageW = liveSlide?.customWidth ?? defaultDims.width
  const stageH = liveSlide?.customHeight ?? defaultDims.height
  const ratio = stageW / Math.max(1, stageH)

  const toggleLoop = () => {
    if (!activeProjectId) return
    updateProject(activeProjectId, {
      playbackSettings: { ...playbackSettings, loop: !playbackSettings.loop },
    })
  }

  return (
    <div
      className="flex-1 min-h-[150px] flex flex-col items-center justify-center px-5 py-3 relative overflow-hidden"
      style={{ backgroundColor: 'var(--ms-tl-bg)' }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ containerType: 'size' }}
      >
        <div
          className="relative isolate rounded-lg overflow-hidden bg-black ring-1 ring-black/15 dark:ring-white/10 shadow-[0_18px_48px_rgba(0,0,0,0.38)]"
          style={{
            width: `min(100cqw, calc(100cqh * ${ratio}))`,
            height: `min(100cqh, calc(100cqw / ${ratio}))`,
          }}
        >
          {!isPresenting && liveSlide ? (
            <ScaledStage
              slide={liveSlide}
              previousSlide={livePrevSlide}
              settings={playbackSettings}
              activeTransition={activeTransition}
            />
          ) : !liveSlide ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">
              No slides yet
            </div>
          ) : null}

          {slides.length > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-sm border border-white/10 text-[10px] font-mono tabular-nums text-white/70 px-2 py-0.5 rounded-md pointer-events-none">
              {String(liveSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </div>
          )}

          {!isPresenting && captionsVisible && (
            <CaptionOverlay
              captions={project?.captions}
              currentTime={currentTime}
              className="absolute bottom-3 left-0 right-0 flex justify-center px-4 pointer-events-none scale-90 origin-bottom"
            />
          )}
        </div>
      </div>

      {isMobile && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleLoop}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] ${
              playbackSettings.loop
                ? 'border-(--ms-accent) text-(--ms-accent) bg-(--ms-accent)/10'
                : 'bg-(--ms-bg-surface) border-(--ms-tl-border-strong) text-(--ms-tl-text-muted)'
            }`}
          >
            Loop
          </button>

          <button
            type="button"
            onClick={() => setTimelineTracksVisible(!timelineTracksVisible)}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md border bg-(--ms-bg-surface) border-(--ms-tl-border-strong) text-(--ms-tl-text-muted) hover:text-(--ms-text-primary) transition-[color,transform] duration-150 active:scale-[0.97] cursor-pointer"
          >
            {timelineTracksVisible ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {timelineTracksVisible ? 'Hide Tracks' : 'Show Tracks'}
          </button>
        </div>
      )}
    </div>
  )
}
