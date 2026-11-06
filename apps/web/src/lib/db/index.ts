import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database features will be unavailable.')
}

// Disable prefetch as it is not supported for some "serverless" postgres environments.
// Set max: 1 to prevent edge worker isolates from holding multiple open connections.
// Configure idle_timeout and connect_timeout for serverless isolate freeze/thaw cycles.
export const client = postgres(connectionString || '', {
  prepare: false,
  max: 1,
  idle_timeout: 1,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })

/**
 * Executes a database operation with automatic retry on transient socket errors
 * (e.g. ECONNRESET or socket closure caused by serverless isolate pausing).
 */
export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err: unknown) {
      attempt++
      const msg = (err as Error)?.message || String(err)
      const code = (err as { code?: string })?.code
      const isSocketError =
        code === 'ECONNRESET' ||
        code === 'EPIPE' ||
        msg.includes('Connection terminated') ||
        msg.includes('socket') ||
        msg.includes('closed')
      if (attempt <= maxRetries && isSocketError) {
        console.warn(`Database socket error on attempt ${attempt}, retrying...`, msg)
        continue
      }
      throw err
    }
  }
}

