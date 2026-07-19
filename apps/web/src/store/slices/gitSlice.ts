import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'
import type { Project, Slide, SlideTransition } from '@motionslides/shared'
import type { GitCommit } from '@/lib/actions/git'
import {
  createBranchAction,
  pushCommitsAction,
  pullCommitsAction,
  createPRAction,
  listPRsAction,
  resolvePRAction,
  getCommitHistoryAction,
  createPRCommentAction,
  listPRCommentsAction,
  resolvePRCommentAction
} from '@/lib/actions/git'
import { uuid } from '@/lib/uuid'

export interface GitSlice {
  gitHistory: GitCommit[]
  gitUpstreamHistory: GitCommit[]
  gitCheckedOutCommitId: string | null
  gitCheckedOutState: {
    slides: Slide[]
    transitions: SlideTransition[]
    prototypeLayout: Record<string, { x: number; y: number }>
  } | null
  isSyncingGit: boolean
  gitConflicts: Record<string, { local: Slide; incoming: Slide }>
  gitMergeActive: boolean
  gitMergeTargetHead: string | null
  gitMergeAccumulatedSlides: Slide[]
  prsList: any[]

  loadGitHistory: (projectId: string) => Promise<void>
  commitLocally: (message: string) => void
  pushCommits: () => Promise<void>
  pullCommits: () => Promise<void>
  checkoutCommit: (commitId: string | null) => void
  createBranch: (projectId: string, name?: string) => Promise<Project>
  createPR: (targetProjectId: string, title: string, description: string) => Promise<string>
  loadPRs: (projectId: string, type: 'incoming' | 'outgoing') => Promise<void>
  resolvePR: (prId: string, status: 'merged' | 'rejected') => Promise<void>
  resolveConflict: (slideId: string, keep: 'local' | 'incoming') => void
  hasUnstagedChanges: () => boolean
  getUncommittedChanges: () => { id: string; name: string; type: 'added' | 'deleted' | 'modified' }[]

  prComments: any[]
  isCommentToolActive: boolean
  showPRCommentsInEditor: boolean
  setCommentToolActive: (active: boolean) => void
  setShowPRCommentsInEditor: (show: boolean) => void
  loadPRComments: (prId: string) => Promise<void>
  createPRComment: (prId: string, slideId: string, elementId: string | null, content: string, x?: number | null, y?: number | null) => Promise<void>
  resolvePRComment: (commentId: string, resolved: boolean) => Promise<void>
}

// Lowest Common Ancestor (LCA) traversal to locate base commit
function findCommonAncestor(
  localHeadId: string | null,
  incomingHeadId: string | null,
  history: GitCommit[],
  upstreamHistory: GitCommit[]
): GitCommit | null {
  if (!localHeadId || !incomingHeadId) return null
  const allCommits = [...history, ...upstreamHistory]

  const getChain = (startId: string) => {
    const chain: string[] = []
    let curr: string | null = startId
    while (curr) {
      chain.push(curr)
      const found = allCommits.find(c => c.id === curr)
      curr = found ? found.parentCommitId : null
    }
    return chain
  }

  const localChain = getChain(localHeadId)
  const incomingChain = getChain(incomingHeadId)

  for (const id of localChain) {
    if (incomingChain.includes(id)) {
      return allCommits.find(c => c.id === id) || null
    }
  }
  return null
}

function createEmptySlide(id: string, name: string): Slide {
  return { id, name, elements: [], background: '#ffffff' }
}

