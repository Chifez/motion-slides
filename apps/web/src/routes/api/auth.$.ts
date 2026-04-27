import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

/**
 * Better-auth catch-all handler for TanStack Start.
 * This integrates the auth handler into the TanStack Route tree.
 */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
})
