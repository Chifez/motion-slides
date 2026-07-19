import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { projects, projectCommits, pullRequests, pullRequestComments } from '../db/schema'
import { eq, and, or, sql } from 'drizzle-orm'
import { auth } from '../auth'
import { z } from 'zod'
import { getRequest } from '@tanstack/react-start/server'
import { uuid } from '../uuid'
import type { Project, Slide, SlideTransition } from '@motionslides/shared'

// Type helper for Commit
export interface GitCommit {
  id: string
  projectId: string
  parentCommitId: string | null
  authorId: string | null
  authorName: string
  message: string
  slides: Slide[]
  transitions: SlideTransition[]
  prototypeLayout: Record<string, { x: number; y: number }>
  createdAt: number
}

const commitSchema = z.object({
  id: z.string(),
  parentCommitId: z.string().nullable(),
  authorId: z.string().nullable(),
  authorName: z.string(),
  message: z.string(),
  slides: z.array(z.unknown()),
  transitions: z.array(z.unknown()),
  prototypeLayout: z.record(z.string(), z.object({ x: z.number(), y: z.number() })),
  createdAt: z.number(),
})

async function verifyProjectAccess(projectId: string, userId: string): Promise<any> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })

  if (!project) throw new Error('Project not found')

  const isOwner = project.ownerId === userId
  const isPublic = project.visibility === 'public' || project.visibility === 'collaborative'
  
  if (!isOwner && !isPublic) {
    throw new Error('Access Denied: You do not have permission to access this project.')
  }
  return project
}

async function verifyPRAccess(prId: string, userId: string) {
  const pr = await db.query.pullRequests.findFirst({
    where: eq(pullRequests.id, prId),
  })
  if (!pr) throw new Error('Pull Request not found')

  const source = await db.query.projects.findFirst({
    where: eq(projects.id, pr.sourceProjectId),
  })
  const target = await db.query.projects.findFirst({
    where: eq(projects.id, pr.targetProjectId),
  })

  if (!source || !target) throw new Error('Projects associated with PR not found')

  const hasSourceAccess = source.ownerId === userId || source.visibility === 'public' || source.visibility === 'collaborative'
  const hasTargetAccess = target.ownerId === userId || target.visibility === 'public' || target.visibility === 'collaborative'

  if (!hasSourceAccess && !hasTargetAccess) {
    throw new Error('Access Denied: You do not have permission to access this pull request.')
  }

  return { pr, source, target }
}

// Recursive helper to fetch all upstream ancestor commits
async function fetchUpstreamCommits(forkedFromId: string): Promise<GitCommit[]> {
  const list: GitCommit[] = []
  let currentId: string | null = forkedFromId

  while (currentId) {
    const projectRecord: any = await db.query.projects.findFirst({
      where: eq(projects.id, currentId),
    })
    if (!projectRecord) break

    const commits = await db.query.projectCommits.findMany({
      where: eq(projectCommits.projectId, currentId),
    })

    list.push(...(commits as unknown as GitCommit[]))
    currentId = projectRecord.forkedFromId
  }

  return list
}

// Helper to initialize a baseline commit for legacy projects lacking git history
async function ensureBaselineCommit(projectId: string, userId: string, userName: string): Promise<string> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })

  if (!project) throw new Error('Project not found')
  if (project.headCommitId) return project.headCommitId

  const commitId = uuid()
  const now = Date.now()

  await db.insert(projectCommits).values({
    id: commitId,
    projectId,
    parentCommitId: null,
    authorId: userId,
    authorName: userName,
    message: 'Base system baseline state',
    slides: project.slides,
    transitions: project.transitions,
    prototypeLayout: project.prototypeLayout,
    createdAt: now,
  })

  await db.update(projects)
    .set({ headCommitId: commitId })
    .where(eq(projects.id, projectId))

  return commitId
}

