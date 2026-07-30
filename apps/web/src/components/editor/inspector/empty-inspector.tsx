import { memo } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { AudioRecorder } from '../audio/audio-recorder'
import { AudioTimelineEditor } from '../audio/audio-timeline-editor'
import { Music, Presentation, CheckSquare, Square } from 'lucide-react'

const sectionCls = "px-3 py-3 border-b border-(--ms-border)"

export const EmptyInspector = memo(function EmptyInspector() {
  const slide = useEditorStore(s => s.activeSlide())
  const updateSlide = useEditorStore(s => s.updateSlide)
  const playbackSettings = useEditorStore(s => s.playbackSettings)
  const updatePlaybackSettings = useEditorStore(s => s.updatePlaybackSettings)

  const handleSlideAudioChange = (newAudio: any) => {
    updateSlide({ audio: newAudio })
  }

  const handleSlideAudioUpdate = (updates: any) => {
    if (!slide || !slide.audio) return
    updateSlide({
      audio: {
        ...slide.audio,
        ...updates
      }
    })
  }

  const handleBackgroundMusicChange = (newAudio: any) => {
    updatePlaybackSettings({ backgroundMusic: newAudio })
  }

  const handleBackgroundMusicUpdate = (updates: any) => {
    if (!playbackSettings.backgroundMusic) return
    updatePlaybackSettings({
      backgroundMusic: {
        ...playbackSettings.backgroundMusic,
        ...updates
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className={sectionCls}>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-(--ms-text-muted) mb-1.5 block">
          Presentation Details
        </span>
        <h2 className="text-sm font-bold text-(--ms-text-primary)">
          {slide?.name || 'Selected Slide'}
        </h2>
      </div>

      {slide && (
        <div className={sectionCls}>
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2 font-medium">
            Slide Name
          </span>
          <input
            type="text"
            value={slide.name}
            onChange={(e) => updateSlide({ name: e.target.value })}
            className="w-full bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2.5 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition"
            placeholder="Slide Name"
          />
        </div>
      )}

      {slide && (
        <div className={sectionCls}>
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2 font-medium">
            Walkthrough Script / Captions
          </span>
          <textarea
            value={slide.script || ''}
            onChange={(e) => updateSlide({ script: e.target.value })}
            className="w-full bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-2.5 py-1.5 text-xs text-(--ms-text-primary) focus:outline-none focus:border-(--ms-accent) transition resize-none h-20 leading-relaxed font-medium"
            placeholder="Type captions for this step here..."
          />
        </div>
      )}

      {slide && (
        <div className={sectionCls}>
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider block mb-2 font-medium">
            Voice-Over Settings
          </span>
          <div className="space-y-3">
            <AudioRecorder
              existingAudio={slide.audio}
              onSave={handleSlideAudioChange}
            />
            {slide.audio && (
              <AudioTimelineEditor
                audio={slide.audio}
                onUpdate={handleSlideAudioUpdate}
              />
            )}
          </div>
        </div>
      )}

      <div className={sectionCls}>
        <div className="flex items-center gap-1.5 mb-2">
          <Music size={13} className="text-(--ms-text-muted)" />
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider font-semibold">
            Background Music
          </span>
        </div>
        
        <div className="space-y-3">
          <AudioRecorder
            existingAudio={playbackSettings.backgroundMusic}
            onSave={handleBackgroundMusicChange}
          />
          {playbackSettings.backgroundMusic && (
            <>
              <AudioTimelineEditor
                audio={playbackSettings.backgroundMusic}
                onUpdate={handleBackgroundMusicUpdate}
              />
              
              <div className="flex items-center justify-between p-2.5 bg-(--ms-bg-surface) border border-(--ms-border) rounded-lg shadow-sm">
                <div className="flex flex-col flex-1 pr-3">
                  <span className="text-xs font-semibold text-(--ms-text-primary)">
                    Auto-duck background music
                  </span>
                  <span className="text-[10px] text-(--ms-text-muted)">
                    Reduces volume by 80% when slide voice-over is playing
                  </span>
                </div>
                <button
                  onClick={() => updatePlaybackSettings({ duckBackgroundMusic: !playbackSettings.duckBackgroundMusic })}
                  className="text-(--ms-accent) hover:text-(--ms-accent)/90 transition-colors border-none bg-transparent cursor-pointer"
                >
                  {playbackSettings.duckBackgroundMusic ? (
                    <CheckSquare size={18} className="text-(--ms-accent)" />
                  ) : (
                    <Square size={18} className="text-(--ms-text-muted)" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={sectionCls}>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Presentation size={13} className="text-(--ms-text-muted)" />
          <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider font-semibold">
            Playback Preferences
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--ms-text-secondary)">Autoplay presentation</span>
            <button
              onClick={() => updatePlaybackSettings({ autoplay: !playbackSettings.autoplay })}
              className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer border-none ${
                playbackSettings.autoplay ? 'bg-(--ms-accent)' : 'bg-(--ms-border)'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  playbackSettings.autoplay ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {playbackSettings.autoplay && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--ms-text-secondary)">Slide Duration</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={Math.round(playbackSettings.autoplayDelay / 1000)}
                  onChange={(e) => updatePlaybackSettings({ autoplayDelay: Math.max(1, parseInt(e.target.value) || 3) * 1000 })}
                  className="w-12 bg-(--ms-bg-base)/50 border border-(--ms-border) rounded px-1.5 py-0.5 text-xs text-center text-(--ms-text-primary) focus:outline-none"
                />
                <span className="text-xs text-(--ms-text-muted)">sec</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-(--ms-text-secondary)">Loop presentation</span>
            <button
              onClick={() => updatePlaybackSettings({ loop: !playbackSettings.loop })}
              className={`w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer border-none ${
                playbackSettings.loop ? 'bg-(--ms-accent)' : 'bg-(--ms-border)'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  playbackSettings.loop ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
