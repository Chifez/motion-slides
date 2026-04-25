# MotionSlides — Headless Export Engine Implementation Plan

> **For the AI implementing this plan:** Read every section completely before writing
> any code. Each section builds on the previous. Do not skip or summarise steps.
> Follow the exact file paths, function signatures, flag names, and injection
> patterns specified. Where a section says "exact", that means do not paraphrase.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Package Dependencies](#2-package-dependencies)
3. [Environment Configuration](#3-environment-configuration)
4. [File Map — Complete List of Files to Create or Modify](#4-file-map)
5. [Implementation — Frontend](#5-implementation--frontend)
   - 5.1 editorStore.ts — expose store on window
   - 5.2 sceneGraph.ts — serialize and resolve assets
   - 5.3 exportClient.ts — POST + SSE stream reader
   - 5.4 Export canvas route — clean fullscreen canvas view
6. [Implementation — Backend](#6-implementation--backend)
   - 6.1 server/index.ts — Express + SSE + p-queue
   - 6.2 server/renderer/VirtualClock.injected.ts — deterministic clock
   - 6.3 server/renderer/HeadlessRenderer.ts — Puppeteer + BeginFrame loop
   - 6.4 server/encoder/FfmpegEncoder.ts — FFmpeg pipe wrapper
7. [Slide Sequencing Logic](#7-slide-sequencing-logic)
8. [VirtualClock Injection Timing](#8-virtualclock-injection-timing)
9. [State Injection Pattern](#9-state-injection-pattern)
10. [FFmpeg Command Reference](#10-ffmpeg-command-reference)
11. [Critical Constraints](#11-critical-constraints)
12. [Verification Plan](#12-verification-plan)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Architecture Overview

### Principle
**Export is data-driven, not DOM-driven.** The frontend serializes the project to
plain JSON. The backend loads that JSON into a headless Chrome instance running the
real MotionSlides React app, then captures every frame using Chrome's deterministic
`HeadlessExperimental.beginFrame` CDP command. FFmpeg encodes the raw JPEG stream
into the final file. No `html-to-image`. No `MediaRecorder`. No DOM observation.

### Why this approach
- `HeadlessExperimental.beginFrame` freezes Chrome between each call. No frame is
  captured until we explicitly request it, so capture speed does not affect animation
  timing.
- The VirtualClock (injected before the page loads) replaces all five browser time
  APIs. Chrome, React, and Framer Motion all believe time advances by exactly
  `1000/fps` ms per frame — only when we call `clock.tick()`.
- Because we capture what Chrome actually composites, CSS effects, SVG, fonts,
  shadows, Framer Motion springs, and transitions all render identically to the
  live editor. No separate canvas renderer required.

### Pipeline diagram

```
┌─────────────────────────────────────────────────┐
│  FRONTEND                                        │
│                                                  │
│  User clicks Export                              │
│       ↓                                          │
│  sceneGraph.ts                                   │
│  • Serialize Zustand store → ExportProject JSON  │
│  • Fetch all image URLs → base64 data: URLs      │
│       ↓                                          │
│  exportClient.ts                                 │
│  • POST /api/export with ExportProject body      │
│  • Read response as ReadableStream (SSE)         │
│  • Update UI progress bar from SSE events        │
│  • On done event → fetch download URL            │
└──────────────────┬──────────────────────────────┘
                   │ HTTP POST (JSON body, SSE response)
                   ▼
┌─────────────────────────────────────────────────┐
│  BACKEND  server/index.ts                        │
│                                                  │
│  p-queue (max 2 concurrent jobs)                 │
│       ↓                                          │
│  HeadlessRenderer.ts                             │
│  • Launch chrome-headless-shell with flags       │
│  • evaluateOnNewDocument → inject VirtualClock   │
│  • page.goto(FRONTEND_URL + '/export-view')      │
│  • Wait for store to mount                       │
│  • page.evaluate → inject ExportProject into     │
│    Zustand store via window.__motionslides_store__│
│  • Wait 2 rAF cycles for React to re-render     │
│       ↓ (for each slide)                         │
│  • page.evaluate → store.setActiveSlide(i)       │
│  • page.evaluate → clock.tick(0) × 2            │
│  • BeginFrame loop:                              │
│    for each frame in [transition + hold]:        │
│      page.evaluate → clock.tick(FRAME_MS)        │
│      cdp.HeadlessExperimental.beginFrame(...)    │
│      → raw JPEG bytes                            │
│      → pipe to FfmpegEncoder stdin               │
│  • SSE progress events throughout                │
│       ↓                                          │
│  FfmpegEncoder.ts                                │
│  • stdin receives JPEG stream                    │
│  • FFmpeg encodes to MP4 / WebM / GIF            │
│  • Output written to /tmp/motionslides/{jobId}   │
│       ↓                                          │
│  SSE: { stage: 'done', url: '/api/download/xyz' }│
│       ↓                                          │
│  GET /api/download/:jobId → stream file          │
│  File deleted after 10 minutes                   │
└─────────────────────────────────────────────────┘
```

---

## 2. Package Dependencies

### Frontend (add to existing `package.json`)
No new packages required. The frontend only uses `fetch` with `ReadableStream`.

### Backend (`server/package.json` — standalone server)

```json
{
  "name": "motionslides-export-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch server/index.ts",
    "build": "tsc --project server/tsconfig.json",
    "start": "node server/dist/index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "fluent-ffmpeg": "^2.1.2",
    "p-queue": "^8.0.1",
    "puppeteer": "^22.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/fluent-ffmpeg": "^2.1.24",
    "@types/uuid": "^9.0.7",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### System requirements (on the server machine)
- `ffmpeg` installed and available in `PATH`
  - Ubuntu: `apt-get install ffmpeg`
  - macOS: `brew install ffmpeg`
- `chrome-headless-shell` binary available
  - Download from https://googlechromelabs.github.io/chrome-for-testing/
  - Set `CHROME_EXECUTABLE` environment variable to its path
  - Linux only for production (BeginFrame is unreliable on macOS)

---

## 3. Environment Configuration

### Frontend `.env`
```
VITE_EXPORT_SERVER_URL=http://localhost:3001
```

### Backend `server/.env`
```
PORT=3001
FRONTEND_URL=http://localhost:5173
CHROME_EXECUTABLE=/usr/bin/chrome-headless-shell
EXPORT_TIMEOUT_MS=300000
MAX_CONCURRENT_EXPORTS=2
OUTPUT_DIR=/tmp/motionslides-exports
```

### Backend `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["server/**/*"]
}
```

---

## 4. File Map

### Files to CREATE (new files)

| Path | Purpose |
|------|---------|
| `src/lib/sceneGraph.ts` | Serialize store → ExportProject JSON, resolve image assets |
| `src/lib/exportClient.ts` | POST to backend, read SSE stream, trigger download |
| `src/routes/export-view.tsx` | Clean fullscreen canvas route for headless capture |
| `server/index.ts` | Express server, SSE endpoint, p-queue, download route |
| `server/renderer/VirtualClock.injected.ts` | Deterministic clock script injected before page load |
| `server/renderer/HeadlessRenderer.ts` | Puppeteer + BeginFrame loop + slide sequencing |
| `server/encoder/FfmpegEncoder.ts` | FFmpeg stdin pipe wrapper, all format support |

### Files to MODIFY (existing files)

| Path | What changes |
|------|-------------|
| `src/store/editorStore.ts` | Expose store on `window.__motionslides_store__` |
| `src/routes/index.tsx` | Add `/export-view` route |
| `src/components/ExportModal.tsx` | Replace `exportPresentation()` call with `exportClient.startExport()` |

---

## 5. Implementation — Frontend

---

### 5.1 Modify `src/store/editorStore.ts`

Add exactly these three lines at the very bottom of the file, after the
`useEditorStore` is created:

```typescript
// Expose store for headless renderer injection (export pipeline only)
if (typeof window !== 'undefined') {
  (window as any).__motionslides_store__ = useEditorStore
}
```

**Why:** Puppeteer's `page.evaluate()` runs in the browser context. The store
must be reachable via `window` for the renderer to inject project data after
the app mounts.

---

### 5.2 Create `src/lib/sceneGraph.ts`

**Full implementation:**

```typescript
/**
 * sceneGraph.ts
 *
 * Serializes the current Zustand store state into a clean, deterministic
 * ExportProject JSON object. All image URLs are pre-resolved to base64
 * data URLs so the headless browser never makes external network requests.
 */

import { useEditorStore } from '@/store/editorStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportProject {
  project:          SerializedProject
  playbackSettings: SerializedPlaybackSettings
  exportedAt:       number
}

export interface SerializedProject {
  id:     string
  name:   string
  slides: SerializedSlide[]
}

export interface SerializedSlide {
  id:         string
  elements:   SerializedElement[]
  background: string
  transition?: {
    type:      string
    duration:  number
    easing:    string
    direction?: string
    flipAxis?:  string
  }
}

export interface SerializedElement {
  id:       string
  type:     string
  position: { x: number; y: number }
  size:     { width: number; height: number }
  rotation: number
  opacity?: number
  content:  unknown
  style?:   unknown
  zIndex:   number
  [key: string]: unknown
}

export interface SerializedPlaybackSettings {
  exportResolution:   { width: number; height: number }
  transitionDuration: number
  autoplayDelay:      number
  aspectRatio:        string
  transitionType?:    string
  transitionEasing?:  string
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate a fully serialized, asset-resolved ExportProject from the
 * current store state. Safe to JSON.stringify and POST to the backend.
 */
export async function generateSceneGraph(): Promise<ExportProject> {
  const store   = useEditorStore.getState()
  const project = store.activeProject()

  if (!project) throw new Error('No active project to export')

  // Deep-clone to avoid mutating store state
  const cloned = JSON.parse(JSON.stringify(project)) as SerializedProject

  // Resolve all image assets to base64 data URLs
  await resolveAllImages(cloned)

  return {
    project:          cloned,
    playbackSettings: store.playbackSettings as SerializedPlaybackSettings,
    exportedAt:       Date.now(),
  }
}

// ─── Asset resolution ─────────────────────────────────────────────────────────

/**
 * Walk all elements in all slides and convert any external image src
 * values to base64 data: URLs. This ensures the headless browser never
 * needs to make external network requests, avoiding CORS and firewall issues.
 */
async function resolveAllImages(project: SerializedProject): Promise<void> {
  const jobs: Promise<void>[] = []

  for (const slide of project.slides) {
    for (const element of slide.elements) {
      if (element.type === 'image') {
        const content = element.content as { src?: string }
        if (content?.src && isExternalUrl(content.src)) {
          jobs.push(
            fetchAsBase64(content.src).then(dataUrl => {
              content.src = dataUrl
            }).catch(() => {
              // If fetch fails, keep the original URL — headless may still
              // reach it if it's on the same network
              console.warn('[SceneGraph] Could not resolve image:', content.src)
            })
          )
        }
      }
    }
  }

  await Promise.all(jobs)
}

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') ||
         url.startsWith('https://') ||
         url.startsWith('//')
}

async function fetchAsBase64(url: string): Promise<string> {
  const res    = await fetch(url)
  const blob   = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror  = reject
    reader.readAsDataURL(blob)
  })
}
```

---

### 5.3 Create `src/lib/exportClient.ts`

**Full implementation:**

```typescript
/**
 * exportClient.ts
 *
 * Sends the ExportProject to the backend and reads progress via SSE
 * from the same POST response body (no separate progress endpoint).
 */

import { generateSceneGraph } from './sceneGraph'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'pdf'

export interface ExportProgressEvent {
  stage:   'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
  percent: number
  message: string
  url?:    string   // present when stage === 'done'
}

type ProgressCallback = (event: ExportProgressEvent) => void

// ─── Main entry-point ─────────────────────────────────────────────────────────

/**
 * Start a backend export job. Streams SSE progress events until done or error.
 * On completion, automatically triggers a file download in the browser.
 *
 * @param format     Output format: 'mp4' | 'webm' | 'gif' | 'pdf'
 * @param onProgress Callback for progress events (use to update UI)
 * @returns          The final Blob URL, or null on error
 */
export async function startExport(
  format:     ExportFormat,
  onProgress: ProgressCallback,
): Promise<string | null> {
  const serverUrl = import.meta.env.VITE_EXPORT_SERVER_URL ?? 'http://localhost:3001'

  // ── Serialize the project ────────────────────────────────────────────────
  onProgress({ stage: 'preparing', percent: 0, message: 'Serializing project…' })

  let sceneGraph
  try {
    sceneGraph = await generateSceneGraph()
  } catch (err: any) {
    onProgress({ stage: 'error', percent: 0, message: err?.message ?? 'Failed to serialize project' })
    return null
  }

  // ── POST to backend and read SSE stream ──────────────────────────────────
  let response: Response
  try {
    response = await fetch(`${serverUrl}/api/export`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sceneGraph, format }),
    })
  } catch (err) {
    onProgress({ stage: 'error', percent: 0, message: 'Could not reach export server. Is it running?' })
    return null
  }

  if (!response.ok) {
    onProgress({ stage: 'error', percent: 0, message: `Server error: ${response.status}` })
    return null
  }

  if (!response.body) {
    onProgress({ stage: 'error', percent: 0, message: 'Server returned no body' })
    return null
  }

  // ── Read SSE events from the response body stream ────────────────────────
  const reader  = response.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''
  let   downloadUrl: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer      = lines.pop() ?? ''   // keep incomplete last line in buffer

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6)) as ExportProgressEvent
        onProgress(event)

        if (event.stage === 'done' && event.url) {
          downloadUrl = `${serverUrl}${event.url}`
          triggerDownload(downloadUrl, `motionslides-export.${format}`)
        }

        if (event.stage === 'error') {
          return null
        }
      } catch {
        // Malformed SSE line — skip
      }
    }
  }

  return downloadUrl
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function triggerDownload(url: string, filename: string): void {
  const a      = document.createElement('a')
  a.href       = url
  a.download   = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
```

---

### 5.4 Create `src/routes/export-view.tsx`

This route is navigated to by the headless browser. It renders only the slide
canvas — no editor UI, no toolbar, no panels. It must fill the entire viewport
at the exact export resolution.

```tsx
/**
 * export-view.tsx
 *
 * A clean, fullscreen canvas view used exclusively by the headless renderer.
 * Renders the active slide at 100% viewport size with no editor chrome.
 * State is injected into the Zustand store by HeadlessRenderer.ts before
 * this page is captured.
 */

import { useEditorStore } from '@/store/editorStore'
import { SlideCanvas }    from '@/components/canvas/SlideCanvas'  // adjust import to your actual canvas component

export default function ExportView() {
  const activeSlide = useEditorStore(s => s.activeSlide())

  if (!activeSlide) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }} />
    )
  }

  return (
    <div
      style={{
        width:    '100vw',
        height:   '100vh',
        overflow: 'hidden',
        background: '#0a0a0a',
        // Remove any editor-specific scaling or transforms
        transform: 'none',
        zoom:      1,
      }}
      data-canvas-board   // keep this attribute — HeadlessRenderer may need it
    >
      <SlideCanvas
        slide={activeSlide}
        isExporting={true}    // pass this prop if your canvas accepts it
      />
    </div>
  )
}
```

**Register this route in your router** (`src/routes/index.tsx` or wherever your
routes are defined). Add:

```tsx
{ path: '/export-view', element: <ExportView /> }
```

---

## 6. Implementation — Backend

---

### 6.1 Create `server/index.ts`

```typescript
/**
 * server/index.ts
 *
 * Express server that handles export jobs.
 * - POST /api/export   → starts a job, streams SSE progress on the same connection
 * - GET  /api/download/:jobId → serves the completed file
 * - GET  /health       → health check
 *
 * Concurrency is limited by p-queue to prevent OOM from simultaneous Puppeteer
 * instances. Each Chrome instance uses ~500MB–1GB RAM.
 */

