import { useState, useMemo, useCallback } from 'react'
import type { SlideAudio } from '@motionslides/shared'
import type { AudioKey, AudioDrawer } from '@/components/editor/timeline/types'
import { AUDIO_TYPE_VOICEOVER } from '@/components/editor/timeline/constants'

interface Params {
  slides: any[]
  playbackSettings: any
  activeProjectId: string | null
  updateProject: (id: string, updates: any) => void
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

  const selectedAudioInfo = useMemo<SlideAudio | null>(() => {
    if (!selectedAudioKey) return null
    if (selectedAudioKey.type === AUDIO_TYPE_VOICEOVER) {
      return slides.find(sl => sl.id === selectedAudioKey.slideId)?.audio || null
    }
    return playbackSettings.backgroundMusic || null
  }, [selectedAudioKey, slides, playbackSettings])

  const saveVoiceover = useCallback(
    (audio: SlideAudio | null) => {
      const targetId = slides[liveSlideIndex]?.id
      if (!targetId || !activeProjectId) return
      updateProject(activeProjectId, {
        slides: slides.map(s => (s.id === targetId ? { ...s, audio } : s)),
        synced: false,
      })
      setAudioDrawer(null)
    },
    [slides, liveSlideIndex, activeProjectId, updateProject],
  )

  const saveBgm = useCallback(
    (audio: SlideAudio) => {
      if (!activeProjectId) return
      updateProject(activeProjectId, {
        playbackSettings: { ...playbackSettings, backgroundMusic: audio },
        synced: false,
      })
      setAudioDrawer(null)
    },
    [activeProjectId, playbackSettings, updateProject],
  )

  const updateSelectedAudio = useCallback(
    (updates: Partial<SlideAudio>) => {
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
    },
    [selectedAudioKey, activeProjectId, slides, playbackSettings, updateProject],
  )

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
  }, [selectedAudioKey, activeProjectId, slides, playbackSettings, updateProject])

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
