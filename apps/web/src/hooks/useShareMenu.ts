import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@motionslides/shared'
import { updateProjectVisibilityAction, rotateShareKeyAction } from '@/lib/actions/project'
import { getWindowOrigin } from '@/lib/safeStorage'

export type ShareState = 
  | { status: 'unsynced' } 
  | { status: 'syncing' } 
  | { status: 'public' } 
  | { status: 'link-shared' } 
  | { status: 'collaborative' } 
  | { status: 'private' }

export function useShareMenu(project: Project) {
  const isSyncing = useEditorStore(state => state.isSyncing)
  const updateProject = useEditorStore(state => state.updateProject)
  
  const [isMutating, setIsMutating] = useState(false)
  const baseUrl = getWindowOrigin()

  const shareState: ShareState = (isSyncing || isMutating)
    ? { status: 'syncing' }
    : { status: project.visibility as ShareState['status'] }

  const copyLink = async (type: 'edit' | 'view') => {
    const params = new URLSearchParams()
    params.set('mode', type)
    if (project.shareKey) {
      params.set('key', project.shareKey)
    }
    
    const url = `${baseUrl}/p/${project.id}?${params.toString()}`
    await navigator.clipboard.writeText(url)
  }

  const toggleSharing = async () => {
    const isCurrentlyShared = project.visibility !== 'private'
    const newVisibility = isCurrentlyShared ? 'private' : 'link-shared'
    const shouldRotate = !isCurrentlyShared
    
    setIsMutating(true)
    try {
      const result = await updateProjectVisibilityAction({
        data: {
          projectId: project.id,
          visibility: newVisibility,
          rotateKey: shouldRotate
        }
      })
      if (result.success) {
        const updates: Partial<Project> = { 
          visibility: newVisibility,
          synced: true,
          updatedAt: result.updatedAt ?? Date.now()
        }
        if (result.shareKey) {
          updates.shareKey = result.shareKey
        }
        updateProject(project.id, updates)
      }
    } catch (error) {
      console.error('Failed to toggle sharing:', error)
    } finally {
      setIsMutating(false)
    }
  }

  const toggleCollaborative = async () => {
    const isCurrentlyCollab = project.visibility === 'collaborative'
    const newVisibility = isCurrentlyCollab ? 'link-shared' : 'collaborative'
    
    setIsMutating(true)
    try {
      const result = await updateProjectVisibilityAction({
        data: {
          projectId: project.id,
          visibility: newVisibility,
          rotateKey: false
        }
      })
      if (result.success) {
        updateProject(project.id, { 
          visibility: newVisibility,
          synced: true,
          updatedAt: result.updatedAt ?? Date.now()
        })
      }
    } catch (error) {
      console.error('Failed to toggle collaborative mode:', error)
    } finally {
      setIsMutating(false)
    }
  }

  const rotateKey = async () => {
    setIsMutating(true)
    try {
      const result = await rotateShareKeyAction({
        data: { projectId: project.id }
      })
      if (result.success && result.newKey) {
        updateProject(project.id, { 
          shareKey: result.newKey,
          synced: true,
          updatedAt: result.updatedAt ?? Date.now()
        })
      }
    } catch (error) {
      console.error('Failed to rotate key:', error)
    } finally {
      setIsMutating(false)
    }
  }

  return {
    shareState,
    baseUrl,
    copyLink,
    toggleSharing,
    toggleCollaborative,
    rotateKey
  }
}

