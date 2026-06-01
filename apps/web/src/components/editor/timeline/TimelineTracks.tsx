import type { SlideAudio } from '@motionslides/shared'
import {
  PX_PER_SEC,
  RULER_H,
  SLIDE_TRACK_H,
  VO_TRACK_H,
  BGM_TRACK_H,
  AUDIO_TYPE_BGM,
  BGM_LABEL,
  VO_LABEL_PREFIX,
  BGM_ACCENT_COLOR,
  VO_ACCENT_COLOR,
} from './constants'
import type { AudioKey, AudioDrawer, SlideWithTiming } from './types'
import { AudioInspector } from './AudioInspector'
import { AudioDrawerModal } from './AudioDrawerModal'
import { TrackLabelColumn } from './TrackLabelColumn'
import { RulerRow } from './RulerRow'
import { SlideTrackRow } from './SlideTrackRow'
import { VoiceoverTrackRow } from './VoiceoverTrackRow'
import { BgmTrackRow } from './BgmTrackRow'

interface AudioState {
  selectedAudioKey: AudioKey | null
  setSelectedAudioKey: (key: AudioKey | null) => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
  selectedAudioInfo: SlideAudio | null
  audioDrawer: AudioDrawer
  setAudioDrawer: (drawer: AudioDrawer) => void
  saveVoiceover: (audio: SlideAudio) => void
  saveBgm: (audio: SlideAudio) => void
  updateSelectedAudio: (updates: Partial<SlideAudio>) => void
  deleteSelectedAudio: () => void
}

interface Props {
  timelineBodyRef: React.RefObject<HTMLDivElement>
  slidesWithTiming: SlideWithTiming[]
  totalDuration: number
  currentTime: number
  liveSlideIndex: number
  slides: any[]
  playbackSettings: any
  activeProjectId: string | null
  updateProject: (id: string, updates: any) => void
  setActiveSlide: (idx: number) => void
  setCurrentTime: (v: number) => void
  audio: AudioState
  handleRulerMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
  handleSlideResizeMouseDown: (e: React.MouseEvent, slideId: string, duration: number) => void
}

export function TimelineTracks({
  timelineBodyRef,
  slidesWithTiming,
  totalDuration,
  currentTime,
  liveSlideIndex,
  slides,
  playbackSettings,
  activeProjectId,
  updateProject,
  setActiveSlide,
  setCurrentTime,
  audio,
  handleRulerMouseDown,
  handleSlideResizeMouseDown,
}: Props) {
  const timelineWidth = Math.max(900, Math.ceil(totalDuration) * PX_PER_SEC + PX_PER_SEC)

  return (
    <div
      className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0c] overflow-hidden relative"
      style={{ height: `${RULER_H + SLIDE_TRACK_H + VO_TRACK_H + BGM_TRACK_H + 1}px` }}
    >
      <div className="flex h-full max-w-6xl mx-auto w-full">

        <TrackLabelColumn
          audioDrawer={audio.audioDrawer}
          setAudioDrawer={audio.setAudioDrawer}
          liveSlideIndex={liveSlideIndex}
        />

        <AudioDrawerModal
          audioDrawer={audio.audioDrawer}
          liveSlideIndex={liveSlideIndex}
          existingVoiceover={slides[liveSlideIndex]?.audio ?? null}
          onSaveVoiceover={audio.saveVoiceover}
          onSaveBgm={audio.saveBgm}
          onClose={() => audio.setAudioDrawer(null)}
        />

        {audio.inspectorOpen && audio.selectedAudioInfo && (
          <AudioInspector
            audioInfo={audio.selectedAudioInfo}
            label={
              audio.selectedAudioKey?.type === AUDIO_TYPE_BGM
                ? BGM_LABEL
                : `${VO_LABEL_PREFIX} ${slides.findIndex(s => s.id === (audio.selectedAudioKey as any)?.slideId) + 1}`
            }
            accentColor={audio.selectedAudioKey?.type === AUDIO_TYPE_BGM ? BGM_ACCENT_COLOR : VO_ACCENT_COLOR}
            onUpdate={audio.updateSelectedAudio}
            onDelete={() => { audio.deleteSelectedAudio(); audio.setInspectorOpen(false) }}
            onClose={() => audio.setInspectorOpen(false)}
          />
        )}

        <div className="flex-1 overflow-hidden relative border-l border-white/[0.10]">
          <div
            ref={timelineBodyRef}
            className="w-full h-full overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
          >
            <div className="relative flex flex-col" style={{ width: timelineWidth, height: '100%' }}>
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-none"
                style={{
                  left: `${currentTime * PX_PER_SEC}px`,
                  width: '1px',
                  background: 'rgba(239,68,68,0.9)',
                  boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                }}
              >
                <div className="absolute -top-0.5 -left-[5px] w-2.5 h-2.5 bg-red-500 rotate-45 shadow-md" />
              </div>

              <RulerRow totalDuration={totalDuration} onMouseDown={handleRulerMouseDown} />

              <SlideTrackRow
                slidesWithTiming={slidesWithTiming}
                liveSlideIndex={liveSlideIndex}
                onSlideResizeMouseDown={handleSlideResizeMouseDown}
                onSlideClick={(idx, start) => { setActiveSlide(idx); setCurrentTime(start) }}
              />

              <VoiceoverTrackRow
                slidesWithTiming={slidesWithTiming}
                slides={slides}
                selectedAudioKey={audio.selectedAudioKey}
                setSelectedAudioKey={audio.setSelectedAudioKey}
                setInspectorOpen={audio.setInspectorOpen}
                activeProjectId={activeProjectId}
                updateProject={updateProject}
              />

              <BgmTrackRow
                backgroundMusic={playbackSettings.backgroundMusic}
                totalDuration={totalDuration}
                selectedAudioKey={audio.selectedAudioKey}
                setSelectedAudioKey={audio.setSelectedAudioKey}
                setInspectorOpen={audio.setInspectorOpen}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
