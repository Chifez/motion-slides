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
import Redis from 'ioredis'
import { getStorageDir } from './storage.js'
import {
  exportQueue,
  initExportWorker,
  getExportHash,
  getCachedExport,
  startDiskCleanupTimer,
} from './queue.js'
import { workbench } from '@getworkbench/express'

// ─── Setup ────────────────────────────────────────────────────────────────────

const app        = express()
const PORT       = process.env.PORT ?? 3001
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(getStorageDir(), 'exports')
const EXPORT_TIMEOUT = parseInt(process.env.EXPORT_TIMEOUT_MS ?? '300000')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))  // Safe limit for large base64 images

const basicAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Workbench"')
    return res.status(401).send('Authentication required')
  }

  try {
    const authParts = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':')
    const user = authParts[0]
    const pass = authParts[1]

    const adminUser = process.env.ADMIN_USER ?? 'admin'
    const adminPass = process.env.ADMIN_PASS ?? 'admin'

    if (user === adminUser && pass === adminPass) {
      return next()
    }
  } catch (err) {
    // Fail silently
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Workbench"')
  return res.status(401).send('Authentication required')
}

async function verifySession(req: express.Request, res: express.Response, next: express.NextFunction) {
  const cookie = req.headers.cookie
  const authorization = req.headers.authorization

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'

  try {
    const response = await fetch(`${frontendUrl}/api/auth/get-session`, {
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(authorization ? { authorization } : {}),
      }
    })

    if (!response.ok) {
      return res.status(401).json({ error: 'Unauthorized: Session check failed' })
    }

    const data: any = await response.json()
    if (!data || !data.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' })
    }

    (req as any).user = data.user
    return next()
  } catch (err: any) {
    console.error('[ExportServer Auth Error]:', err?.message || err)
    return res.status(401).json({ error: 'Unauthorized: Authentication service unavailable' })
  }
}

// ─── BullMQ Workbench Dashboard ───────────────────────────────────────────────
app.use(
  '/admin/jobs',
  basicAuth,
  workbench({
    queues: [exportQueue],
  })
)

// ─── POST /api/export ─────────────────────────────────────────────────────────

app.post('/api/export', verifySession, async (req: Request, res: Response) => {
  const { sceneGraph, format = 'mp4' } = req.body

  if (!['mp4', 'webm', 'gif', 'pdf'].includes(format)) {
    return res.status(400).json({ error: 'Invalid export format. Allowed formats: mp4, webm, gif, pdf.' })
  }

  if (!sceneGraph || typeof sceneGraph !== 'object') {
    return res.status(400).json({ error: 'Invalid sceneGraph payload structure.' })
  }
  if (!sceneGraph.project || typeof sceneGraph.project !== 'object' || !sceneGraph.project.id || !Array.isArray(sceneGraph.project.slides)) {
    return res.status(400).json({ error: 'sceneGraph.project is required and must contain valid slides.' })
  }
  if (!sceneGraph.playbackSettings || typeof sceneGraph.playbackSettings !== 'object' || !sceneGraph.playbackSettings.exportResolution) {
    return res.status(400).json({ error: 'sceneGraph.playbackSettings is required and must contain exportResolution.' })
  }

  const hash = getExportHash(sceneGraph, format)

  try {
    const cachedJobId = await getCachedExport(hash)
    if (cachedJobId) {
      console.log(`[ExportServer] Cache HIT for hash ${hash} -> jobId ${cachedJobId}`)
      return res.json({
        status: 'done',
        jobId: cachedJobId,
        cached: true,
        url: `/api/download/${cachedJobId}`
      })
    }

    const jobId = uuid()
    const ext = format === 'pdf' ? 'pdf' : format
    const outPath = path.join(OUTPUT_DIR, `${jobId}.${ext}`)

    await exportQueue.add(
      'render',
      { jobId, sceneGraph, format, outPath, hash },
      {
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { age: 86400, count: 100 },
        removeOnFail: { age: 604800, count: 500 },
      }
    )

    console.log(`[ExportServer] Enqueued new job ${jobId} for hash ${hash}`)
    return res.json({
      status: 'queued',
      jobId,
      cached: false
    })
  } catch (err: any) {
    console.error('[ExportServer] Export endpoint failed:', err)
    return res.status(500).json({ error: err.message ?? 'Failed to enqueue export job' })
  }
})

