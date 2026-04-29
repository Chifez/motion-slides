import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from './auth'

/**
 * getSessionFn — Server function to fetch user session safely.
 * This is used for route-level redirects without touching the global Zustand store.
 */
export const getSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const headers = getRequestHeaders()
  
  try {
    const session = await auth.api.getSession({
      headers,
    })
    return session
  } catch (err) {
    return null
  }
})
