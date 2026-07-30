import type { StateCreator } from 'zustand'
import type { EditorState } from '../editorStore'
import { getStorageItem, setStorageItem } from '@/lib/safeStorage'

export interface TourStep {
  selector: string | null
  title: string
  content: string
}

export type TourType = 'dashboard' | 'editor'

export interface OnboardingSlice {
  isOnboardingActive: boolean
  onboardingStep: number
  onboardingTourType: TourType | null
  startOnboarding: (type: TourType) => void
  nextOnboardingStep: () => void
  prevOnboardingStep: () => void
  completeOnboarding: () => void
  isTourCompleted: (userId: string, type: TourType) => boolean
}

export const DASHBOARD_STEPS: TourStep[] = [
  {
    selector: null,
    title: "Welcome to MotionSlides! ✦",
    content: "Let's take a quick 1-minute tour to help you get the most out of our motion-first presentation engine."
  },
  {
    selector: "#tour-new-project",
    title: "Create Your First Project",
    content: "Click here to create a new slide deck. Everything works offline-first and syncs to the cloud automatically."
  }
]

export const EDITOR_STEPS: TourStep[] = [
  {
    selector: null,
    title: "Meet the Workspace 🎨",
    content: "Welcome to the slide editor! Let's walk through the core parts of the interface so you can build slides that move."
  },
  {
    selector: "#tour-slide-panel",
    title: "Slides & States Panel",
    content: "Slides are scene states, not static pages. When you change elements from one slide to another, they morph smoothly."
  },
  {
    selector: "#tour-canvas-stage",
    title: "The Canvas Stage",
    content: "Drag and position shapes, double-click to edit text, or connect shapes to create architecture flowcharts."
  },
  {
    selector: "#tour-inspector-panel",
    title: "Inspector Panel",
    content: "Use this panel to customize colors, font sizes, transitions, code blocks, and layout properties for the selected elements."
  },
  {
    selector: "#tour-ai-chat-button",
    title: "AI Chat Assistant",
    content: "Need help structuring content or generating shapes? Ask the AI to build slides, format code, or design flowcharts for you."
  },
  {
    selector: "#tour-present-button",
    title: "Present & Preview",
    content: "Ready to test the flow? Hit the present button to see your calculated transitions in action!"
  }
]

export const createOnboardingSlice: StateCreator<
  EditorState,
  [],
  [],
  OnboardingSlice
> = (set, get) => ({
  isOnboardingActive: false,
  onboardingStep: 0,
  onboardingTourType: null,

  startOnboarding: (type) => {
    set({
      isOnboardingActive: true,
      onboardingStep: 0,
      onboardingTourType: type
    })
  },

  nextOnboardingStep: () => {
    const { onboardingStep, onboardingTourType } = get()
    if (!onboardingTourType) return
    const maxSteps = onboardingTourType === 'dashboard' ? DASHBOARD_STEPS.length : EDITOR_STEPS.length
    if (onboardingStep < maxSteps - 1) {
      const nextStep = onboardingStep + 1
      set({ onboardingStep: nextStep })
    } else {
      get().completeOnboarding()
    }
  },

  prevOnboardingStep: () => {
    const { onboardingStep, onboardingTourType } = get()
    if (onboardingStep > 0) {
      const prevStep = onboardingStep - 1
      set({ onboardingStep: prevStep })
    }
  },

  completeOnboarding: () => {
    const { user, onboardingTourType } = get()
    if (user && onboardingTourType) {
      setStorageItem(`ms-onboarded-${user.id}-${onboardingTourType}`, 'true')
    } else if (onboardingTourType) {
      // Allow guests/locals to also complete and store a guest flag
      setStorageItem(`ms-onboarded-guest-${onboardingTourType}`, 'true')
    }
    
    if (typeof window !== 'undefined' && onboardingTourType) {
      sessionStorage.setItem(`ms-dismissed-${onboardingTourType}`, 'true')
    }
    set({
      isOnboardingActive: false,
      onboardingStep: 0,
      onboardingTourType: null
    })
  },

  isTourCompleted: (userId, type) => {
    const key = userId ? `ms-onboarded-${userId}-${type}` : `ms-onboarded-guest-${type}`
    return getStorageItem(key) === 'true'
  }
})
