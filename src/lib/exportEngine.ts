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

  const canvasBoard = document.querySelector('[data-canvas-board]') as HTMLElement | null
  if (!canvasBoard) {
    onProgress({ stage: 'error', currentSlide: 0, totalSlides, message: 'Canvas not found' })
    return null
  }

  // ✅ FIX 1: Import html2canvas once, not on every frame
  const { default: html2canvas } = await import('html2canvas')

  const canvas = document.createElement('canvas')
  canvas.width = exportResolution.width
  canvas.height = exportResolution.height
  const ctx = canvas.getContext('2d')!

  const stream = canvas.captureStream(30)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 20_000_000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  recorder.start(100)
  store.setActiveSlide(0)
  await sleep(500) // initial render

  for (let i = 0; i < totalSlides; i++) {
    onProgress({
      stage: 'recording',
      currentSlide: i + 1,
      totalSlides,
      message: `Recording slide ${i + 1} of ${totalSlides}…`,
    })

    store.setActiveSlide(i)

    // Wait for the CSS/JS transition to finish
    await sleep(transitionDuration + 200)

    // ✅ FIX 2: Capture the slide frame ONCE after the transition
    await captureFrame(canvasBoard, canvas, ctx, exportResolution, html2canvas)

    // ✅ FIX 3: During dwell, just sleep — captureStream(30) already holds
    // the drawn pixels and emits them at 30fps automatically. No need to
    // re-run html2canvas 30× per second here.
    await sleep(autoplayDelay)
  }

  onProgress({
    stage: 'encoding',
    currentSlide: totalSlides,
    totalSlides,
    message: 'Encoding video…',
  })

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

// ✅ FIX 1 (cont.): Accept the pre-imported html2canvas instance
async function captureFrame(
  source: HTMLElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  resolution: { width: number; height: number },
  html2canvas: typeof import('html2canvas').default,
) {
  try {
    const screenshot = await html2canvas(source, {
      backgroundColor: '#0a0a0a',
      scale: resolution.width / source.offsetWidth,
      useCORS: true,
      logging: false,
    })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(screenshot, 0, 0, canvas.width, canvas.height)
  } catch {
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