// 1. Create Branch (replaces Fork Project)
export const createBranchAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    projectId: z.string(),
    name: z.string().optional(),
  }))
  .handler(async ({ data: { projectId, name } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized: Log in required')

    const parentProject = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!parentProject) throw new Error('Parent project not found')

    // Access check (owner, public, or sharing access)
    const isOwner = parentProject.ownerId === session.user.id
    const isPublic = parentProject.visibility === 'public' || parentProject.visibility === 'collaborative'
    if (!isOwner && !isPublic) {
      throw new Error('Access Denied: You cannot fork this private project.')
    }

    const headCommitId = await ensureBaselineCommit(parentProject.id, parentProject.ownerId, 'Owner')

    const forkId = uuid()
    const now = Date.now()

    const branchData = {
      id: forkId,
      ownerId: session.user.id, // Branch is owned by the user who creates it
      name: name || `${parentProject.name} (Branch)`,
      description: parentProject.description || '',
      slides: parentProject.slides,
      transitions: parentProject.transitions,
      prototypeLayout: parentProject.prototypeLayout,
      playbackSettings: parentProject.playbackSettings,
      shareKey: parentProject.shareKey, // Inherit shareKey
      visibility: parentProject.visibility, // Inherit visibility
      createdAt: now,
      updatedAt: now,
      forkedFromId: parentProject.id,
      headCommitId,
    }

    await db.insert(projects).values(branchData)

    return { success: true, project: branchData as unknown as Project }
  })

// 2. Push Local Commits to Server
export const pushCommitsAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    projectId: z.string(),
    commits: z.array(commitSchema),
  }))
  .handler(async ({ data: { projectId, commits } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) throw new Error('Project not found')
    if (project.ownerId !== session.user.id) {
      throw new Error('Access Denied: Only project owners can push commits.')
    }

    if (commits.length === 0) return { success: true }

    await db.transaction(async (tx) => {
      for (const commit of commits) {
        // Insert commit if not present
        const existing = await tx.query.projectCommits.findFirst({
          where: eq(projectCommits.id, commit.id),
        })

        if (!existing) {
          await tx.insert(projectCommits).values({
            id: commit.id,
            projectId,
            parentCommitId: commit.parentCommitId,
            authorId: session.user.id,
            authorName: commit.authorName,
            message: commit.message,
            slides: commit.slides,
            transitions: commit.transitions,
            prototypeLayout: commit.prototypeLayout,
            createdAt: commit.createdAt,
          })
        }
      }

      // Update the active project head commit and state
      const latestCommit = commits[commits.length - 1]
      await tx.update(projects)
        .set({
          headCommitId: latestCommit.id,
          slides: latestCommit.slides,
          transitions: latestCommit.transitions,
          prototypeLayout: latestCommit.prototypeLayout,
          updatedAt: Date.now(),
        })
        .where(eq(projects.id, projectId))
    })

    return { success: true }
  })

// 3. Pull Upstream/Remote Commits
export const pullCommitsAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data: { projectId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const project = await verifyProjectAccess(projectId, session.user.id)

    const projectCommitsList = await db.query.projectCommits.findMany({
      where: eq(projectCommits.projectId, projectId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    })

    let upstreamCommitsList: GitCommit[] = []
    if (project.forkedFromId) {
      upstreamCommitsList = await fetchUpstreamCommits(project.forkedFromId)
    }

    return {
      projectCommits: projectCommitsList as unknown as GitCommit[],
      upstreamCommits: upstreamCommitsList,
    }
  })

