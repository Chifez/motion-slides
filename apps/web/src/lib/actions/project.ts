import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { projects } from '../db/schema'
import { eq, and, or, sql } from 'drizzle-orm'
import { auth } from '../auth'
import { z } from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { uuid } from '../uuid'
import type { Project } from '@motionslides/shared'


const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  slides: z.array(z.unknown()).default([]),
  transitions: z.array(z.unknown()).default([]),
  prototypeLayout: z.record(z.string(), z.object({ x: z.number(), y: z.number() })).default({}),
  shareKey: z.string(),
  visibility: z.enum(['private', 'link-shared', 'collaborative', 'public']).default('private'),
  createdAt: z.number(),
  updatedAt: z.number(),
  synced: z.boolean().optional(),
  localAuthorId: z.string().optional(),
})


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
      await db.transaction(async (transaction) => {
        for (const project of projectsToSync) {
          await transaction.insert(projects)
            .values({
              id: project.id,
              ownerId: userId,
              name: project.name,
              description: project.description ?? '',
              slides: project.slides ?? [],
              transitions: project.transitions ?? [],
              prototypeLayout: project.prototypeLayout ?? {},
              shareKey: project.shareKey,
              visibility: project.visibility ?? 'private',
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Sync error:', errorMessage)
      // Check if this was a security failure (e.g. tried to update a project they don't own/have key for)
      // Note: onConflictDoUpdate silently fails to update if WHERE isn't met.
      // We'd need to check rows affected to be 100% sure, but for now we'll return success.
      return { success: false, error: errorMessage, code: 'SYNC_ERROR' }
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
    const updatedAt = Date.now()
    
    await db.update(projects)
      .set({ shareKey: newKey, updatedAt })
      .where(and(
        eq(projects.id, projectId),
        eq(projects.ownerId, session.user.id)
      ))

    return { success: true, newKey, updatedAt }
  })

export const updateProjectVisibilityAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    projectId: z.string(),
    visibility: z.enum(['private', 'link-shared', 'collaborative', 'public']),
    rotateKey: z.boolean().optional(),
  }))
  .handler(async ({ data: { projectId, visibility, rotateKey } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const newKey = rotateKey ? uuid() : undefined
    const updatedAt = Date.now()
    const updates: {
      visibility: typeof visibility
      updatedAt: number
      shareKey?: string
    } = {
      visibility,
      updatedAt,
    }

    if (newKey) {
      updates.shareKey = newKey
    }

    await db.update(projects)
      .set(updates)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.ownerId, session.user.id)
      ))

    return { success: true, shareKey: newKey, updatedAt }
  })

export const listRemoteProjectsAction = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) return []

    const results = await db.query.projects.findMany({
      where: eq(projects.ownerId, session.user.id)
    })
    return results as unknown as Project[]
  })

export const getRemoteProjectAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string(), shareKey: z.string().optional() }))
  .handler(async ({ data: { projectId, shareKey } }) => {
    const request = getRequest()

    const result = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!result) {
      return null
    }

    if (result.visibility === 'public') return result as unknown as Project

    const session = await auth.api.getSession({ headers: request.headers })
    const isOwner = session && session.user.id === result.ownerId
    if (isOwner) return result as unknown as Project

    const isShared = result.visibility === 'link-shared' || result.visibility === 'collaborative'
    if (isShared) {
      const keysMatch = shareKey === result.shareKey
      if (shareKey && keysMatch) {
        return result as unknown as Project
      }
    }

    if (!isShared) {
      throw new Error('Access Denied: This project is private.')
    }
    throw new Error('Access Denied: Invalid or expired share key.')
  })

export const deleteRemoteProjectAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data: { projectId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    await db.delete(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.ownerId, session.user.id)
        )
      )

    return { success: true }
  })
