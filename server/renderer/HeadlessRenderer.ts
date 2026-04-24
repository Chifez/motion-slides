/**
 * HeadlessRenderer.ts
 *
 * Launches chrome-headless-shell with BeginFrame control, injects the
 * VirtualClock and project data, then captures every frame deterministically.
 * Frames are piped directly to FfmpegEncoder as raw JPEG buffers.
 */

import puppeteer, { Browser, Page, CDPSession } from 'puppeteer'
import { getVirtualClockScript } from './VirtualClock.injected.js'
import { FfmpegEncoder }          from '../encoder/FfmpegEncoder.js'
import type { ExportProgressEvent } from '../types.js'
import type { ExportProject }       from '../../src/lib/sceneGraph.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeadlessRendererOptions {
  frontendUrl:       string
  chromeExecutable?: string
  outputPath:        string
  format:            string
  onProgress:        (event: ExportProgressEvent) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTPUT_FPS = 30
const FRAME_MS   = 1000 / OUTPUT_FPS   // 33.33 ms per frame

/**
 * Number of frames to capture during the entrance animation window
 * of each slide's hold phase. 10 frames × FRAME_MS = ~333ms of
 * entrance animation captured at full fidelity.
 * Increase for longer entrance animations.
 */
const ENTRANCE_FRAMES = 10

// ─── HeadlessRenderer ─────────────────────────────────────────────────────────

export class HeadlessRenderer {
  private opts: HeadlessRendererOptions
  private browser: Browser | null   = null
  private page:    Page | null      = null
  private cdp:     CDPSession | null = null
  private encoder: FfmpegEncoder | null = null

  constructor(opts: HeadlessRendererOptions) {
    this.opts = opts
  }

  async render(sceneGraph: ExportProject): Promise<void> {
    const { project, playbackSettings } = sceneGraph
    const resolution = playbackSettings.exportResolution
    const totalSlides = project.slides.length

    try {
      // ── Launch browser ───────────────────────────────────────────────────
      this.opts.onProgress({ stage: 'preparing', percent: 2, message: 'Launching browser…' })
      await this.launchBrowser(resolution)

      // ── Start encoder ────────────────────────────────────────────────────
      this.encoder = new FfmpegEncoder({
        outputPath: this.opts.outputPath,
        format:     this.opts.format,
        fps:        OUTPUT_FPS,
        width:      resolution.width,
        height:     resolution.height,
      })
      await this.encoder.start()

      // ── Navigate to export view ──────────────────────────────────────────
      this.opts.onProgress({ stage: 'preparing', percent: 5, message: 'Loading app…' })
      await this.page!.goto(
        `${this.opts.frontendUrl}/export-view`,
        { waitUntil: 'networkidle2', timeout: 60000 }
      )

      // ── Inject project data into Zustand store ───────────────────────────
      this.opts.onProgress({ stage: 'preparing', percent: 10, message: 'Injecting project data…' })
      await this.injectProjectData(sceneGraph)

      // ── Capture all slides ───────────────────────────────────────────────
      for (let i = 0; i < totalSlides; i++) {
        const slidePercent = 10 + Math.round((i / totalSlides) * 80)
        this.opts.onProgress({
          stage:        'capturing',
          currentSlide: i + 1,
          totalSlides,
          percent:      slidePercent,
          message:      `Capturing slide ${i + 1} / ${totalSlides}…`,
        } as any)

        await this.captureSlide(i, sceneGraph, i > 0)
      }

      // ── Finalise encoder ─────────────────────────────────────────────────
      this.opts.onProgress({ stage: 'encoding', percent: 92, message: 'Finalizing…' })
      await this.encoder.finalize()

    } finally {
      await this.cleanup()
    }
  }

  // ── Browser setup ──────────────────────────────────────────────────────────

  private async launchBrowser(resolution: { width: number; height: number }): Promise<void> {
    this.browser = await puppeteer.launch({
      executablePath: this.opts.chromeExecutable,
      headless:       true,
      protocolTimeout: 120000, // 2 minutes for large data injection
      args: [
        // Required for BeginFrame deterministic capture
        '--enable-begin-frame-control',
        '--run-all-compositor-stages-before-draw',

        // Disable threading so animations advance only on our ticks
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        '--disable-checker-imaging',
        '--disable-image-animation-resync',

        // Software GL for servers without GPU
        '--use-gl=angle',
        '--use-angle=swiftshader',

        // Standard headless flags
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--hide-scrollbars',
        '--mute-audio',
        `--window-size=${resolution.width},${resolution.height}`,
      ],
    })

    this.page = await this.browser.newPage()

    // ── Debugging: Capture browser logs ────────────────────────────────────
    this.page.on('console', msg => console.log(`[Browser] ${msg.text()}`))
    this.page.on('pageerror', err => console.error(`[Browser Error] ${err.message}`))
    this.page.on('requestfailed', req => console.warn(`[Browser Request Failed] ${req.url()}: ${req.failure()?.errorText}`))

    // Inject VirtualClock BEFORE any page JavaScript runs
    await this.page.evaluateOnNewDocument(getVirtualClockScript())

    // Set viewport to exact export resolution
    await this.page.setViewport({
      width:             resolution.width,
      height:            resolution.height,
      deviceScaleFactor: 1,
    })

    // Open CDP session for BeginFrame
    this.cdp = await this.page.target().createCDPSession()
    await this.cdp.send('HeadlessExperimental.enable')
  }

  // ── Project data injection ─────────────────────────────────────────────────

