import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

/**
 * Better-auth catch-all handler for TanStack Start.
 * This integrates the auth handler into the TanStack Route tree.
 */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => await auth.handler(request),
      POST: async ({ request }) => {
        const url = new URL(request.url)
        if (url.pathname.endsWith('/forget-password')) {
          const newUrl = new URL(request.url)
          newUrl.pathname = newUrl.pathname.replace(/\/forget-password$/, '/request-password-reset')
          const rewrittenRequest = new Request(newUrl.toString(), request)
          return await auth.handler(rewrittenRequest)
        }
        return await auth.handler(request)
      },
    },
  },
})
