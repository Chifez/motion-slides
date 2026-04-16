/**
 * MotionSlides — Export Engine
 *
 * Records the presentation canvas as a WebM video using the
 * browser's MediaRecorder API. Works by programmatically walking
 * through each slide, waiting for transitions, and capturing frames.
 */

import { useEditorStore, type PlaybackSettings } from '../store/editorStore'

export type ExportFormat = 'webm' | 'pdf'

export interface ExportProgress {
  stage: 'preparing' | 'recording' | 'encoding' | 'done' | 'error'
  currentSlide: number
  totalSlides: number
  message: string
}

type ProgressCallback = (progress: ExportProgress) => void

// ─────────────────────────────────────────────
// WebM Video Export via MediaRecorder
// ─────────────────────────────────────────────

export async function exportAsVideo(
  onProgress: ProgressCallback,
): Promise<Blob | null> {
  const store = useEditorStore.getState()
  const project = store.activeProject()
  if (!project || project.slides.length === 0) return null

  const { playbackSettings } = store
  const { exportResolution, transitionDuration, autoplayDelay } = playbackSettings
  const totalSlides = project.slides.length

  onProgress({
    stage: 'preparing',
    currentSlide: 0,
    totalSlides,
    message: 'Setting up recording…',
  })

  // Find the canvas board element
  const canvasBoard = document.querySelector('[data-canvas-board]') as HTMLElement | null
  if (!canvasBoard) {
    onProgress({ stage: 'error', currentSlide: 0, totalSlides, message: 'Canvas not found' })
    return null
  }

  // Create an offscreen canvas to capture frames
  const canvas = document.createElement('canvas')
  canvas.width = exportResolution.width
  canvas.height = exportResolution.height
  const ctx = canvas.getContext('2d')!

  // Use canvas.captureStream for MediaRecorder
  const stream = canvas.captureStream(30) // 30fps
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5_000_000, // 5Mbps
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  // Start recording
  recorder.start(100) // flush every 100ms

  // Walk through slides
  store.setActiveSlide(0)

  // Wait for first render
  await sleep(500)

  for (let i = 0; i < totalSlides; i++) {
    onProgress({
      stage: 'recording',
      currentSlide: i + 1,
      totalSlides,
      message: `Recording slide ${i + 1} of ${totalSlides}…`,
    })

    store.setActiveSlide(i)

    // Wait for transition to complete
    await sleep(transitionDuration + 200)

    // Capture the current state of the canvas board into our canvas
    await captureFrame(canvasBoard, canvas, ctx, exportResolution)

    // Hold on this slide for the autoplay delay (the "dwell" time)
    const dwellTime = autoplayDelay
    const dwellFrames = Math.ceil((dwellTime / 1000) * 30)
    for (let f = 0; f < dwellFrames; f++) {
      await captureFrame(canvasBoard, canvas, ctx, exportResolution)
      await sleep(1000 / 30) // ~33ms per frame
    }
  }

  onProgress({
    stage: 'encoding',
    currentSlide: totalSlides,
    totalSlides,
    message: 'Encoding video…',
  })

  // Stop recording
  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      onProgress({ stage: 'done', currentSlide: totalSlides, totalSlides, message: 'Export complete!' })
      resolve(blob)
    }
    recorder.stop()
  })
}

// ─────────────────────────────────────────────
// Frame Capture Helper
// ─────────────────────────────────────────────

async function captureFrame(
  source: HTMLElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  resolution: { width: number; height: number },
) {
  try {
    // Use html-to-image approach: convert DOM to data URL then draw
    const { default: html2canvas } = await import('html2canvas')
    const screenshot = await html2canvas(source, {
      backgroundColor: '#0a0a0a',
      scale: resolution.width / source.offsetWidth,
      useCORS: true,
      logging: false,
    })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(screenshot, 0, 0, canvas.width, canvas.height)
  } catch {
    // Fallback: draw a black frame
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

// ─────────────────────────────────────────────
// Download helper
// ─────────────────────────────────────────────

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