  /**
   * Wait for the Zustand store to be exposed on window, then inject
   * the serialized project. This is Approach B — we use the real store,
   * not a special initialization route.
   */
  private async injectProjectData(sceneGraph: ExportProject): Promise<void> {
    const dataSize = Buffer.byteLength(JSON.stringify(sceneGraph))
    console.log(`[HeadlessRenderer] Injecting project data (${(dataSize / 1024 / 1024).toFixed(2)} MB)…`)

    // Wait for the store to be available (set in editorStore.ts)
    await this.page!.waitForFunction(
      () => !!(window as any).__motionslides_store__,
      { timeout: 15000 }
    )

    try {
      // Inject the project and playback settings into the store
      await this.page!.evaluate((data: any) => {
        console.log('[Browser] Starting state injection…')
        const store = (window as any).__motionslides_store__
        store.setState({
          projects:         [data.project],
          activeProjectId:  data.project.id,
          activeSlideIndex: 0,
          playbackSettings: {
            ...store.getState().playbackSettings,
            ...data.playbackSettings,
          },
        })
        console.log('[Browser] State injection complete.')
      }, sceneGraph)
    } catch (err: any) {
      console.error('[HeadlessRenderer] Error during page.evaluate injection:', err)
      throw err
    }

    // Flush React render: tick clock twice with 0ms advance
    await this.tickClock(0)
    await this.tickClock(0)

    // Wait one real event loop turn for React to commit
    await this.page!.evaluate(() => new Promise<void>(r => (window as any).__realSetTimeout(r, 50)))
  }

  // ── Slide capture ──────────────────────────────────────────────────────────

  /**
   * Capture all frames for one slide, including:
   *   1. Transition frames (if not the first slide)
   *   2. Entrance animation frames
   *   3. Static hold frame (repeated to fill remaining hold duration)
   */
  private async captureSlide(
    slideIndex: number,
    sceneGraph: ExportProject,
    includeTransition: boolean,
  ): Promise<void> {
    const { playbackSettings, project } = sceneGraph
    const transitionDuration = playbackSettings.transitionDuration ?? 1000
    const autoplayDelay      = playbackSettings.autoplayDelay      ?? 3000

    // ── Activate the slide ───────────────────────────────────────────────────
    await this.page!.evaluate((idx: number) => {
      const store = (window as any).__motionslides_store__
      store.getState().setActiveSlide(idx)
    }, slideIndex)

    // Flush: two clock ticks at 0ms so React commits and Framer Motion starts
    await this.tickClock(0)
    await this.tickClock(0)
    await this.page!.evaluate(() => new Promise<void>(r => (window as any).__realSetTimeout(r, 16)))

    // ── Transition frames ────────────────────────────────────────────────────
    if (includeTransition && transitionDuration > 0) {
      const transFrameCount = Math.ceil(transitionDuration / FRAME_MS)
      for (let f = 0; f < transFrameCount; f++) {
        await this.tickClock(FRAME_MS)
        await this.captureFrame()
      }
    }

    // ── Entrance animation frames ────────────────────────────────────────────
    // Capture ENTRANCE_FRAMES frames at FRAME_MS intervals to record
    // per-element Framer Motion entrance animations (springs, fades, etc.)
    for (let f = 0; f < ENTRANCE_FRAMES; f++) {
      await this.tickClock(FRAME_MS)
      await this.captureFrame()
    }

    // ── Static hold frame ────────────────────────────────────────────────────
    // Jump the clock to the end of the hold period and capture one frame.
    // This frame is repeated by FFmpeg to fill the remaining hold duration.
    const entranceDuration   = ENTRANCE_FRAMES * FRAME_MS
    const remainingHoldMs    = autoplayDelay - entranceDuration
    const remainingHoldFrames = Math.max(0, Math.ceil(remainingHoldMs / FRAME_MS))

    if (remainingHoldFrames > 0) {
      // Jump to end of hold
      await this.tickClock(remainingHoldMs)
      await this.captureFrame()

      // Write the static frame N more times to fill the hold duration.
      // We capture once and write it repeatedly — much faster than
      // capturing the same static frame N times.
      const lastFrame = await this.getLastFrame()
      for (let r = 1; r < remainingHoldFrames; r++) {
        this.encoder!.writeFrame(lastFrame)
      }
    }
  }

  // ── Frame capture ──────────────────────────────────────────────────────────

  private lastFrameBuffer: Buffer | null = null

  private async captureFrame(): Promise<void> {
    const result = await this.cdp!.send('HeadlessExperimental.beginFrame', {
      screenshot: { format: 'jpeg', quality: 95 },
    })

    if (result.screenshotData) {
      const buffer = Buffer.from(result.screenshotData, 'base64')
      this.lastFrameBuffer = buffer
      this.encoder!.writeFrame(buffer)
    }
  }

  private async getLastFrame(): Promise<Buffer> {
    if (this.lastFrameBuffer) return this.lastFrameBuffer
    // Fallback: capture a fresh frame
    const result = await this.cdp!.send('HeadlessExperimental.beginFrame', {
      screenshot: { format: 'jpeg', quality: 95 },
    })
    return Buffer.from(result.screenshotData ?? '', 'base64')
  }

  // ── Clock control ──────────────────────────────────────────────────────────

  /**
   * Advance the virtual clock by `ms` milliseconds inside the page context.
   * This fires all queued rAF callbacks and setTimeout callbacks in the page,
   * advancing Framer Motion's animation timeline by exactly `ms` milliseconds.
   */
  private async tickClock(ms: number): Promise<void> {
    await this.page!.evaluate((ms: number) => {
      (window as any).__virtualClock.tick(ms)
    }, ms)
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  private async cleanup(): Promise<void> {
    try { await this.cdp?.detach()    } catch {}
    try { await this.page?.close()    } catch {}
    try { await this.browser?.close() } catch {}
    this.cdp     = null
    this.page    = null
    this.browser = null
  }
}