import express, { Request, Response } from 'express'
import cors    from 'cors'
import fs      from 'fs'
import path    from 'path'
import os      from 'os'
import { v4 as uuid }  from 'uuid'
import PQueue  from 'p-queue'
import { HeadlessRenderer } from './renderer/HeadlessRenderer.js'
import type { ExportProgressEvent } from './types.js'

// ─── Setup ────────────────────────────────────────────────────────────────────

const app        = express()
const PORT       = process.env.PORT ?? 3001
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? path.join(os.tmpdir(), 'motionslides-exports')
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_EXPORTS ?? '2')
const EXPORT_TIMEOUT = parseInt(process.env.EXPORT_TIMEOUT_MS ?? '300000')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  methods: ['GET', 'POST'],
}))
app.use(express.json({ limit: '100mb' }))  // large limit for base64 images

// ─── Job queue ────────────────────────────────────────────────────────────────

const renderQueue = new PQueue({ concurrency: MAX_CONCURRENT })

// ─── POST /api/export ─────────────────────────────────────────────────────────

app.post('/api/export', (req: Request, res: Response) => {
  const { sceneGraph, format = 'mp4' } = req.body

  if (!sceneGraph?.project) {
    return res.status(400).json({ error: 'sceneGraph.project is required' })
  }

  // ── Configure SSE ──────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')   // disable nginx buffering
  res.flushHeaders()

  const jobId    = uuid()
  const ext      = format === 'pdf' ? 'pdf' : format
  const outPath  = path.join(OUTPUT_DIR, `${jobId}.${ext}`)
  let   finished = false

  const send = (event: ExportProgressEvent) => {
    if (!finished) res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  // ── Timeout guard ──────────────────────────────────────────────────────────
  const timer = setTimeout(() => {
    if (!finished) {
      finished = true
      send({ stage: 'error', percent: 0, message: 'Export timed out.' })
      res.end()
    }
  }, EXPORT_TIMEOUT)

  // ── Queue the render job ───────────────────────────────────────────────────
  renderQueue.add(async () => {
    const renderer = new HeadlessRenderer({
      frontendUrl:      process.env.FRONTEND_URL ?? 'http://localhost:5173',
      chromeExecutable: process.env.CHROME_EXECUTABLE,
      outputPath:       outPath,
      format,
      onProgress:       send,
    })

    try {
      await renderer.render(sceneGraph)

      if (!finished) {
        scheduleCleanup(outPath, 10 * 60 * 1000)
        send({
          stage:   'done',
          percent: 100,
          message: 'Export complete!',
          url:     `/api/download/${jobId}`,
        })
      }
    } catch (err: any) {
      if (!finished) {
        send({ stage: 'error', percent: 0, message: err?.message ?? 'Render failed.' })
      }
    } finally {
      finished = true
      clearTimeout(timer)
      res.end()
    }
  })
})

// ─── GET /api/download/:jobId ─────────────────────────────────────────────────

app.get('/api/download/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params

  // Validate — only allow UUID format to prevent path traversal
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(jobId)) {
    return res.status(400).send('Invalid job ID')
  }

  const extensions = ['mp4', 'webm', 'gif', 'pdf']
  const filePath   = extensions
    .map(ext => path.join(OUTPUT_DIR, `${jobId}.${ext}`))
    .find(p => fs.existsSync(p))

  if (!filePath) {
    return res.status(404).send('File not found or expired')
  }

  const ext = path.extname(filePath).slice(1)
  const mimeTypes: Record<string, string> = {
    mp4:  'video/mp4',
    webm: 'video/webm',
    gif:  'image/gif',
    pdf:  'application/pdf',
  }

  res.setHeader('Content-Disposition', `attachment; filename="motionslides.${ext}"`)
  res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream')
  fs.createReadStream(filePath).pipe(res)
})

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({
  ok:      true,
  queue:   renderQueue.size,
  pending: renderQueue.pending,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scheduleCleanup(filePath: string, delayMs: number): void {
  setTimeout(() => fs.unlink(filePath, () => {}), delayMs)
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[ExportServer] http://localhost:${PORT}`)
  console.log(`[ExportServer] Frontend: ${process.env.FRONTEND_URL}`)
  console.log(`[ExportServer] Chrome:   ${process.env.CHROME_EXECUTABLE ?? 'default puppeteer'}`)
  console.log(`[ExportServer] Max jobs: ${MAX_CONCURRENT}`)
})
```

---

### 6.2 Create `server/renderer/VirtualClock.injected.ts`

**This file is stringified and injected into the page via `evaluateOnNewDocument`
BEFORE any page JavaScript runs. It must be self-contained — no imports, no
TypeScript features that cannot run in a browser context.**

```typescript
/**
 * VirtualClock.injected.ts
 *
 * Deterministic clock injected into chrome-headless-shell before page load.
 * Patches all five browser time APIs so Framer Motion, React scheduler,
 * CSS animations, and all timeouts advance only when clock.tick() is called.
 *
 * Safe to patch all five here (including setTimeout/setInterval) because
 * HeadlessExperimental.beginFrame freezes Chrome between calls — there is
 * no event loop running that could deadlock on a patched setTimeout.
 *
 * Exposed as window.__virtualClock for HeadlessRenderer to call tick().
 */

// This function is converted to a string and injected. Do not use imports.
export function getVirtualClockScript(): string {
  return `
(function() {
  'use strict';

  let virtualNow    = performance.now();
  const rafQueue    = new Map();
  const timerQueue  = [];
  let   nextRafId   = 1;
  let   nextTimerId = 100000;

  // ── performance.now ────────────────────────────────────────────────────────
  const _realPerfNow = performance.now.bind(performance);
  performance.now = function() { return virtualNow; };

  // ── Date.now ───────────────────────────────────────────────────────────────
  Date.now = function() { return Math.floor(virtualNow); };

  // ── requestAnimationFrame ──────────────────────────────────────────────────
  window.requestAnimationFrame = function(cb) {
    const id = nextRafId++;
    rafQueue.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = function(id) {
    rafQueue.delete(id);
  };

  // ── setTimeout ─────────────────────────────────────────────────────────────
  const _realSetTimeout  = window.setTimeout.bind(window);
  const _realClearTimeout = window.clearTimeout.bind(window);
  window.setTimeout = function(cb, delay) {
    delay = delay || 0;
    const id = nextTimerId++;
    timerQueue.push({ id, cb, fireAt: virtualNow + delay });
    return id;
  };
  window.clearTimeout = function(id) {
    const idx = timerQueue.findIndex(t => t.id === id);
    if (idx !== -1) timerQueue.splice(idx, 1);
  };

  // ── setInterval ────────────────────────────────────────────────────────────
  // Convert to recurring setTimeout entries
  window.setInterval = function(cb, delay) {
    delay = delay || 16;
    let id = nextTimerId++;
    function schedule() {
      timerQueue.push({ id, cb: () => { cb(); schedule(); }, fireAt: virtualNow + delay });
    }
    schedule();
    return id;
  };
  window.clearInterval = window.clearTimeout;

  // ── clock.tick ─────────────────────────────────────────────────────────────
  function tick(ms) {
    virtualNow += (ms || 0);

    // Fire due setTimeout/setInterval callbacks
    const due = timerQueue.filter(t => t.fireAt <= virtualNow);
    due.forEach(t => {
      const idx = timerQueue.indexOf(t);
      if (idx !== -1) timerQueue.splice(idx, 1);
    });
    due.forEach(t => { try { t.cb(); } catch(e) {} });

    // Fire all queued rAF callbacks
    const pending = Array.from(rafQueue.entries());
    rafQueue.clear();
    pending.forEach(([, cb]) => { try { cb(virtualNow); } catch(e) {} });
  }

  // Expose on window for HeadlessRenderer to call via page.evaluate
  window.__virtualClock = { tick, getCurrentTime: () => virtualNow };

  console.log('[VirtualClock] Installed. All time APIs are deterministic.');
})();
  `.trim()
}
```

---

### 6.3 Create `server/renderer/HeadlessRenderer.ts`

```typescript
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
        { waitUntil: 'networkidle0', timeout: 30000 }
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
    // Wait for the store to be available (set in editorStore.ts)
    await this.page!.waitForFunction(
      () => !!(window as any).__motionslides_store__,
      { timeout: 15000 }
    )

    // Inject the project and playback settings into the store
    await this.page!.evaluate((data: any) => {
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
    }, sceneGraph)

    // Flush React render: tick clock twice with 0ms advance
    await this.tickClock(0)
    await this.tickClock(0)

    // Wait one real event loop turn for React to commit
    await this.page!.evaluate(() => new Promise<void>(r => setTimeout(r, 50)))
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
    await this.page!.evaluate(() => new Promise<void>(r => setTimeout(r, 16)))

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
```

---

### 6.4 Create `server/encoder/FfmpegEncoder.ts`

```typescript
/**
 * FfmpegEncoder.ts
 *
 * Wraps FFmpeg to encode a stream of JPEG frame buffers into MP4, WebM,
 * GIF, or PDF. Frames are written to FFmpeg's stdin pipe.
 *
 * PDF is a special case — it does not use FFmpeg at all. Instead it
 * accumulates one PNG per slide and uses pdfkit to build the PDF.
 */

import { spawn, ChildProcess } from 'child_process'
import fs   from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FfmpegEncoderOptions {
  outputPath: string
  format:     string
  fps:        number
  width:      number
  height:     number
}

// ─── FfmpegEncoder ────────────────────────────────────────────────────────────

export class FfmpegEncoder {
  private opts:    FfmpegEncoderOptions
  private proc:    ChildProcess | null = null
  private frames:  Buffer[] = []   // used only for PDF accumulation

  constructor(opts: FfmpegEncoderOptions) {
    this.opts = opts
  }

  async start(): Promise<void> {
    if (this.opts.format === 'pdf') return   // PDF does not use FFmpeg

    const args = this.buildFfmpegArgs()

    this.proc = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] })

    this.proc.stdout?.on('data', () => {})   // drain stdout
    this.proc.stderr?.on('data', (d: Buffer) => {
      // Uncomment for debugging:
      // process.stderr.write(d)
    })

    this.proc.on('error', (err) => {
      throw new Error(`FFmpeg process error: ${err.message}`)
    })
  }

  writeFrame(buffer: Buffer): void {
    if (this.opts.format === 'pdf') {
      this.frames.push(buffer)   // accumulate for PDF
      return
    }
    if (!this.proc?.stdin?.writable) return
    this.proc.stdin.write(buffer)
  }

  async finalize(): Promise<void> {
    if (this.opts.format === 'pdf') {
      await this.finalizePdf()
      return
    }

    return new Promise((resolve, reject) => {
      if (!this.proc) return resolve()

      this.proc.stdin?.end()

      this.proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`))
        }
      })
    })
  }

  // ── FFmpeg argument builders ───────────────────────────────────────────────

  private buildFfmpegArgs(): string[] {
    switch (this.opts.format) {
      case 'mp4':  return this.mp4Args()
      case 'webm': return this.webmArgs()
      case 'gif':  return this.gifArgs()
      default:     return this.mp4Args()
    }
  }

  private mp4Args(): string[] {
    return [
      '-f',        'image2pipe',    // input is a raw image pipe
      '-framerate', String(this.opts.fps),
      '-i',        'pipe:0',        // read frames from stdin
      '-c:v',      'libx264',       // H.264 codec
      '-preset',   'medium',        // encoding speed/quality balance
      '-crf',      '18',            // near-lossless quality (0=lossless, 51=worst)
      '-pix_fmt',  'yuv420p',       // REQUIRED for QuickTime and iOS compatibility
      '-movflags', '+faststart',    // moov atom at front for streaming
      '-y',                         // overwrite output file without asking
      this.opts.outputPath,
    ]
  }

  private webmArgs(): string[] {
    return [
      '-f',        'image2pipe',
      '-framerate', String(this.opts.fps),
      '-i',        'pipe:0',
      '-c:v',      'libvpx-vp9',
      '-crf',      '30',
      '-b:v',      '0',             // CRF mode for VP9 requires b:v 0
      '-pix_fmt',  'yuva420p',
      '-y',
      this.opts.outputPath,
    ]
  }

  private gifArgs(): string[] {
    // Two-pass palette approach for best GIF quality
    // Pass 1 generates a palette, pass 2 uses it
    // Since we pipe stdin we use the single-pass palettegen+paletteuse filter
    const scale = `${this.opts.width / 2}:-1`   // GIF at 50% resolution
    return [
      '-f',        'image2pipe',
      '-framerate', '15',           // GIF at 15fps max
      '-i',        'pipe:0',
      '-vf',       `fps=15,scale=${scale}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer`,
      '-loop',     '0',             // infinite loop
      '-y',
      this.opts.outputPath,
    ]
  }

  // ── PDF ────────────────────────────────────────────────────────────────────

  /**
   * Build a PDF from accumulated frame buffers.
   * One frame per slide — we use the first frame captured per slide.
   * Requires `pdfkit` and `sharp` packages.
   *
   * Install: npm install pdfkit sharp @types/pdfkit
   */
  private async finalizePdf(): Promise<void> {
    // Dynamic import so pdfkit is only loaded when needed
    const PDFDocument = (await import('pdfkit')).default
    const sharp       = (await import('sharp')).default

    const doc = new PDFDocument({
      autoFirstPage: false,
      size:          [this.opts.width, this.opts.height],
    })

    const writeStream = fs.createWriteStream(this.opts.outputPath)
    doc.pipe(writeStream)

    for (const frame of this.frames) {
      // Convert JPEG buffer to PNG for pdfkit embedding
      const png = await sharp(frame).png().toBuffer()
      doc.addPage({ size: [this.opts.width, this.opts.height] })
      doc.image(png, 0, 0, { width: this.opts.width, height: this.opts.height })
    }

    doc.end()

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
  }
}
```

---

### Create `server/types.ts`

```typescript
export interface ExportProgressEvent {
  stage:        'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
  percent:      number
  message:      string
  url?:         string
  currentSlide?: number
  totalSlides?:  number
}
```

---

## 7. Slide Sequencing Logic

The renderer captures slides in this exact order. This must be followed precisely
by `HeadlessRenderer.captureSlide()`.

```
For each slide i from 0 to totalSlides - 1:

  1. page.evaluate → store.setActiveSlide(i)
     React re-renders the slide canvas.

  2. clock.tick(0) × 2 + setTimeout(16ms)
     Flushes React's render queue and allows Framer Motion to
     initialise its animation values at t=0.

  3. If i > 0 and transitionDuration > 0:
     TRANSITION PHASE:
     frameCount = ceil(transitionDuration / FRAME_MS)
     for f = 0 to frameCount:
       clock.tick(FRAME_MS)             ← Framer Motion advances
       BeginFrame({ screenshot: jpeg }) ← capture composited frame
       encoder.writeFrame(jpegBuffer)

  4. ENTRANCE ANIMATION PHASE:
     for f = 0 to ENTRANCE_FRAMES:
       clock.tick(FRAME_MS)
       BeginFrame(...)
       encoder.writeFrame(...)

  5. STATIC HOLD PHASE:
     clock.tick(remainingHoldMs)        ← jump to end of hold
     BeginFrame(...)                    ← capture settled state
     staticFrame = lastJpegBuffer
     for r = 1 to remainingHoldFrames:
       encoder.writeFrame(staticFrame)  ← repeat without re-capturing
```

**Why repeat the static frame:** Calling `BeginFrame` and `snapshotToBitmap` for
every frame of a 3-second hold at 30fps = 90 BeginFrame calls of a static image.
Each BeginFrame call costs ~2–8ms of real time. 90 × 5ms = 450ms wasted. Writing
the buffer directly to FFmpeg stdin costs ~0.01ms. The output is identical.

---

## 8. VirtualClock Injection Timing

**Critical:** The clock must be installed via `evaluateOnNewDocument`, not `evaluate`.

```typescript
// CORRECT — runs before any page JavaScript:
await page.evaluateOnNewDocument(getVirtualClockScript())
await page.goto(url)

// WRONG — Framer Motion has already started its real-time loop:
await page.goto(url)
await page.evaluate(getVirtualClockScript())
```

`evaluateOnNewDocument` registers the script to execute on every new document
load for this page, before any scripts on the page run. This guarantees the
patched APIs are in place before React mounts, before Framer Motion imports
`performance.now`, and before any `setTimeout` is queued.

---

## 9. State Injection Pattern

The store is exposed on `window.__motionslides_store__` in `editorStore.ts`.
The renderer waits for it to be available then injects the full project:

```typescript
// Wait for app to mount and expose the store
await page.waitForFunction(
  () => !!(window as any).__motionslides_store__,
  { timeout: 15000 }
)

// Inject project data
await page.evaluate((data) => {
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
}, exportData)

// Allow React to commit the state change
await page.evaluate(() =>
  new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
)
```

**Do not** try to inject state via URL parameters, `localStorage`, or
`__PRELOADED_STATE__`. Approach B (direct store injection) is the only method
that works reliably with Zustand's slice architecture.

---

## 10. FFmpeg Command Reference

### MP4 (H.264) — primary format

```bash
ffmpeg \
  -f image2pipe \
  -framerate 30 \
  -i pipe:0 \
  -c:v libx264 \
  -preset medium \
  -crf 18 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -y output.mp4
```

| Flag | Why it is required |
|------|--------------------|
| `-f image2pipe` | Tells FFmpeg the input is a raw pipe of encoded images (JPEG) |
| `-framerate 30` | Input framerate — must match OUTPUT_FPS constant |
| `-i pipe:0` | Read from stdin |
| `-c:v libx264` | H.264 video codec |
| `-preset medium` | Speed/quality tradeoff (`slow` for better compression, `fast` for speed) |
| `-crf 18` | Constant Rate Factor — 0=lossless, 18=near-lossless, 23=default, 51=worst |
| `-pix_fmt yuv420p` | **Required** for QuickTime, iOS, and most media players. Without this, the MP4 will not play on Apple devices |
| `-movflags +faststart` | Moves the moov atom to the beginning so the file starts playing before fully downloaded |
| `-y` | Overwrite output file without prompting |

### WebM (VP9)

```bash
ffmpeg -f image2pipe -framerate 30 -i pipe:0 \
  -c:v libvpx-vp9 -crf 30 -b:v 0 -pix_fmt yuva420p -y output.webm
```

Note: `-b:v 0` is required for VP9 CRF mode.

### GIF

```bash
ffmpeg -f image2pipe -framerate 15 -i pipe:0 \
  -vf "fps=15,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer" \
  -loop 0 -y output.gif
```

The palette filter chain is required for acceptable GIF colour quality.
Without it, FFmpeg uses a default palette that produces heavy dithering artefacts.

### PDF

PDF does not use FFmpeg. See `FfmpegEncoder.finalizePdf()`. One PNG frame
is captured per slide (the first frame after the slide settles) and embedded
into a pdfkit document at the full export resolution.

---

## 11. Critical Constraints

### Must follow exactly

1. **`evaluateOnNewDocument` not `evaluate`** for VirtualClock. See Section 8.

2. **`chrome-headless-shell` not `chromium`**. The `HeadlessExperimental` domain
   only works with `chrome-headless-shell`. Standard Chromium (downloaded by
   `npm install puppeteer`) does not reliably support BeginFrame. Set
   `executablePath` to the `CHROME_EXECUTABLE` env var.

3. **All five time APIs must be patched** in the injected clock. Patching only
   `rAF` and `performance.now` (as in the browser-side VirtualClock) is
   insufficient here. On the server, Chrome is frozen between BeginFrame calls
   so there is no deadlock risk from patching `setTimeout`.

4. **`-pix_fmt yuv420p` is not optional**. Without it, the MP4 will not play
   in QuickTime, VLC on some systems, or any Apple device.

5. **Do not use `html-to-image`** anywhere in the server-side pipeline. Frames
   come from `HeadlessExperimental.beginFrame` only.

6. **Do not use `MediaRecorder`** anywhere in the pipeline.

7. **Image assets must be base64 in sceneGraph**. The headless browser runs in
   a server environment. External image URLs from Unsplash, S3, or any CDN will
   fail due to CORS headers that allow only the frontend origin, not the server.

8. **UUID validation on download endpoint**. The download route must validate
   the jobId matches UUID format before constructing any file path to prevent
   path traversal attacks.

9. **p-queue concurrency limit**. Never remove the queue. Each Chrome instance
   uses 500MB–1GB RAM. Without the limit, two simultaneous exports on a 2GB
   server will OOM-kill the process.

10. **The `/export-view` route must have no editor UI**. No toolbar, no panels,
    no selection handles, no sidebar. Only the slide canvas, fullscreen at the
    viewport size. Any UI chrome will appear in the exported video.

---

## 12. Verification Plan

### After implementation, verify in this order:

**Step 1 — Server boots:**
```bash
cd server && npm run dev
curl http://localhost:3001/health
# Expect: {"ok":true,"queue":0,"pending":0}
```

**Step 2 — Frontend serializes correctly:**
Open the browser console and run:
```javascript
import('/src/lib/sceneGraph.ts').then(m => m.generateSceneGraph()).then(console.log)
```
Confirm the output is valid JSON with no undefined values, no React refs,
and all image srcs are `data:` URLs.

**Step 3 — Store injection works:**
After adding `window.__motionslides_store__` to `editorStore.ts`, verify:
```javascript
window.__motionslides_store__.getState().activeProject()
// Should return the current project
```

**Step 4 — Single slide MP4 export:**
Export a single-slide project with no transitions. Verify:
- File downloads
- Video plays in VLC and QuickTime
- Duration matches `autoplayDelay` setting
- Visual content matches what the editor shows

**Step 5 — Transition export:**
Export a 2-slide project with a Fade transition. Verify:
- Transition is visible between slides
- No jump-cut between slides
- Duration = (slide1 hold) + (transition) + (slide2 hold)

**Step 6 — Magic Move export:**
Export a 2-slide project where the same element exists on both slides
at different positions. Verify the element visibly moves between positions.

**Step 7 — Determinism check:**
Export the same project twice. Compare file sizes. They should be within
5% of each other. For exact hash comparison, ensure `exportedAt` is removed
from the scene graph before hashing.

**Step 8 — GIF export:**
Verify the GIF loops, plays at the correct speed, and has reasonable file size.

**Step 9 — PDF export:**
Verify one page per slide, full resolution, correct aspect ratio.

**Step 10 — Concurrent export:**
Trigger two exports simultaneously. Verify both complete without error and
the server does not crash. Check memory usage stays below 80% of available RAM.

---

## 13. Implementation Checklist

Work through these in order. Do not move to the next item until the current one is complete.

### Frontend
- [ ] Add `window.__motionslides_store__ = useEditorStore` to `editorStore.ts`
- [ ] Create `src/lib/sceneGraph.ts` with `generateSceneGraph()` and `resolveAllImages()`
- [ ] Create `src/lib/exportClient.ts` with `startExport()` SSE reader
- [ ] Create `src/routes/export-view.tsx` — fullscreen canvas, no editor UI
- [ ] Register `/export-view` route in router
- [ ] Update `ExportModal` (or wherever export is triggered) to call `exportClient.startExport()` instead of the old `exportPresentation()`
- [ ] Add `VITE_EXPORT_SERVER_URL` to `.env`

### Backend
- [ ] Create `server/` directory with `package.json` from Section 2
- [ ] Create `server/tsconfig.json` from Section 3
- [ ] Install server dependencies: `npm install` in `server/`
- [ ] Verify `ffmpeg` is available: `ffmpeg -version`
- [ ] Download and configure `chrome-headless-shell`, set `CHROME_EXECUTABLE`
- [ ] Create `server/types.ts`
- [ ] Create `server/renderer/VirtualClock.injected.ts`
- [ ] Create `server/renderer/HeadlessRenderer.ts`
- [ ] Create `server/encoder/FfmpegEncoder.ts`
- [ ] Create `server/index.ts`
- [ ] Create `server/.env` from Section 3

### Verification
- [ ] Run Step 1–10 from Section 12 in order
- [ ] Fix any failures before marking complete