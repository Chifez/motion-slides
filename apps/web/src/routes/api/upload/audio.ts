import { createFileRoute } from '@tanstack/react-router'
import fs from 'fs'
import path from 'path'
import { isValidAudioFile } from '@/lib/utils'

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

          // Validate file type
          if (!isValidAudioFile(file)) {
            return new Response(JSON.stringify({ error: 'Uploaded file is not a valid audio file' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Extract file extension or default to .mp3
          const originalExt = path.extname(file.name)
          const ext = originalExt ? originalExt : '.mp3'
          
          // Generate unique file name
          const uniqueId = crypto.randomUUID()
          const safeName = `${Date.now()}-${uniqueId}${ext}`

          // Configure save directory to public/uploads
          const uploadsDir = path.join(process.cwd(), 'apps', 'web', 'public', 'uploads')
          fs.mkdirSync(uploadsDir, { recursive: true })
          const filePath = path.join(uploadsDir, safeName)

          // Write file buffer to local disk
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          await fs.promises.writeFile(filePath, buffer)

          // Public access URL in dev/prod
          const url = `/api/uploads/${safeName}`
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
