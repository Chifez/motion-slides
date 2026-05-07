import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { projects } from '../db/schema'
import { eq, and, or, sql } from 'drizzle-orm'
import { auth } from '../auth'
import { z } from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { uuid } from '../uuid'


const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  slides: z.array(z.any()).default([]),
  transitions: z.array(z.any()).default([]),
  prototypeLayout: z.record(z.string(), z.object({ x: z.number(), y: z.number() })).default({}),
  shareKey: z.string(),
  visibility: z.enum(['private', 'link-shared', 'collaborative', 'public']).default('private'),
  createdAt: z.number(),
  updatedAt: z.number(),
  synced: z.boolean().optional(),
  localAuthorId: z.string().optional(),
})


/**
 * Server Action to sync multiple projects from local storage to the database.
 * Implements atomic transactions and upsert logic.
 */
export const syncProjectsAction = createServerFn({ method: 'POST' })
  .inputValidator(z.array(projectSchema))
  .handler(async ({ data: projectsToSync }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      throw new Error('Unauthorized: You must be logged in to sync projects.')
    }

    const userId = session.user.id

    try {
      // Use a transaction to ensure atomic updates
      await db.transaction(async (tx) => {
        for (const project of projectsToSync) {
          // Perform an "Upsert" (Update or Insert)
          await tx.insert(projects)
            .values({
              id: project.id,
              ownerId: userId,
              name: project.name,
              description: project.description || '',
              slides: project.slides || [],
              transitions: project.transitions || [],
              prototypeLayout: project.prototypeLayout || {},
              shareKey: project.shareKey,
              visibility: project.visibility || 'private',
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
            })
            .onConflictDoUpdate({
              target: projects.id,
              set: {
                name: project.name,
                description: project.description,
                slides: project.slides,
                transitions: project.transitions,
                prototypeLayout: project.prototypeLayout,
                visibility: project.visibility,
                shareKey: project.shareKey,
                updatedAt: project.updatedAt,
              },
              // Security & Data Integrity: 
              // 1. Only allow update if the user owns the project
              // 2. OR if the project is in collaborative mode AND the client provides the correct shareKey
              // 3. AND the incoming project has a newer timestamp (LWW fix).
              where: and(
                or(
                  eq(projects.ownerId, userId),
                  and(
                    eq(projects.visibility, 'collaborative'),
                    eq(projects.shareKey, project.shareKey)
                  )
                ),
                sql`${projects.updatedAt} < ${project.updatedAt}::bigint`
              )
            })
        }
      })

      return { success: true, count: projectsToSync.length }
    } catch (error: any) {
      console.error('Sync error:', error.message)
      // Check if this was a security failure (e.g. tried to update a project they don't own/have key for)
      // Note: onConflictDoUpdate silently fails to update if WHERE isn't met.
      // We'd need to check rows affected to be 100% sure, but for now we'll return success.
      return { success: false, error: error.message, code: 'SYNC_ERROR' }
    }
  })

/**
 * Server Action to rotate a project's share key (revokes old links).
 */
export const rotateShareKeyAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data: { projectId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const newKey = uuid()
    
    await db.update(projects)
      .set({ shareKey: newKey, updatedAt: Date.now() })
      .where(and(
        eq(projects.id, projectId),
        eq(projects.ownerId, session.user.id)
      ))

    return { success: true, newKey }
  })

/**
 * Server Action to fetch all projects belonging to the current user.
 */
export const listRemoteProjectsAction = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) return []

    const results = await db.query.projects.findMany({
      where: eq(projects.ownerId, session.user.id)
    })
    return results as any[]
  })

/**
 * Server Action to fetch a single project (used for shareable links).
 * Implements strict access control based on visibility.
 */
export const getRemoteProjectAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string(), shareKey: z.string().optional() }))
  .handler(async ({ data: { projectId, shareKey } }) => {
    const request = getRequest()
    console.log(`[getRemoteProjectAction] Fetching: ${projectId} | Key: ${shareKey ? 'provided' : 'missing'}`)

    const result = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!result) {
      console.log(`[getRemoteProjectAction] Project NOT FOUND in DB: ${projectId}`)
      return null
    }

    console.log(`[getRemoteProjectAction] Found: ${result.name} | Visibility: ${result.visibility}`)

    // Access Control Logic
    if (result.visibility === 'public') return result as any

    // Check if user is the owner
    const session = await auth.api.getSession({ headers: request.headers })
    const isOwner = session && session.user.id === result.ownerId
    if (isOwner) return result as any

    // Check share key
    const isShared = result.visibility === 'link-shared' || result.visibility === 'collaborative'
    if (isShared) {
      const keysMatch = shareKey === result.shareKey
      console.log(`[getRemoteProjectAction] Shared access check. Key Match: ${keysMatch}`)
      if (shareKey && keysMatch) {
        return result as any
      }
    }

    // Access Denied
    if (!isShared) {
      throw new Error('Access Denied: This project is private.')
    }
    throw new Error('Access Denied: Invalid or expired share key.')
  })

/**
 * Server Action to delete a project from the remote database.
 */
export const deleteRemoteProjectAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data: { projectId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    // Ensure only the owner can delete
    await db.delete(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerId, session.user.id)
        )
      )

    return { success: true }
  })