// 3-Way Slide Merge Engine
function mergeSlides(
  baseSlides: Slide[],
  localSlides: Slide[],
  incomingSlides: Slide[]
): { merged: Slide[]; conflicts: Record<string, { local: Slide; incoming: Slide }> } {
  const merged: Slide[] = []
  const conflicts: Record<string, { local: Slide; incoming: Slide }> = {}

  const allSlideIds = Array.from(new Set([
    ...baseSlides.map(s => s.id),
    ...localSlides.map(s => s.id),
    ...incomingSlides.map(s => s.id)
  ]))

  for (const slideId of allSlideIds) {
    const base = baseSlides.find(s => s.id === slideId)
    const local = localSlides.find(s => s.id === slideId)
    const incoming = incomingSlides.find(s => s.id === slideId)

    if (!base) {
      // Added in local or incoming
      if (local && !incoming) {
        merged.push(local)
      } else if (incoming && !local) {
        merged.push(incoming)
      } else if (local && incoming) {
        conflicts[slideId] = { local, incoming }
      }
    } else {
      // Existed in baseline
      if (!local && !incoming) {
        // Deleted in both
        continue
      } else if (!local && incoming) {
        // Deleted locally, kept/modified in incoming
        const modifiedIncoming = JSON.stringify(base) !== JSON.stringify(incoming)
        if (modifiedIncoming) {
          conflicts[slideId] = { local: createEmptySlide(slideId, 'Deleted Slide'), incoming }
        }
      } else if (local && !incoming) {
        // Deleted in incoming, kept/modified locally
        const modifiedLocal = JSON.stringify(base) !== JSON.stringify(local)
        if (modifiedLocal) {
          conflicts[slideId] = { local, incoming: createEmptySlide(slideId, 'Deleted Slide') }
        }
      } else if (local && incoming) {
        const localChanged = JSON.stringify(base) !== JSON.stringify(local)
        const incomingChanged = JSON.stringify(base) !== JSON.stringify(incoming)

        if (!localChanged && !incomingChanged) {
          merged.push(local)
        } else if (localChanged && !incomingChanged) {
          merged.push(local)
        } else if (!localChanged && incomingChanged) {
          merged.push(incoming)
        } else {
          // Conflicts detected
          conflicts[slideId] = { local, incoming }
        }
      }
    }
  }

  return { merged, conflicts }
}

