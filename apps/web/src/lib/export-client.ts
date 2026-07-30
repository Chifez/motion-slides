/**
 * exportClient.ts
 *
 * Sends the ExportProject to the backend and reads progress via SSE
 * from the same POST response body (no separate progress endpoint).
 */

import { generateSceneGraph } from './scene-graph'
import type { ExportFormat, ExportProgressEvent } from '@motionslides/shared'

export type { ExportProgressEvent }

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

  // ── POST to backend to enqueue job (or get cache hit) ────────────────────
  let response: Response
  try {
    response = await fetch(`${serverUrl}/api/export`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sceneGraph, format }),
      credentials: 'include',
    })
  } catch (err) {
    onProgress({ stage: 'error', percent: 0, message: 'Could not reach export server. Is it running?' })
    return null
  }

  if (!response.ok) {
    onProgress({ stage: 'error', percent: 0, message: `Server error: ${response.status}` })
    return null
  }

  let data: { status: string; jobId: string; cached: boolean; url?: string }
  try {
    data = await response.json()
  } catch {
    onProgress({ stage: 'error', percent: 0, message: 'Invalid response from server' })
    return null
  }

  const projectName = sceneGraph.project.name || 'motionslides-export'
  const safeName = projectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()

  // ── Handle Cache Hit ─────────────────────────────────────────────────────
  if (data.status === 'done' && data.url) {
    onProgress({ stage: 'done', percent: 100, message: 'Export complete (cached)!' })
    const downloadUrl = data.url.startsWith('http')
      ? data.url
      : `${serverUrl}${data.url}?filename=${encodeURIComponent(safeName)}`
    triggerDownload(downloadUrl, `${safeName}.${format}`)
    return downloadUrl
  }

  const jobId = data.jobId
  if (!jobId) {
    onProgress({ stage: 'error', percent: 0, message: 'Server did not return a Job ID' })
    return null
  }

  // ── Establish SSE connection to stream status ────────────────────────────
  onProgress({ stage: 'preparing', percent: 5, message: 'Job enqueued. Connecting to progress stream…' })

  let sseResponse: Response
  try {
    sseResponse = await fetch(`${serverUrl}/api/export/status/${jobId}/stream`, {
      credentials: 'include',
    })
  } catch (err) {
    onProgress({ stage: 'error', percent: 0, message: 'Failed to connect to export status stream.' })
    return null
  }

  if (!sseResponse.ok) {
    onProgress({ stage: 'error', percent: 0, message: `Status connection error: ${sseResponse.status}` })
    return null
  }

  if (!sseResponse.body) {
    onProgress({ stage: 'error', percent: 0, message: 'Server returned empty status body' })
    return null
  }

  // ── Read SSE progress events ─────────────────────────────────────────────
  const reader  = sseResponse.body.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''
  let   downloadUrl: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer      = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6)) as ExportProgressEvent
        onProgress(event)

        if (event.stage === 'done' && event.url) {
          downloadUrl = event.url.startsWith('http')
            ? event.url
            : `${serverUrl}${event.url}?filename=${encodeURIComponent(safeName)}`
          triggerDownload(downloadUrl, `${safeName}.${format}`)
        }

        if (event.stage === 'error') {
          return null
        }
      } catch {
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

