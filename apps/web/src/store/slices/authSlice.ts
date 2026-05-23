import type { StateCreator } from 'zustand'
import type { EditorState } from '../editorStore'
import { authClient } from '@/lib/auth-client'
import { syncProjectsAction, listRemoteProjectsAction } from '@/lib/actions/project'

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthSlice {
  user: any | null
  sessionStatus: SessionStatus
  isSyncing: boolean
  syncError: string | null
  setSyncing: (isSyncing: boolean) => void
  checkSession: () => Promise<void>
  logout: () => Promise<void>
  syncProjects: () => Promise<void>
  clearSyncError: () => void
}

export const createAuthSlice: StateCreator<
  EditorState,
  [['zustand/persist', unknown]],
  [],
  AuthSlice
> = (set, get) => ({
  user: null,
  sessionStatus: 'loading',
  isSyncing: false,
  syncError: null,

  setSyncing: (isSyncing) => set({ isSyncing }),
  clearSyncError: () => set({ syncError: null }),

  checkSession: async () => {
    set({ sessionStatus: 'loading' })
    try {
      const { data: session } = await authClient.getSession()
      set({ 
        user: session?.user ?? null,
        sessionStatus: session?.user ? 'authenticated' : 'unauthenticated'
      })
    } catch (err) {
      set({ user: null, sessionStatus: 'unauthenticated' })
    }
  },

  logout: async () => {
    await authClient.signOut()
    set({ user: null, sessionStatus: 'unauthenticated', syncError: null })
  },

  syncProjects: async () => {
    const { projects: localProjects, setSyncing, user } = get()
    if (!user) return

    setSyncing(true)
    set({ syncError: null })
    try {
      // Retrieve the authoritative catalog from the remote repository to synchronize local differences.
      const remoteProjects = await listRemoteProjectsAction()
      
      const toUpload: any[] = []
      const updatedLocal: any[] = [...localProjects]
      let localChanged = false

      // Resolve differences using Last-Write-Wins (LWW) to guarantee consistent cross-device synchronization.
      localProjects.forEach((local) => {
        if (local.ownerId && local.ownerId !== user.id) {
          return
        }

        const remote = remoteProjects.find((r: any) => r.id === local.id)
        
        if (!remote || local.updatedAt > remote.updatedAt) {
          // Push updates if local changes are newer or not yet published to the remote cloud.
          toUpload.push(local)
        } else if (remote.updatedAt > local.updatedAt) {
          // Keep localAuthorId to ensure offline permission checks continue to recognize this client device as the author.
          const idx = updatedLocal.findIndex(p => p.id === local.id)
          updatedLocal[idx] = { ...remote, localAuthorId: local.localAuthorId, synced: true }
          localChanged = true
        } else if (remote.updatedAt === local.updatedAt && !local.synced) {
          // Acknowledge that the server and client are in sync even if the local flag was not updated.
          const idx = updatedLocal.findIndex(p => p.id === local.id)
          updatedLocal[idx] = { ...local, synced: true }
          localChanged = true
        }
      })

      // Pull down new remote projects that were created on other client devices.
      remoteProjects.forEach((remote: any) => {
        if (!localProjects.some(p => p.id === remote.id)) {
          updatedLocal.push({ ...remote, synced: true })
          localChanged = true
        }
      })

      // Push all pending local updates to the server in a single batch to minimize HTTP request overhead.
      if (toUpload.length > 0) {
        const result = await syncProjectsAction({ data: toUpload })
        if (result.success) {
          toUpload.forEach(uploaded => {
            const idx = updatedLocal.findIndex(p => p.id === uploaded.id)
            if (idx !== -1) updatedLocal[idx].synced = true
          })
          localChanged = true
        } else {
          console.error('Server sync failed:', result.error)
        }
      }

      if (localChanged) {
        set({ projects: updatedLocal })
      }
    } catch (error: any) {
      console.error('Failed to sync projects:', error?.message || error)
      set({ syncError: error?.message || 'Sync failed' })
    } finally {
      setSyncing(false)
    }
  }
})
