import { createFileRoute } from '@tanstack/react-router'
import { getStorageProvider } from '@/lib/storage'

function parseByteRange(rangeHeader: string, totalBytes: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim())
  if (!match) return null

  const [, startStr, endStr] = match
  if (startStr === '' && endStr === '') return null

  let start = 0
  let end = totalBytes - 1

  if (startStr === '') {
    const suffixLength = Number(endStr)
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null
    start = Math.max(0, totalBytes - suffixLength)
  } else {
    start = Number(startStr)
    if (endStr !== '') {
      end = Math.min(totalBytes - 1, Number(endStr))
    }
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= totalBytes) {
    return null
  }
  return { start, end }
}

export const Route = createFileRoute('/api/uploads/$filename')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const { filename } = params
          const storage = getStorageProvider(request)
          const object = await storage.getUpload(filename)
          if (!object) {
            return new Response(JSON.stringify({ error: 'File not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const headers = new Headers()
          object.writeHttpMetadata(headers)
          if (object.httpEtag) headers.set('etag', object.httpEtag)
          headers.set('Accept-Ranges', 'bytes')
          headers.set('Cache-Control', 'private, max-age=31536000, immutable')

          if (object.body instanceof Uint8Array) {
            const bytes = object.body
            const total = bytes.byteLength
            const rangeHeader = request.headers.get('range')

            if (rangeHeader) {
              const range = parseByteRange(rangeHeader, total)
              if (!range) {
                headers.set('Content-Range', `bytes */${total}`)
                return new Response(null, { status: 416, headers })
              }
              const chunk = bytes.slice(range.start, range.end + 1)
              headers.set('Content-Range', `bytes ${range.start}-${range.end}/${total}`)
              headers.set('Content-Length', String(chunk.byteLength))
              return new Response(chunk, { status: 206, headers })
            }

            headers.set('Content-Length', String(total))
            return new Response(bytes.slice(), { status: 200, headers })
          }

          return new Response(object.body, {
            status: 200,
            headers,
          })
        } catch (err: any) {
          console.error('[API Get Uploaded File] Failed:', err)
          return new Response(JSON.stringify({ error: err?.message || 'Failed to read file' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
