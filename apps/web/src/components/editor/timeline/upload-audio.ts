import type { SlideAudio } from '@motionslides/shared'

/**
 * Probes an uploaded audio file's duration, posts it to `/api/upload/audio`,
 * and returns a normalized `SlideAudio` record ready to save on a slide or track.
 */
export async function uploadTimelineAudioFile(
  file: File,
  defaults?: { volume?: number; loop?: boolean },
): Promise<SlideAudio> {
  const tempUrl = URL.createObjectURL(file)
  const duration = await new Promise<number>(resolve => {
    const audio = new Audio(tempUrl)
    const cleanup = (value: number) => {
      URL.revokeObjectURL(tempUrl)
      resolve(Number.isFinite(value) && value > 0 ? value : 0)
    }
    audio.addEventListener('loadedmetadata', () => cleanup(audio.duration), { once: true })
    audio.addEventListener('error', () => cleanup(0), { once: true })
  })

  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('duration', duration.toString())

  const res = await fetch('/api/upload/audio', { method: 'POST', body: formData })
  if (!res.ok) {
    throw new Error('Failed to upload audio file.')
  }

  const data = (await res.json()) as {
    url: string
    fileName?: string
    duration?: number
  }
  const resolvedDuration = data.duration || duration || 1

  return {
    id: Math.random().toString(36).substring(2, 9),
    url: data.url,
    fileName: data.fileName || file.name,
    duration: resolvedDuration,
    volume: defaults?.volume ?? 1,
    loop: defaults?.loop ?? false,
    playbackRate: 1,
    trimStart: 0,
    trimEnd: resolvedDuration,
  }
}
