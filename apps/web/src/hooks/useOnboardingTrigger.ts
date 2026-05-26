import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'

export type TourType = 'dashboard' | 'editor'

export function useOnboardingTrigger(type: TourType, showEditorUI: boolean = true) {
  const startOnboarding = useEditorStore((s) => s.startOnboarding)
  const isTourCompleted = useEditorStore((s) => s.isTourCompleted)
  const user = useEditorStore((s) => s.user)
  const projects = useEditorStore((s) => s.projects)
  const isOnboardingActive = useEditorStore((s) => s.isOnboardingActive)

  const wasActiveRef = useRef(false)

  // Track when the tour is closed during this session to prevent infinite restarts under VITE_FORCE_TOUR
  useEffect(() => {
    if (isOnboardingActive) {
      wasActiveRef.current = true
    } else if (wasActiveRef.current && !isOnboardingActive) {
      // Tour was active but is now closed/completed
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`ms-dismissed-${type}`, 'true')
      }
    }
  }, [isOnboardingActive, type])

  useEffect(() => {
    // Check for environment variable configuration to force the tour (useful for development/testing)
    const forceTour = import.meta.env.VITE_FORCE_TOUR === 'true'
    const dismissedThisSession = typeof window !== 'undefined' ? sessionStorage.getItem(`ms-dismissed-${type}`) === 'true' : false

    if (forceTour) {
      if (!isOnboardingActive && !dismissedThisSession) {
        startOnboarding(type)
      }
      return
    }

    if (type === 'dashboard') {
      if (user) {
        const completed = isTourCompleted(user.id, 'dashboard')
        if (!completed && projects.length === 0 && !isOnboardingActive) {
          startOnboarding('dashboard')
        }
      }
    } else if (type === 'editor' && showEditorUI) {
      const userId = user?.id || ''
      const completed = isTourCompleted(userId, 'editor')
      if (!completed && !isOnboardingActive) {
        startOnboarding('editor')
      }
    }
  }, [user, projects.length, showEditorUI, startOnboarding, isTourCompleted, isOnboardingActive, type])
}
