/**
 * queue.ts
 *
 * Configures Redis connections, the BullMQ Export Queue,
 * the Background Worker, Pub/Sub helpers, and Export caching.
 */

import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import { HeadlessRenderer } from './renderer/HeadlessRenderer.js'
import type { ExportProgressEvent } from '@motionslides/shared'

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(process.cwd(), 'exports')
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const CHROME_EXECUTABLE = process.env.CHROME_EXECUTABLE
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_EXPORTS ?? '2')

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// ─── Redis Connections ────────────────────────────────────────────────────────
const isSecure = REDIS_URL.startsWith('rediss://')
const rejectUnauthorized = process.env.REDIS_REJECT_UNAUTHORIZED === 'false' ? false : true
const redisOptions = {
  maxRetriesPerRequest: null,
  tls: isSecure ? { rejectUnauthorized } : undefined,
}

// BullMQ requires maxRetriesPerRequest: null
export const redisConnection = new Redis(REDIS_URL, redisOptions)
redisConnection.on('error', (err) => {
  console.error('[Redis Connection Error]:', err)
})

const pubOptions = isSecure ? { tls: { rejectUnauthorized } } : {}
export const redisPubClient = new Redis(REDIS_URL, pubOptions)
redisPubClient.on('error', (err) => {
  console.error('[Redis Pub Client Error]:', err)
})

// ─── Disk Garbage Collection ──────────────────────────────────────────────────
/**
 * Periodically deletes exported files older than maxAgeMs from disk.
 * Default: Scans every 1 hour, deletes files older than 24 hours.
 */
export function startDiskCleanupTimer(intervalMs = 3600000, maxAgeMs = 86400000): void {
  console.log(`[DiskCleanup] Initialized. Scanning folder: ${OUTPUT_DIR}`)
  
  // Run an initial cleanup run 5 seconds after startup
  setTimeout(runGC, 5000)

  // Schedule recurring scans
  setInterval(runGC, intervalMs)

  function runGC() {
    fs.readdir(OUTPUT_DIR, (err, files) => {
      if (err) {
        console.error('[DiskCleanup] Failed to read exports directory:', err)
        return
      }

      const now = Date.now()
      let deletedCount = 0

      files.forEach(file => {
        if (file.startsWith('.')) return // Skip dotfiles

        const filePath = path.join(OUTPUT_DIR, file)
        fs.stat(filePath, (err, stats) => {
          if (err) return

          if (stats.isFile() && (now - stats.mtimeMs) > maxAgeMs) {
            fs.unlink(filePath, (unlinkErr) => {
              if (!unlinkErr) {
                deletedCount++
              }
            })
          }
        })
      })
    })
  }
}

// ─── BullMQ Queue ─────────────────────────────────────────────────────────────
export const queueName = 'export-jobs'
export const exportQueue = new Queue(queueName, {
  connection: redisConnection as any,
})

// ─── Caching Helpers ──────────────────────────────────────────────────────────
/**
 * Calculates SHA-256 hash of a sceneGraph and export format.
 */
export function getExportHash(sceneGraph: any, format: string): string {
  const data = JSON.stringify({ sceneGraph, format })
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Checks if an export exists in the Redis cache.
 */
export async function getCachedExport(hash: string): Promise<string | null> {
  const cacheKey = `export:cache:${hash}`
  const fileId = await redisConnection.get(cacheKey)
  if (!fileId) return null

  const extensions = ['mp4', 'webm', 'gif', 'pdf']
  const filePath = extensions
    .map(ext => path.join(OUTPUT_DIR, `${fileId}.${ext}`))
    .find(p => fs.existsSync(p))

  if (!filePath) {
    await redisConnection.del(cacheKey)
    return null
  }

  return fileId
}

/**
 * Caches a completed export in Redis.
 * Default TTL: 24 hours.
 */
export async function setCachedExport(hash: string, fileId: string, ttlSeconds = 86400): Promise<void> {
  const cacheKey = `export:cache:${hash}`
  await redisConnection.setex(cacheKey, ttlSeconds, fileId)
}

// ─── Pub/Sub Progress Helper ──────────────────────────────────────────────────
export function publishJobProgress(jobId: string, progressEvent: ExportProgressEvent): void {
  const channel = `job:progress:${jobId}`
  redisPubClient.publish(channel, JSON.stringify(progressEvent))
}

// ─── Background Worker ────────────────────────────────────────────────────────
export interface ExportJobData {
  jobId: string
  sceneGraph: any
  format: string
  outPath: string
  hash: string
}

export let exportWorker: Worker | null = null

export function initExportWorker(): void {
  if (exportWorker) return

  exportWorker = new Worker<ExportJobData>(
    queueName,
    async (job: Job<ExportJobData>) => {
      const { jobId, sceneGraph, format, outPath, hash } = job.data

      console.log(`[Worker] Started processing job ${jobId} (${format})`)

      // Path traversal validation (defensive check)
      const resolvedPath = path.resolve(outPath)
      const resolvedOutputDir = path.resolve(OUTPUT_DIR)
      if (!resolvedPath.startsWith(resolvedOutputDir)) {
        throw new Error('Security Error: Invalid output path traversal detected')
      }

      const sendProgress = (event: ExportProgressEvent) => {
        job.updateProgress(event.percent)
        
        publishJobProgress(jobId, event)
      }

      const renderer = new HeadlessRenderer({
        frontendUrl: FRONTEND_URL,
        chromeExecutable: CHROME_EXECUTABLE,
        outputPath: outPath,
        format,
        onProgress: sendProgress,
      })

      try {
        await renderer.render(sceneGraph)

        await setCachedExport(hash, jobId)

        sendProgress({
          stage: 'done',
          percent: 100,
          message: 'Export complete!',
          url: `/api/download/${jobId}`,
        })
      } catch (err: any) {
        console.error(`[Worker] Failed job ${jobId}: ${err?.message || err}`)
        sendProgress({
          stage: 'error',
          percent: 0,
          message: err?.message ?? 'Render failed.',
        })
        throw err
      }
    },
    {
      connection: redisConnection as any,
      concurrency: MAX_CONCURRENT,
    }
  )

  exportWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully`)
  })

  exportWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message)
  })
}
