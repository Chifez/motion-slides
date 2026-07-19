import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { projects, projectSuggestions } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '../auth'
import { z } from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { uuid } from '../uuid'
import type { Slide, SlideTransition } from '@motionslides/shared'

export interface ProjectSuggestion {
  id: string
  projectId: string
  authorId: string | null
  authorName: string
  slides: Slide[]
  transitions: SlideTransition[]
  prototypeLayout: Record<string, { x: number; y: number }>
  parentUpdatedAt: number
  status: string
  createdAt: number
  updatedAt: number
}

const suggestionInputSchema = z.object({
  projectId: z.string(),
  shareKey: z.string(),
  authorName: z.string(),
  slides: z.array(z.unknown()),
  transitions: z.array(z.unknown()),
  prototypeLayout: z.record(z.string(), z.object({ x: z.number(), y: z.number() })),
  parentUpdatedAt: z.number(),
})

export const submitSuggestionAction = createServerFn({ method: 'POST' })
  .inputValidator(suggestionInputSchema)
  .handler(async ({ data: suggestionInput }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    const authorId = session?.user?.id ?? null


    const project = await db.query.projects.findFirst({
      where: eq(projects.id, suggestionInput.projectId)
    })

    if (!project) {
      throw new Error('Project not found')
    }

    if (project.visibility !== 'collaborative' || project.shareKey !== suggestionInput.shareKey) {
      throw new Error('Access Denied: This project is not accepting suggestions or the share key is invalid.')
    }

    const suggestionId = uuid()
    const now = Date.now()

    await db.insert(projectSuggestions).values({
      id: suggestionId,
      projectId: suggestionInput.projectId,
      authorId,
      authorName: suggestionInput.authorName ?? 'Collaborator',
      slides: suggestionInput.slides,
      transitions: suggestionInput.transitions,
      prototypeLayout: suggestionInput.prototypeLayout,
      parentUpdatedAt: suggestionInput.parentUpdatedAt,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    return { success: true, suggestionId }
  })

export const listSuggestionsAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data: { projectId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized: Log in required')

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    })

    if (!project) throw new Error('Project not found')
    if (project.ownerId !== session.user.id) throw new Error('Unauthorized: You must be the owner of the project to view suggestions.')

    const suggestions = await db.query.projectSuggestions.findMany({
      where: eq(projectSuggestions.projectId, projectId),
      orderBy: (table, { desc }) => [desc(table.createdAt)]
    })

    return suggestions.map(suggestion => ({
      id: suggestion.id,
      projectId: suggestion.projectId,
      authorId: suggestion.authorId,
      authorName: suggestion.authorName,
      slides: (suggestion.slides ?? []) as Slide[],
      transitions: (suggestion.transitions ?? []) as SlideTransition[],
      prototypeLayout: (suggestion.prototypeLayout ?? {}) as Record<string, { x: number; y: number }>,
      parentUpdatedAt: suggestion.parentUpdatedAt,
      status: suggestion.status,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt,
    }))
  })

export const resolveSuggestionAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    suggestionId: z.string(),
    status: z.enum(['merged', 'rejected']),
    slides: z.array(z.unknown()).optional(),
    transitions: z.array(z.unknown()).optional(),
    prototypeLayout: z.record(z.string(), z.object({ x: z.number(), y: z.number() })).optional(),
  }))
  .handler(async ({ data: { suggestionId, status, slides, transitions, prototypeLayout } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized: Log in required')


    const suggestion = await db.query.projectSuggestions.findFirst({
      where: eq(projectSuggestions.id, suggestionId)
    })

    if (!suggestion) throw new Error('Suggestion not found')
    if (suggestion.status !== 'pending') throw new Error(`Suggestion is already resolved as ${suggestion.status}`)


    const project = await db.query.projects.findFirst({
      where: eq(projects.id, suggestion.projectId)
    })

    if (!project) throw new Error('Project not found')
    if (project.ownerId !== session.user.id) throw new Error('Unauthorized: You must be the owner of the project to resolve suggestions.')

    const now = Date.now()
    await db.transaction(async (transaction) => {

      await transaction.update(projectSuggestions)
        .set({ status, updatedAt: now })
        .where(eq(projectSuggestions.id, suggestionId))


      if (status === 'merged') {
        await transaction.update(projects)
          .set({
            slides: slides ?? suggestion.slides,
            transitions: transitions ?? suggestion.transitions,
            prototypeLayout: prototypeLayout ?? suggestion.prototypeLayout,
            updatedAt: now
          })
          .where(eq(projects.id, suggestion.projectId))
      }
    })

    return { success: true, updatedAt: now }
  })
