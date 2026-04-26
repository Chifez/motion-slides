import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'
import type { AIChatMessage, Slide } from '@motionslides/shared'
import { uuid } from '@/lib/uuid'

export interface AISlice {
  // Chat history
  chatMessages:      AIChatMessage[]
  addChatMessage:    (message: Omit<AIChatMessage, 'id' | 'timestamp'>) => string
  updateChatMessage: (id: string, updates: Partial<AIChatMessage>) => void
  clearChat:         () => void

  // Panel state
  isChatOpen:    boolean
  toggleChat:    () => void
  setChatOpen:   (open: boolean) => void

  // Generation state
  isGenerating:  boolean
  setGenerating: (v: boolean) => void

  // Pending preview — slides waiting for user to accept/reject
  pendingSlides:    Slide[] | null
  pendingTitle:     string
  setPendingSlides: (slides: Slide[] | null, title?: string) => void
  clearPending:     () => void
}

export const createAISlice: StateCreator<EditorState, [], [], AISlice> = (set, get) => ({
  chatMessages: [],

  addChatMessage: (msg) => {
    const id = uuid()
    set(s => ({
      chatMessages: [
        ...s.chatMessages,
        { ...msg, id, timestamp: Date.now() }
      ]
    }))
    return id
  },

  updateChatMessage: (id, updates) =>
    set(s => ({
      chatMessages: s.chatMessages.map(m => m.id === id ? { ...m, ...updates } : m)
    })),

  clearChat: () => set({ chatMessages: [] }),

  isChatOpen:  false,
  toggleChat:  () => set(s => ({ isChatOpen: !s.isChatOpen })),
  setChatOpen: (open) => set({ isChatOpen: open }),

  isGenerating:  false,
  setGenerating: (v) => set({ isGenerating: v }),

  pendingSlides: null,
  pendingTitle:  '',
  setPendingSlides: (slides, title = '') => set({ pendingSlides: slides, pendingTitle: title }),
  clearPending:     () => set({ pendingSlides: null, pendingTitle: '' }),
})
