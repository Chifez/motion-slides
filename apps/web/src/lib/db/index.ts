import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('DATABASE_URL is not set. Database features will be unavailable.')
}

// Disable prefetch as it is not supported for some "serverless" postgres environments
// though for a local pgAdmin setup it should be fine.
export const client = postgres(connectionString || '', { prepare: false })
export const db = drizzle(client, { schema })