// 4. Create Pull Request (Merge Request)
export const createPRAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    sourceProjectId: z.string(),
    targetProjectId: z.string(),
    title: z.string(),
    description: z.string().default(''),
  }))
  .handler(async ({ data: { sourceProjectId, targetProjectId, title, description } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const source = await db.query.projects.findFirst({
      where: eq(projects.id, sourceProjectId),
    })
    const target = await db.query.projects.findFirst({
      where: eq(projects.id, targetProjectId),
    })

    if (!source || !target) throw new Error('Source or Target project not found')
    if (source.ownerId !== session.user.id) throw new Error('Access Denied: You do not own the source project.')

    const isTargetOwner = target.ownerId === session.user.id
    const isTargetPublic = target.visibility === 'public' || target.visibility === 'collaborative'
    if (!isTargetOwner && !isTargetPublic) {
      throw new Error('Access Denied: You do not have permission to propose a Pull Request to this target project.')
    }

    const now = Date.now()

    // Auto-commit on PR creation: inject a new commit matching the exact current state of the source branch.
    const sourceCommitId = uuid()
    await db.insert(projectCommits).values({
      id: sourceCommitId,
      projectId: source.id,
      parentCommitId: source.headCommitId,
      authorId: session.user.id,
      authorName: session.user.name || 'Author',
      message: title,
      slides: source.slides,
      transitions: source.transitions,
      prototypeLayout: source.prototypeLayout,
      createdAt: now,
    })
    await db.update(projects).set({ headCommitId: sourceCommitId }).where(eq(projects.id, source.id))

    // Ensure the target has a baseline commit if it doesn't already
    const targetCommitId = await ensureBaselineCommit(target.id, target.ownerId, 'Owner')

    const prId = uuid()

    await db.insert(pullRequests).values({
      id: prId,
      sourceProjectId,
      targetProjectId,
      sourceCommitId,
      targetCommitId,
      title,
      description,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    })

    return { success: true, prId }
  })

// 5. List Pull Requests
export const listPRsAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    projectId: z.string(),
    type: z.enum(['incoming', 'outgoing']),
  }))
  .handler(async ({ data: { projectId, type } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    await verifyProjectAccess(projectId, session.user.id)

    let prsList
    if (type === 'incoming') {
      // PRs proposed to our project
      prsList = await db.select({
        pr: pullRequests,
        sourceProjectName: projects.name,
      })
      .from(pullRequests)
      .innerJoin(projects, eq(pullRequests.sourceProjectId, projects.id))
      .where(and(
        eq(pullRequests.targetProjectId, projectId),
        eq(pullRequests.status, 'open')
      ))
    } else {
      // PRs we proposed to upstream projects
      prsList = await db.select({
        pr: pullRequests,
        targetProjectName: projects.name,
      })
      .from(pullRequests)
      .innerJoin(projects, eq(pullRequests.targetProjectId, projects.id))
      .where(eq(pullRequests.sourceProjectId, projectId))
    }

    return prsList.map(item => ({
      ...item.pr,
      projectName: 'sourceProjectName' in item ? item.sourceProjectName : item.targetProjectName,
    }))
  })

// 6. Get PR Details for Diffing
export const getPRDetailsAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ prId: z.string() }))
  .handler(async ({ data: { prId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const { pr } = await verifyPRAccess(prId, session.user.id)

    const sourceCommit = await db.query.projectCommits.findFirst({
      where: eq(projectCommits.id, pr.sourceCommitId),
    })

    const targetCommit = await db.query.projectCommits.findFirst({
      where: eq(projectCommits.id, pr.targetCommitId),
    })

    if (!sourceCommit || !targetCommit) throw new Error('PR Commits not found')

    // Find all commits from source project
    const commits = await db.query.projectCommits.findMany({
      where: eq(projectCommits.projectId, pr.sourceProjectId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    })

    return {
      pr,
      sourceCommit: sourceCommit as unknown as GitCommit,
      targetCommit: targetCommit as unknown as GitCommit,
      commits: commits as unknown as GitCommit[],
    }
  })

// 7. Resolve (Merge/Close) Pull Request
export const resolvePRAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    prId: z.string(),
    status: z.enum(['merged', 'rejected']),
  }))
  .handler(async ({ data: { prId, status } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const pr = await db.query.pullRequests.findFirst({
      where: eq(pullRequests.id, prId),
    })

    if (!pr) throw new Error('Pull Request not found')
    if (pr.status !== 'open') throw new Error('PR is already resolved.')

    const targetProject = await db.query.projects.findFirst({
      where: eq(projects.id, pr.targetProjectId),
    })

    if (!targetProject) throw new Error('Target project not found')
    if (targetProject.ownerId !== session.user.id) {
      throw new Error('Access Denied: Only the target project owner can resolve PRs.')
    }

    const now = Date.now()

    if (status === 'merged') {
      const sourceCommit = await db.query.projectCommits.findFirst({
        where: eq(projectCommits.id, pr.sourceCommitId),
      })

      if (!sourceCommit) throw new Error('Source commit not found')

      const mergeCommitId = uuid()

      await db.transaction(async (tx) => {
        // 1. Copy source commits that belong to this PR merge path to target project's commit history
        const sourceCommits = await tx.query.projectCommits.findMany({
          where: eq(projectCommits.projectId, pr.sourceProjectId),
        })

        for (const sCommit of sourceCommits) {
          const targetCopy = await tx.query.projectCommits.findFirst({
            where: eq(projectCommits.id, sCommit.id),
          })
          if (!targetCopy) {
            await tx.insert(projectCommits).values({
              id: sCommit.id,
              projectId: targetProject.id,
              parentCommitId: sCommit.parentCommitId,
              authorId: sCommit.authorId,
              authorName: sCommit.authorName,
              message: sCommit.message,
              slides: sCommit.slides,
              transitions: sCommit.transitions,
              prototypeLayout: sCommit.prototypeLayout,
              createdAt: sCommit.createdAt,
            })
          }
        }

        // 2. Insert the Merge Commit into the target project's commit history
        await tx.insert(projectCommits).values({
          id: mergeCommitId,
          projectId: targetProject.id,
          parentCommitId: targetProject.headCommitId, // main parent is target's previous head
          authorId: session.user.id,
          authorName: session.user.name || 'Owner',
          message: `Merge Pull Request #${prId.substring(0, 6)}: ${pr.title}`,
          slides: sourceCommit.slides,
          transitions: sourceCommit.transitions,
          prototypeLayout: sourceCommit.prototypeLayout,
          createdAt: now,
        })

        // 3. Update upstream target project's head to the merge commit
        await tx.update(projects)
          .set({
            headCommitId: mergeCommitId,
            slides: sourceCommit.slides,
            transitions: sourceCommit.transitions,
            prototypeLayout: sourceCommit.prototypeLayout,
            updatedAt: now,
          })
          .where(eq(projects.id, targetProject.id))

        // 4. Update the PR status to merged
        await tx.update(pullRequests)
          .set({
            status: 'merged',
            updatedAt: now,
          })
          .where(eq(pullRequests.id, prId))
      })
    } else {
      // Rejected/closed
      await db.update(pullRequests)
        .set({
          status: 'rejected',
          updatedAt: now,
        })
        .where(eq(pullRequests.id, prId))
    }

    return { success: true }
  })

// 8. Get Full Git History Tree (All linked commits)
export const getCommitHistoryAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data: { projectId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const project = await verifyProjectAccess(projectId, session.user.id)

    const commits = await db.query.projectCommits.findMany({
      where: eq(projectCommits.projectId, projectId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    })

    let upstreamCommits: GitCommit[] = []
    if (project.forkedFromId) {
      upstreamCommits = await fetchUpstreamCommits(project.forkedFromId)
    }

    return {
      commits: commits as unknown as GitCommit[],
      upstreamCommits,
    }
  })

// 9. Create PR Comment
export const createPRCommentAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    prId: z.string(),
    slideId: z.string(),
    elementId: z.string().nullable().optional(),
    content: z.string(),
    x: z.number().nullable().optional(),
    y: z.number().nullable().optional(),
  }))
  .handler(async ({ data: { prId, slideId, elementId, content, x, y } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    await verifyPRAccess(prId, session.user.id)

    const commentId = uuid()
    const now = Date.now()

    await db.insert(pullRequestComments).values({
      id: commentId,
      prId,
      slideId,
      elementId: elementId || null,
      x: x || null,
      y: y || null,
      authorId: session.user.id,
      authorName: session.user.name || 'User',
      content,
      createdAt: now,
      resolved: false,
    })

    return { success: true, commentId }
  })

// 10. List PR Comments
export const listPRCommentsAction = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ prId: z.string() }))
  .handler(async ({ data: { prId } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    await verifyPRAccess(prId, session.user.id)

    const comments = await db.query.pullRequestComments.findMany({
      where: eq(pullRequestComments.prId, prId),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    })

    return comments
  })

// 11. Resolve PR Comment
export const resolvePRCommentAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    commentId: z.string(),
    resolved: z.boolean(),
  }))
  .handler(async ({ data: { commentId, resolved } }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Unauthorized')

    const comment = await db.query.pullRequestComments.findFirst({
      where: eq(pullRequestComments.id, commentId)
    })
    if (!comment) throw new Error('Comment not found')

    await verifyPRAccess(comment.prId, session.user.id)

    await db.update(pullRequestComments)
      .set({ resolved })
      .where(eq(pullRequestComments.id, commentId))

    return { success: true }
  })
