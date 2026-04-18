/**
 * MotionSlides — Export Engine (Optimized)
 *
 * Records the presentation canvas as a WebM video using the
 * browser's MediaRecorder API.
 */

import { useEditorStore } from '@/store/editorStore'
import { EXPORT_BITRATE, EXPORT_MIME_TYPE_VP9, EXPORT_MIME_TYPE_FALLBACK } from '@/constants/export'
import { getCanvasDimensions } from '@/constants/canvas'
import * as htmlToImage from 'html-to-image'

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
  const { exportResolution, transitionDuration, autoplayDelay, aspectRatio } = playbackSettings
  const totalSlides = project.slides.length

  // Get the logical canvas dimensions for the current aspect ratio
  const canvasDims = getCanvasDimensions(aspectRatio)

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
  
  // High-fidelity warmup: wait for fonts and initial layout
  await document.fonts.ready
  await sleep(1500)
  await captureFrame(canvasBoard, canvas, ctx, exportResolution, canvasDims)

  for (let i = 0; i < totalSlides; i++) {
    onProgress({ stage: 'recording', currentSlide: i + 1, totalSlides, message: `Processing slide ${i + 1}…` })

    if (i > 0) {
      store.setActiveSlide(i)
      const startTime = Date.now()
      // Capture more frequently during transition for better frame density
      while (Date.now() - startTime < transitionDuration + 200) {
        await captureFrame(canvasBoard, canvas, ctx, exportResolution, canvasDims)
        await sleep(16) // Aim for ~60fps capture attempts
      }
    }

    await captureFrame(canvasBoard, canvas, ctx, exportResolution, canvasDims)

    onProgress({ stage: 'recording', currentSlide: i + 1, totalSlides, message: `Holding slide ${i + 1}…` })
    
    // During hold, we still need to capture some frames to keep the stream alive
    const holdStart = Date.now()
    while (Date.now() - holdStart < autoplayDelay) {
      await captureFrame(canvasBoard, canvas, ctx, exportResolution, canvasDims)
      await sleep(100)
    }
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
  canvasDims: { width: number; height: number },
) {
  try {
    const scaleFactor = resolution.width / canvasDims.width

    // html-to-image is much faster and more accurate for modern CSS/SVGs
    const screenshot = await htmlToImage.toCanvas(source, {
      width: canvasDims.width,
      height: canvasDims.height,
      pixelRatio: scaleFactor,
      skipAutoScale: true,
      backgroundColor: '#0a0a0a',
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
