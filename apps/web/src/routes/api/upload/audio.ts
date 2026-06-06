import { createFileRoute } from '@tanstack/react-router'
import { isValidAudioFile } from '@/lib/utils'
import { getStorageProvider } from '@/lib/storage'

export const Route = createFileRoute('/api/upload/audio')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData()
          const file = formData.get('file') as File | null
          const durationStr = formData.get('duration') as string | null

          if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (!isValidAudioFile(file)) {
            return new Response(JSON.stringify({ error: 'Uploaded file is not a valid audio file' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const arrayBuffer = await file.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)

          const storage = getStorageProvider()
          const { url } = await storage.uploadFile(uint8Array, file.name, file.type || 'audio/webm')

          const duration = durationStr ? parseFloat(durationStr) : 0


          return new Response(
            JSON.stringify({
              url,
              fileName: file.name,
              duration,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        } catch (err: any) {
          console.error('[API Upload Audio] Failed:', err)
          return new Response(JSON.stringify({ error: err?.message || 'Upload failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
