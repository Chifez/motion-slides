import type { SlideAudio } from '@motionslides/shared'

async function probeAudioDuration(file: File, fallbackDuration?: number): Promise<number> {
  const tempUrl = URL.createObjectURL(file)
  const htmlDuration = await new Promise<number>(resolve => {
    const audio = new Audio(tempUrl)
    const cleanup = (value: number) => {
      URL.revokeObjectURL(tempUrl)
      resolve(Number.isFinite(value) && value > 0 ? value : 0)
    }
    audio.addEventListener('loadedmetadata', () => cleanup(audio.duration), { once: true })
    audio.addEventListener('error', () => cleanup(0), { once: true })
  })

  if (htmlDuration > 0) return htmlDuration

  // Chrome emits duration === Infinity on freshly recorded MediaRecorder WebM blobs;
  // decode via Web Audio API so we obtain the exact sample-accurate duration.
  let audioCtx: AudioContext | null = null
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
      const arrayBuffer = await file.arrayBuffer()
      const decoded = await audioCtx.decodeAudioData(arrayBuffer)
      if (Number.isFinite(decoded.duration) && decoded.duration > 0) {
        return decoded.duration
      }
    }
  } catch {
    // Ignore decode errors and fall through to elapsed recording duration fallback
  } finally {
    if (audioCtx) {
      try {
        await audioCtx.close()
      } catch {}
    }
  }

  return fallbackDuration && Number.isFinite(fallbackDuration) && fallbackDuration > 0
    ? fallbackDuration
    : 0
}

/**
 * Probes an audio file's duration, posts it to `/api/upload/audio`,
 * and returns a normalized `SlideAudio` record ready to save on a slide or track.
 */
export async function uploadTimelineAudioFile(
  file: File,
  defaults?: { volume?: number; loop?: boolean; fallbackDuration?: number },
): Promise<SlideAudio> {
  const duration = await probeAudioDuration(file, defaults?.fallbackDuration)

  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('duration', duration.toString())

  const res = await fetch('/api/upload/audio', { method: 'POST', body: formData })
  if (!res.ok) {
    let errorMessage = 'Failed to upload audio file.'
    try {
      const errBody = (await res.json()) as { error?: string }
      if (errBody?.error) errorMessage = errBody.error
    } catch {}
    throw new Error(errorMessage)
  }

  const data = (await res.json()) as {
    url: string
    fileName?: string
    duration?: number
  }
  const serverDuration =
    typeof data.duration === 'number' && Number.isFinite(data.duration) && data.duration > 0
      ? data.duration
      : 0
  const resolvedDuration = serverDuration || duration || defaults?.fallbackDuration || 1

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
