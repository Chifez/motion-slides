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

import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors    from 'cors'
import fs      from 'fs'
import path    from 'path'
import os      from 'os'
import { v4 as uuid }  from 'uuid'
import PQueue  from 'p-queue'
import { HeadlessRenderer } from './renderer/HeadlessRenderer.js'
import type { ExportProgressEvent } from '@motionslides/shared'

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
  // @ts-ignore
  res.setHeader('X-Accel-Buffering', 'no')   // disable nginx buffering
  // @ts-ignore
  if (res.flushHeaders) res.flushHeaders()

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
