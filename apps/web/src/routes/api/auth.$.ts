import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

/**
 * Better-auth catch-all handler for TanStack Start.
 * This integrates the auth handler into the TanStack Route tree.
 */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const res = await auth.handler(request)
          if (res.status >= 500) {
            console.warn(`[auth.handler GET] Server returned ${res.status}, retrying for serverless isolate recovery...`)
            return await auth.handler(request)
          }
          return res
        } catch (err) {
          console.warn('[auth.handler GET] Caught exception, retrying once...', err)
          try {
            return await auth.handler(request)
          } catch (retryErr) {
            console.error('[auth.handler GET] Retry also failed:', retryErr)
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }
      },
      POST: async ({ request }) => {
        const clonedRequest = request.clone()
        const url = new URL(request.url)
        let targetRequest = request
        if (url.pathname.endsWith('/forget-password')) {
          const newUrl = new URL(request.url)
          newUrl.pathname = newUrl.pathname.replace(/\/forget-password$/, '/request-password-reset')
          targetRequest = new Request(newUrl.toString(), request)
        }

        try {
          const res = await auth.handler(targetRequest)
          if (res.status >= 500) {
            console.warn(`[auth.handler POST] Server returned ${res.status}, retrying for serverless isolate recovery...`)
            return await auth.handler(clonedRequest)
          }
          return res
        } catch (err) {
          console.warn('[auth.handler POST] Caught exception, retrying once...', err)
          try {
            return await auth.handler(clonedRequest)
          } catch (retryErr) {
            console.error('[auth.handler POST] Retry also failed:', retryErr)
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }
        }
      },
    },
  },
})
