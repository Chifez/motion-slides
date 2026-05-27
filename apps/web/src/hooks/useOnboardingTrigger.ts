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

  // Trigger the onboarding tour when conditions are met. Uses a ref to prevent
  // re-triggering: the old approach included isOnboardingActive in the dep array,
  // but startOnboarding sets isOnboardingActive=true, creating a self-retriggering
  // cycle that only didn't infinite-loop due to fragile condition guards.
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (hasTriggered.current) return

    const forceTour = import.meta.env.VITE_FORCE_TOUR === 'true'
    const dismissedThisSession = typeof window !== 'undefined' ? sessionStorage.getItem(`ms-dismissed-${type}`) === 'true' : false
    // Read isOnboardingActive imperatively — it's not a reactive dependency,
    // it's a guard against calling startOnboarding while already active.
    const alreadyActive = useEditorStore.getState().isOnboardingActive

    if (forceTour) {
      if (!alreadyActive && !dismissedThisSession) {
        startOnboarding(type)
        hasTriggered.current = true
      }
      return
    }

    if (type === 'dashboard') {
      if (user) {
        const completed = isTourCompleted(user.id, 'dashboard')
        if (!completed && projects.length === 0 && !alreadyActive) {
          startOnboarding('dashboard')
          hasTriggered.current = true
        }
      }
    } else if (type === 'editor' && showEditorUI) {
      const userId = user?.id || ''
      const completed = isTourCompleted(userId, 'editor')
      if (!completed && !alreadyActive) {
        startOnboarding('editor')
        hasTriggered.current = true
      }
    }
  }, [user, projects.length, showEditorUI, startOnboarding, isTourCompleted, type])
}