export const createGitSlice: StateCreator<EditorState, [], [], GitSlice> = (set, get) => ({
  gitHistory: [],
  gitUpstreamHistory: [],
  gitCheckedOutCommitId: null,
  gitCheckedOutState: null,
  isSyncingGit: false,
  gitConflicts: {},
  gitMergeActive: false,
  gitMergeTargetHead: null,
  gitMergeAccumulatedSlides: [],
  prsList: [],

  prComments: [],
  isCommentToolActive: false,
  showPRCommentsInEditor: false,
  setCommentToolActive: (active) => set({ isCommentToolActive: active }),
  setShowPRCommentsInEditor: (show) => set({ showPRCommentsInEditor: show }),

  loadPRComments: async (prId) => {
    try {
      const comments = await listPRCommentsAction({ data: { prId } })
      set({ prComments: comments })
    } catch (err) {
      console.error('Failed to load PR comments:', err)
    }
  },

  createPRComment: async (prId, slideId, elementId, content, x, y) => {
    try {
      const res = await createPRCommentAction({
        data: { prId, slideId, elementId, content, x, y }
      })
      if (res.success) {
        // Reload comments
        get().loadPRComments(prId)
      }
    } catch (err) {
      console.error('Failed to create PR comment:', err)
    }
  },

  resolvePRComment: async (commentId, resolved) => {
    try {
      const res = await resolvePRCommentAction({
        data: { commentId, resolved }
      })
      if (res.success) {
        // Find the PR ID from the comment in state and reload
        const comments = get().prComments
        const comment = comments.find(c => c.id === commentId)
        if (comment) {
          get().loadPRComments(comment.prId)
        }
      }
    } catch (err) {
      console.error('Failed to resolve PR comment:', err)
    }
  },

  loadGitHistory: async (projectId) => {
    set({ isSyncingGit: true })
    try {
      const res = await getCommitHistoryAction({ data: { projectId } })
      set({
        gitHistory: res.commits,
        gitUpstreamHistory: res.upstreamCommits,
      })
    } catch (err) {
      console.error('Failed to load git history:', err)
      get().showToast('Failed to load version history.', 'error')
    } finally {
      set({ isSyncingGit: false })
    }
  },

  commitLocally: (message) => {
    const project = get().activeProject()
    if (!project) return

    const commitId = uuid()
    const authorName = get().user?.name || 'Collaborator'
    const newCommit: GitCommit = {
      id: commitId,
      projectId: project.id,
      parentCommitId: project.headCommitId || null,
      authorId: get().user?.id || null,
      authorName,
      message,
      slides: JSON.parse(JSON.stringify(project.slides)),
      transitions: JSON.parse(JSON.stringify(project.transitions || [])),
      prototypeLayout: JSON.parse(JSON.stringify(project.prototypeLayout || {})),
      createdAt: Date.now(),
    }

    const localCommits = [...(project.localCommits || []), newCommit]

    get().updateProject(project.id, {
      headCommitId: commitId,
      localCommits,
      synced: true, // We are about to sync it
    })

    set((state) => ({
      gitHistory: [newCommit, ...state.gitHistory],
    }))

    get().showToast('Committed changes locally.', 'success')
    get().syncProjects() // Immediately sync project metadata so "Save" button doesn't appear
  },

  pushCommits: async () => {
    const project = get().activeProject()
    if (!project || !project.localCommits || project.localCommits.length === 0) {
      get().showToast('No unpushed commits.', 'info')
      return
    }

    set({ isSyncingGit: true })
    try {
      const res = await pushCommitsAction({
        data: {
          projectId: project.id,
          commits: project.localCommits,
        },
      })

      if (res.success) {
        get().updateProject(project.id, {
          localCommits: [],
          synced: true,
        })
        get().showToast('Pushed commits successfully.', 'success')
      } else {
        throw new Error((res as any).error || 'Server sync error')
      }
    } catch (err) {
      console.error('Failed to push commits:', err)
      get().showToast('Failed to push commits.', 'error')
    } finally {
      set({ isSyncingGit: false })
    }
  },

  pullCommits: async () => {
    const project = get().activeProject()
    if (!project) return

    set({ isSyncingGit: true })
    try {
      // 1. Fetch remote history
      const res = await pullCommitsAction({ data: { projectId: project.id } })

      // Merge server commits with any local unpushed commits so they aren't wiped
      const localCommits = project.localCommits ?? []
      const mergedHistory = [
        ...localCommits,
        ...res.projectCommits.filter(rc => !localCommits.some(lc => lc.id === rc.id)),
      ]
      set({
        gitHistory: mergedHistory,
        gitUpstreamHistory: res.upstreamCommits,
      })

      // 2. Locate remote head of this project
      const remoteHead = res.projectCommits[0]
      if (!remoteHead) {
        set({ isSyncingGit: false })
        return
      }

      // Only short-circuit if there are no local commits pending — otherwise our
      // local headCommitId points to an unpushed commit, not a server one.
      const hasLocalCommits = project.localCommits && project.localCommits.length > 0
      if (!hasLocalCommits && remoteHead.id === project.headCommitId) {
        get().showToast('Already up-to-date.', 'info')
        set({ isSyncingGit: false })
        return
      }

      // If we have no local changes, we can perform a clean Fast-Forward
      const hasUnstaged = get().hasUnstagedChanges()

      if (!hasLocalCommits && !hasUnstaged) {
        get().updateProject(project.id, {
          headCommitId: remoteHead.id,
          slides: remoteHead.slides,
          transitions: remoteHead.transitions,
          prototypeLayout: remoteHead.prototypeLayout,
          synced: true,
        })
        get().showToast('Pulled changes (Fast-forwarded).', 'success')
        set({ isSyncingGit: false })
        return
      }

      // Otherwise, attempt 3-way merge
      const baseCommit = findCommonAncestor(
        project.headCommitId || null,
        remoteHead.id,
        res.projectCommits,
        res.upstreamCommits
      )

      if (!baseCommit) {
        // No common baseline, treat remote as truth
        get().updateProject(project.id, {
          headCommitId: remoteHead.id,
          slides: remoteHead.slides,
          transitions: remoteHead.transitions,
          prototypeLayout: remoteHead.prototypeLayout,
        })
        get().showToast('Reset project to remote state.', 'info')
        set({ isSyncingGit: false })
        return
      }

      const { merged, conflicts } = mergeSlides(
        baseCommit.slides,
        project.slides,
        remoteHead.slides
      )

      if (Object.keys(conflicts).length > 0) {
        set({
          gitConflicts: conflicts,
          gitMergeActive: true,
          gitMergeTargetHead: remoteHead.id,
          gitMergeAccumulatedSlides: merged,
        })
        get().showToast('Conflict detected! Please resolve them.', 'error')
      } else {
        // Clean merge with no conflicts
        get().updateProject(project.id, {
          headCommitId: remoteHead.id,
          slides: merged,
          transitions: remoteHead.transitions,
          prototypeLayout: remoteHead.prototypeLayout,
          synced: false, // merge creates new unstaged state or local head
        })
        get().showToast('Pulled and merged remote changes successfully.', 'success')
      }
    } catch (err) {
      console.error('Failed to pull commits:', err)
      get().showToast('Failed to pull changes.', 'error')
    } finally {
      set({ isSyncingGit: false })
    }
  },

  checkoutCommit: (commitId) => {
    if (!commitId) {
      set({ gitCheckedOutCommitId: null, gitCheckedOutState: null })
      return
    }

    const { gitHistory, gitUpstreamHistory } = get()
    const commit = [...gitHistory, ...gitUpstreamHistory].find(c => c.id === commitId)

    if (commit) {
      set({
        gitCheckedOutCommitId: commitId,
        gitCheckedOutState: {
          slides: commit.slides,
          transitions: commit.transitions,
          prototypeLayout: commit.prototypeLayout,
        },
      })
      get().showToast(`Viewing commit: ${commit.message.substring(0, 30)}...`, 'info')
    }
  },

  createBranch: async (projectId, name) => {
    set({ isSyncingGit: true })
    try {
      const res = await createBranchAction({ data: { projectId, name } })
      if (res.success && res.project) {
        set((state) => ({
          projects: [...state.projects, { ...res.project, localAuthorId: get().localAuthorId }],
        }))
        get().showToast('Branch created successfully!', 'success')
        return res.project
      }
      throw new Error('Branch creation failed')
    } catch (err) {
      console.error(err)
      get().showToast('Failed to create branch.', 'error')
      throw err
    } finally {
      set({ isSyncingGit: false })
    }
  },

  createPR: async (targetProjectId, title, description) => {
    const project = get().activeProject()
    if (!project) throw new Error('No active project')

    set({ isSyncingGit: true })
    try {
      const res = await createPRAction({
        data: {
          sourceProjectId: project.id,
          targetProjectId,
          title,
          description,
        },
      })
      if (res.success) {
        get().showToast('Pull Request submitted!', 'success')
        return res.prId
      }
      throw new Error('PR creation failed')
    } catch (err) {
      console.error(err)
      get().showToast('Failed to submit PR.', 'error')
      throw err
    } finally {
      set({ isSyncingGit: false })
    }
  },

  loadPRs: async (projectId, type) => {
    try {
      const prs = await listPRsAction({ data: { projectId, type } })
      set({ prsList: prs || [] })
      
      const pendingPR = (prs || []).find(pr => pr.status === 'open')
      if (pendingPR) {
        get().loadPRComments(pendingPR.id)
      }
    } catch (err) {
      console.error('Failed to load PRs:', err)
    }
  },

  resolvePR: async (prId, status) => {
    set({ isSyncingGit: true })
    try {
      const res = await resolvePRAction({ data: { prId, status } })
      if (res.success) {
        get().showToast(`Pull request ${status === 'merged' ? 'merged' : 'closed'}.`, 'success')
        // Refresh active project since head might have shifted
        const activeProj = get().activeProject()
        if (activeProj) {
          await get().loadGitHistory(activeProj.id)
        }
      }
    } catch (err) {
      console.error(err)
      get().showToast('Failed to resolve PR.', 'error')
    } finally {
      set({ isSyncingGit: false })
    }
  },

  resolveConflict: (slideId, keep) => {
    const { gitConflicts, gitMergeAccumulatedSlides, gitMergeTargetHead } = get()
    const conflict = gitConflicts[slideId]
    if (!conflict || !gitMergeTargetHead) return

    const keptSlide = keep === 'local' ? conflict.local : conflict.incoming

    const updatedSlides = [...gitMergeAccumulatedSlides]
    if (keptSlide.name !== 'Deleted Slide') {
      updatedSlides.push(keptSlide)
    }

    const nextConflicts = { ...gitConflicts }
    delete nextConflicts[slideId]

    set({
      gitConflicts: nextConflicts,
      gitMergeAccumulatedSlides: updatedSlides,
    })

    if (Object.keys(nextConflicts).length === 0) {
      // Merging complete
      const project = get().activeProject()
      if (project) {
        const { gitHistory } = get()
        const remoteHeadCommit = gitHistory.find(c => c.id === gitMergeTargetHead)

        get().updateProject(project.id, {
          headCommitId: gitMergeTargetHead,
          slides: updatedSlides,
          transitions: remoteHeadCommit?.transitions || project.transitions,
          prototypeLayout: remoteHeadCommit?.prototypeLayout || project.prototypeLayout,
          synced: false,
        })

        set({
          gitMergeActive: false,
          gitMergeTargetHead: null,
          gitMergeAccumulatedSlides: [],
        })

        get().showToast('Merge resolved successfully!', 'success')
      }
    }
  },

  hasUnstagedChanges: () => {
    const project = get().activeProject()
    if (!project) return false

    // If there is no head commit but the project has slides, there are unstaged changes.
    if (!project.headCommitId) {
      return project.slides.length > 0
    }

    const { gitHistory, gitUpstreamHistory } = get()
    const headCommit = [...gitHistory, ...gitUpstreamHistory].find(c => c.id === project.headCommitId)
    if (!headCommit) return true

    const currentStr = JSON.stringify({
      slides: project.slides,
      transitions: project.transitions || [],
      layout: project.prototypeLayout || {},
    })

    const headStr = JSON.stringify({
      slides: headCommit.slides,
      transitions: headCommit.transitions || [],
      layout: headCommit.prototypeLayout || {},
    })

    return currentStr !== headStr
  },

  getUncommittedChanges: () => {
    const project = get().activeProject()
    if (!project) return []

    const { gitHistory, gitUpstreamHistory } = get()
    const headCommit = [...gitHistory, ...gitUpstreamHistory].find(c => c.id === project.headCommitId)
    const headSlides = headCommit ? headCommit.slides : []
    const currentSlides = project.slides

    const diffs: { id: string; name: string; type: 'added' | 'deleted' | 'modified' }[] = []

    // Check added/modified
    currentSlides.forEach(slide => {
      const headSlide = headSlides.find(s => s.id === slide.id)
      if (!headSlide) {
        diffs.push({ id: slide.id, name: slide.name || 'Untitled Slide', type: 'added' })
      } else if (JSON.stringify(slide) !== JSON.stringify(headSlide)) {
        diffs.push({ id: slide.id, name: slide.name || 'Untitled Slide', type: 'modified' })
      }
    })

    // Check deleted
    headSlides.forEach(slide => {
      if (!currentSlides.find(s => s.id === slide.id)) {
        diffs.push({ id: slide.id, name: slide.name || 'Untitled Slide', type: 'deleted' })
      }
    })

    return diffs
  },
})
