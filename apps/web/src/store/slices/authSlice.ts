import type { StateCreator } from 'zustand'
import type { EditorState } from '../editorStore'
import { authClient } from '@/lib/auth-client'

export interface AuthSlice {
  user: any | null
  isSyncing: boolean
  setSyncing: (isSyncing: boolean) => void
  checkSession: () => Promise<void>
  logout: () => Promise<void>
  syncProjects: () => Promise<void>
}

export const createAuthSlice: StateCreator<
  EditorState,
  [['zustand/persist', unknown]],
  [],
  AuthSlice
> = (set, get) => ({
  user: null,
  isSyncing: false,

  setSyncing: (isSyncing) => set({ isSyncing }),

  checkSession: async () => {
    const { data: session } = await authClient.getSession()
    set({ user: session?.user ?? null })
  },

  logout: async () => {
    await authClient.signOut()
    set({ user: null })
  },

  syncProjects: async () => {
    const { projects: localProjects, setSyncing, user } = get()
    if (!user) return

    setSyncing(true)
    try {
      const { syncProjectsAction, listRemoteProjectsAction } = await import('@/lib/actions/project')
      
      // 1. Fetch remote state
      const remoteProjects = await listRemoteProjectsAction()
      
      const toUpload: any[] = []
      const updatedLocal: any[] = [...localProjects]
      let localChanged = false

      // 2. Conflict Resolution (LWW)
      localProjects.forEach((local) => {
        const remote = remoteProjects.find((r: any) => r.id === local.id)
        
        if (!remote || local.updatedAt > remote.updatedAt) {
          // Local is newer or missing on server
          toUpload.push(local)
        } else if (remote.updatedAt > local.updatedAt) {
          // Remote is newer
          const idx = updatedLocal.findIndex(p => p.id === local.id)
          updatedLocal[idx] = { ...remote, synced: true }
          localChanged = true
        } else if (remote.updatedAt === local.updatedAt && !local.synced) {
          // Exact same version, but local thinks it's not synced
          const idx = updatedLocal.findIndex(p => p.id === local.id)
          updatedLocal[idx] = { ...local, synced: true }
          localChanged = true
        }
      })

      // 3. Handle remote projects that don't exist locally at all
      remoteProjects.forEach((remote: any) => {
        if (!localProjects.some(p => p.id === remote.id)) {
          updatedLocal.push({ ...remote, synced: true })
          localChanged = true
        }
      })

      // 4. Batch Upload
      if (toUpload.length > 0) {
        const result = await syncProjectsAction({ data: toUpload })
        if (result.success) {
          toUpload.forEach(uploaded => {
            const idx = updatedLocal.findIndex(p => p.id === uploaded.id)
            if (idx !== -1) updatedLocal[idx].synced = true
          })
          localChanged = true
        }
      }

      if (localChanged) {
        set({ projects: updatedLocal })
      }
    } catch (error: any) {
      console.error('Failed to sync projects:', error?.message || error)
      if (error?.data) console.error('Sync error details:', error.data)
    } finally {
      setSyncing(false)
    }
  }
})
