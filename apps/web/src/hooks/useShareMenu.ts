import { useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import type { Project } from '@motionslides/shared'

export type ShareState = 
  | { status: 'unsynced' } 
  | { status: 'syncing' } 
  | { status: 'public' } 
  | { status: 'link-shared' } 
  | { status: 'collaborative' } 
  | { status: 'private' }

export function useShareMenu(project: Project) {
  const isSyncing = useEditorStore(s => s.isSyncing)
  const updateProject = useEditorStore(s => s.updateProject)
  const syncProjects = useEditorStore(s => s.syncProjects)
  
  const [shareState, setShareState] = useState<ShareState>({ status: 'private' })
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  useEffect(() => {
    if (isSyncing) {
      setShareState({ status: 'syncing' })
    } else {
      setShareState({ status: project.visibility as any })
    }
  }, [project.visibility, isSyncing])

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
    
    const updates: Partial<Project> = { 
      visibility: newVisibility,
      synced: false 
    }

    // Always rotate key when enabling sharing to ensure a fresh valid link
    if (!isCurrentlyShared) {
      updates.shareKey = crypto.randomUUID()
    }
    
    updateProject(project.id, updates)
    
    // Immediate sync to resolve race conditions
    await syncProjects()
  }

  const toggleCollaborative = async () => {
    const isCurrentlyCollab = project.visibility === 'collaborative'
    const newVisibility = isCurrentlyCollab ? 'link-shared' : 'collaborative'
    
    updateProject(project.id, { 
      visibility: newVisibility,
      synced: false
    })
    await syncProjects()
  }

  const rotateKey = async () => {
    updateProject(project.id, { 
      shareKey: crypto.randomUUID(),
      synced: false
    })
    await syncProjects()
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
