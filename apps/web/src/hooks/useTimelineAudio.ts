import { useState, useCallback, useRef } from 'react'
import type { SlideAudio, Slide, PlaybackSettings, Project } from '@motionslides/shared'
import type { AudioKey, AudioDrawer } from '@/components/editor/timeline/types'
import { AUDIO_TYPE_VOICEOVER } from '@/components/editor/timeline/constants'

interface Params {
  slides: Slide[]
  playbackSettings: PlaybackSettings
  activeProjectId: string | null
  updateProject: (id: string, updates: Partial<Project>) => void
  liveSlideIndex: number
}

interface Result {
  selectedAudioKey: AudioKey | null
  setSelectedAudioKey: (key: AudioKey | null) => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
  audioDrawer: AudioDrawer
  setAudioDrawer: (drawer: AudioDrawer) => void
  selectedAudioInfo: SlideAudio | null
  saveVoiceover: (audio: SlideAudio | null) => void
  saveBgm: (audio: SlideAudio) => void
  updateSelectedAudio: (updates: Partial<SlideAudio>) => void
  deleteSelectedAudio: () => void
}

/**
 * Manages all audio clip selection, CRUD actions, and drawer state for the timeline.
 */
export function useTimelineAudio({
  slides,
  playbackSettings,
  activeProjectId,
  updateProject,
  liveSlideIndex,
}: Params): Result {
  const [selectedAudioKey, setSelectedAudioKey] = useState<AudioKey | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [audioDrawer, setAudioDrawer] = useState<AudioDrawer>(null)

  const liveSlideIndexRef = useRef(liveSlideIndex)
  liveSlideIndexRef.current = liveSlideIndex

  const selectedAudioInfo = selectedAudioKey
    ? selectedAudioKey.type === AUDIO_TYPE_VOICEOVER
      ? (slides.find(sl => sl.id === selectedAudioKey.slideId)?.audio || null)
      : (playbackSettings.backgroundMusic || null)
    : null

  const saveVoiceover = useCallback((audio: SlideAudio | null) => {
    const targetId = slides[liveSlideIndexRef.current]?.id
    if (!targetId || !activeProjectId) return
    updateProject(activeProjectId, {
      slides: slides.map(s => (s.id === targetId ? { ...s, audio } : s)),
      synced: false,
    })
    setAudioDrawer(null)
  }, [slides, activeProjectId, updateProject])

  const saveBgm = useCallback((audio: SlideAudio) => {
    if (!activeProjectId) return
    updateProject(activeProjectId, {
      playbackSettings: { ...playbackSettings, backgroundMusic: audio },
      synced: false,
    })
    setAudioDrawer(null)
  }, [activeProjectId, updateProject, playbackSettings])

  const updateSelectedAudio = useCallback((updates: Partial<SlideAudio>) => {
    if (!selectedAudioKey || !activeProjectId) return
    if (selectedAudioKey.type === AUDIO_TYPE_VOICEOVER) {
      const updatedSlides = slides.map(s => {
        if (s.id !== selectedAudioKey.slideId || !s.audio) return s
        return { ...s, audio: { ...s.audio, ...updates } }
      })
      updateProject(activeProjectId, { slides: updatedSlides, synced: false })
    } else {
      const currentBgm = playbackSettings.backgroundMusic
      if (currentBgm) {
        updateProject(activeProjectId, {
          playbackSettings: {
            ...playbackSettings,
            backgroundMusic: { ...currentBgm, ...updates },
          },
          synced: false,
        })
      }
    }
  }, [selectedAudioKey, slides, playbackSettings, activeProjectId, updateProject])

  const deleteSelectedAudio = useCallback(() => {
    if (!selectedAudioKey || !activeProjectId) return
    if (selectedAudioKey.type === AUDIO_TYPE_VOICEOVER) {
      updateProject(activeProjectId, {
        slides: slides.map(s =>
          s.id === selectedAudioKey.slideId ? { ...s, audio: null } : s,
        ),
        synced: false,
      })
    } else {
      updateProject(activeProjectId, {
        playbackSettings: { ...playbackSettings, backgroundMusic: null },
        synced: false,
      })
    }
    setSelectedAudioKey(null)
  }, [selectedAudioKey, slides, playbackSettings, activeProjectId, updateProject])

  return {
    selectedAudioKey,
    setSelectedAudioKey,
    inspectorOpen,
    setInspectorOpen,
    audioDrawer,
    setAudioDrawer,
    selectedAudioInfo,
    saveVoiceover,
    saveBgm,
    updateSelectedAudio,
    deleteSelectedAudio,
  }
}

