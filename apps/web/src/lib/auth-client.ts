import { createAuthClient } from 'better-auth/react'

/**
 * Better-auth client for the frontend.
 * This handles session management and auth requests.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
})
