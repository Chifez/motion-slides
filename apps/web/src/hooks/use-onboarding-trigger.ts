import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editor-store'

export type TourType = 'dashboard' | 'editor'

export function useOnboardingTrigger(type: TourType, showEditorUI: boolean = true) {
  const startOnboarding = useEditorStore((s) => s.startOnboarding)
  const isTourCompleted = useEditorStore((s) => s.isTourCompleted)
  const user = useEditorStore((s) => s.user)
  const projects = useEditorStore((s) => s.projects)
  const isOnboardingActive = useEditorStore((s) => s.isOnboardingActive)



  const hasTriggered = useRef(false)

  useEffect(() => {
    if (hasTriggered.current) return

    const forceTour = import.meta.env.VITE_FORCE_TOUR === 'true'
    const dismissedThisSession = typeof window !== 'undefined' ? sessionStorage.getItem(`ms-dismissed-${type}`) === 'true' : false
    const alreadyActive = useEditorStore.getState().isOnboardingActive

    if (forceTour) {
      if (!alreadyActive && !dismissedThisSession) {
        startOnboarding(type)
        hasTriggered.current = true
      }
      return
    }

    // Check device or user completion first
    const isCompleted = isTourCompleted(user?.id || '', type)
    if (isCompleted || dismissedThisSession || alreadyActive) {
      return
    }

    if (type === 'dashboard') {
      if (user && projects.length === 0) {
        startOnboarding('dashboard')
        hasTriggered.current = true
      }
    } else if (type === 'editor' && showEditorUI) {
      startOnboarding('editor')
      hasTriggered.current = true
    }
  }, [user, projects.length, showEditorUI, startOnboarding, isTourCompleted, type])
}
