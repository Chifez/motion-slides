/**
 * MotionSlides — Export Engine (Optimized)
 *
 * Records the presentation canvas as a WebM video using the
 * browser's MediaRecorder API.
 */

import { useEditorStore } from '@/store/editorStore'
import { EXPORT_BITRATE, EXPORT_MIME_TYPE_VP9, EXPORT_MIME_TYPE_FALLBACK } from '@/constants/export'
import html2canvas from 'html2canvas'

export type ExportFormat = 'webm' | 'pdf'

export interface ExportProgress {
  stage: 'preparing' | 'recording' | 'encoding' | 'done' | 'error'
  currentSlide: number
  totalSlides: number
  message: string
}

type ProgressCallback = (progress: ExportProgress) => void

export async function exportAsVideo(
  onProgress: ProgressCallback,
): Promise<Blob | null> {
  const store = useEditorStore.getState()
  const project = store.activeProject()
  if (!project || project.slides.length === 0) return null

  const { playbackSettings } = store
  const { exportResolution, transitionDuration, autoplayDelay } = playbackSettings
  const totalSlides = project.slides.length

  onProgress({ stage: 'preparing', currentSlide: 0, totalSlides, message: 'Warming up engine…' })

  const canvasBoard = document.querySelector('[data-canvas-board]') as HTMLElement | null
  if (!canvasBoard) {
    onProgress({ stage: 'error', currentSlide: 0, totalSlides, message: 'Canvas source not found' })
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = exportResolution.width
  canvas.height = exportResolution.height
  const ctx = canvas.getContext('2d', { alpha: false })!

  const stream = canvas.captureStream(30)
  const mimeType = MediaRecorder.isTypeSupported(EXPORT_MIME_TYPE_VP9)
    ? EXPORT_MIME_TYPE_VP9
    : EXPORT_MIME_TYPE_FALLBACK

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: EXPORT_BITRATE })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  recorder.start()
  store.setActiveSlide(0)
  await sleep(1000)
  await captureFrame(canvasBoard, canvas, ctx, exportResolution)

  for (let i = 0; i < totalSlides; i++) {
    onProgress({ stage: 'recording', currentSlide: i + 1, totalSlides, message: `Processing slide ${i + 1}…` })

    if (i > 0) {
      store.setActiveSlide(i)
      const startTime = Date.now()
      while (Date.now() - startTime < transitionDuration) {
        await captureFrame(canvasBoard, canvas, ctx, exportResolution)
      }
    }

    await captureFrame(canvasBoard, canvas, ctx, exportResolution)

    onProgress({ stage: 'recording', currentSlide: i + 1, totalSlides, message: `Holding slide ${i + 1}…` })
    await sleep(autoplayDelay)
  }

  onProgress({ stage: 'encoding', currentSlide: totalSlides, totalSlides, message: 'Finalizing movie…' })

  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      onProgress({ stage: 'done', currentSlide: totalSlides, totalSlides, message: 'Export successful!' })
      resolve(blob)
    }
    recorder.stop()
  })
}

async function captureFrame(
  source: HTMLElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  resolution: { width: number; height: number },
) {
  try {
    const screenshot = await html2canvas(source, {
      backgroundColor: '#0a0a0a',
      scale: resolution.width / source.offsetWidth,
      useCORS: true,
      logging: false,
      imageTimeout: 0,
    })
    ctx.drawImage(screenshot, 0, 0, canvas.width, canvas.height)
  } catch (err) {
    console.error('Frame capture failed:', err)
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
