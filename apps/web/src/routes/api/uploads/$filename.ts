import { createFileRoute } from '@tanstack/react-router'
import { getStorageProvider } from '@/lib/storage'

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
          headers.set('Cache-Control', 'private, max-age=31536000, immutable')

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
