import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { db, withDbRetry } from '../db'
import { allowlist } from '../db/schema'
import { auth } from '../auth'
import { eq, desc } from 'drizzle-orm'
import { uuid } from '../uuid'

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || 'chifez1@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.trim().toLowerCase())
}

/**
 * Returns current Private Beta status and whether current user is an admin.
 */
export const getBetaStatusAction = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    const isAdmin = isUserAdmin(session?.user?.email)
    const isPrivateBeta = process.env.PRIVATE_BETA === 'true'

    return {
      isPrivateBeta,
      isAdmin,
      userEmail: session?.user?.email ?? null,
    }
  })

/**
 * Lists all invited/allowed emails in the system. (Admin only)
 */
export const listAllowedEmailsAction = createServerFn({ method: 'GET' })
  .handler(async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !isUserAdmin(session.user.email)) {
      throw new Error('Unauthorized: Admin access required.')
    }

    const items = await withDbRetry(() =>
      db.query.allowlist.findMany({
        orderBy: desc(allowlist.createdAt),
      })
    )

    return {
      isPrivateBeta: process.env.PRIVATE_BETA === 'true',
      items: items.map(item => ({
        id: item.id,
        email: item.email,
        notes: item.notes,
        addedBy: item.addedBy,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
      })),
    }
  })

/**
 * Adds one or more emails / domain wildcards to the allowlist. (Admin only)
 */
export const addAllowedEmailAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    email: z.string().min(2),
    notes: z.string().optional(),
  }))
  .handler(async ({ data: { email, notes } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !isUserAdmin(session.user.email)) {
      throw new Error('Unauthorized: Admin access required.')
    }

    const trimmed = email.trim().toLowerCase()
    const id = uuid()

    await withDbRetry(() =>
      db.insert(allowlist)
        .values({
          id,
          email: trimmed,
          notes: notes?.trim() || null,
          addedBy: session.user.email,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: allowlist.email,
          set: {
            notes: notes?.trim() || null,
            addedBy: session.user.email,
          },
        })
    )

    return { success: true, id, email: trimmed }
  })

/**
 * Removes an email from the allowlist. (Admin only)
 */
export const removeAllowedEmailAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    id: z.string(),
  }))
  .handler(async ({ data: { id } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || !isUserAdmin(session.user.email)) {
      throw new Error('Unauthorized: Admin access required.')
    }

    await withDbRetry(() =>
      db.delete(allowlist).where(eq(allowlist.id, id))
    )

    return { success: true }
  })
