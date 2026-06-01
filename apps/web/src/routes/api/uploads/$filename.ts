import { createFileRoute } from '@tanstack/react-router'
import fs from 'fs'
import path from 'path'

export const Route = createFileRoute('/api/uploads/$filename')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { filename } = params
          const uploadsDir = path.join(process.cwd(), 'apps', 'web', 'public', 'uploads')
          const filePath = path.join(uploadsDir, filename)

          // Defensive path traversal protection
          const resolvedPath = path.resolve(filePath)
          const resolvedUploadsDir = path.resolve(uploadsDir)
          if (!resolvedPath.startsWith(resolvedUploadsDir)) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (!fs.existsSync(filePath)) {
            return new Response(JSON.stringify({ error: 'File not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const ext = path.extname(filename).toLowerCase()
          let contentType = 'audio/mpeg'
          if (ext === '.wav') contentType = 'audio/wav'
          else if (ext === '.webm') contentType = 'audio/webm'
          else if (ext === '.ogg') contentType = 'audio/ogg'
          else if (ext === '.m4a') contentType = 'audio/x-m4a'

          const fileBuffer = await fs.promises.readFile(filePath)
          
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Length': fileBuffer.byteLength.toString(),
              'Accept-Ranges': 'bytes',
            },
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