// ─── GET /api/export/status/:jobId/stream ─────────────────────────────────────

app.get('/api/export/status/:jobId/stream', verifySession, async (req: Request, res: Response) => {
  const { jobId } = req.params

  // Validate — only allow UUID format to prevent path traversal
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(jobId)) {
    return res.status(400).send('Invalid job ID')
  }

  // ── Configure SSE ──────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  // @ts-ignore
  res.setHeader('X-Accel-Buffering', 'no')   // disable nginx buffering
  // @ts-ignore
  if (res.flushHeaders) res.flushHeaders()

  const send = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  const isSecure = REDIS_URL.startsWith('rediss://')
  const rejectUnauthorized = process.env.REDIS_REJECT_UNAUTHORIZED === 'false' ? false : true
  const subscriber = new Redis(REDIS_URL, {
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    tls: isSecure ? { rejectUnauthorized } : undefined,
  })
  subscriber.on('error', (err) => {
    console.error(`[Redis Subscriber Error for ${jobId}]:`, err)
  })
  const channel = `job:progress:${jobId}`

  try {
    const job = await exportQueue.getJob(jobId)
    if (job) {
      const state = await job.getState()
      if (state === 'completed') {
        send({ stage: 'done', percent: 100, message: 'Export complete!', url: `/api/download/${jobId}` })
        res.end()
        await subscriber.disconnect()
        return
      } else if (state === 'failed') {
        send({ stage: 'error', percent: 0, message: job.failedReason ?? 'Render failed.' })
        res.end()
        await subscriber.disconnect()
        return
      }
    }
  } catch (err) {
    console.error(`Error querying status for job ${jobId}:`, err)
  }

  await subscriber.subscribe(channel)

  subscriber.on('message', (chan, message) => {
    try {
      const event = JSON.parse(message)
      send(event)
      if (event.stage === 'done' || event.stage === 'error') {
        res.end()
        subscriber.unsubscribe(channel).then(() => subscriber.disconnect())
      }
    } catch (e) {
      console.error('Error parsing SSE event:', e)
    }
  })

  req.on('close', async () => {
    await subscriber.unsubscribe(channel)
    await subscriber.disconnect()
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

  const filenameQuery = req.query.filename as string | undefined
  const safeFilename = filenameQuery
    ? filenameQuery.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
    : 'motionslides'

  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.${ext}"`)
  res.setHeader('Content-Type', mimeTypes[ext] ?? 'application/octet-stream')
  fs.createReadStream(filePath).pipe(res)
})

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  try {
    const activeCount = await exportQueue.getActiveCount()
    const waitingCount = await exportQueue.getWaitingCount()
    res.json({
      ok:      true,
      queue:   waitingCount,
      pending: activeCount,
    })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ─── Start ────────────────────────────────────────────────────────────────────

initExportWorker()
startDiskCleanupTimer()

// ─── Environment Variables Validation ─────────────────────────────────────────
if (!process.env.FRONTEND_URL) {
  console.warn('[Warning] FRONTEND_URL is not set. Defaulting to http://localhost:3000')
}

if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
  throw new Error(
    '[ExportServer] ADMIN_USER and ADMIN_PASS environment variables must be set. ' +
    'The /admin/jobs dashboard cannot be secured without them.'
  )
}

app.listen(PORT, () => {
  console.log(`[ExportServer] http://localhost:${PORT}`)
  console.log(`[ExportServer] Frontend: ${process.env.FRONTEND_URL ?? 'http://localhost:3000'}`)
  console.log(`[ExportServer] Chrome:   ${process.env.CHROME_EXECUTABLE ?? 'default puppeteer'}`)
})

