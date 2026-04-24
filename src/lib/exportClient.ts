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
