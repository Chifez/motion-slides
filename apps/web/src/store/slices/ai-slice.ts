import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editorStore'

// ─────────────────────────────────────────────────────────────────
// AISlice
//
// Responsible only for:
//  - Chat panel open/close state
//  - The selected model
//
// Note: The chat message history is owned by `useChat` (via @ai-sdk/react)
// for real-time streaming. If you need to persist conversation history
// across route changes you can mirror it here via `setPersistedMessages`.
// ─────────────────────────────────────────────────────────────────

export interface AISlice {
  /** Whether the AI Chat side panel is open */
  isChatOpen: boolean
  toggleChat: () => void
  setChatOpen: (open: boolean) => void

  /** The currently selected model ID */
  selectedModel: string
  setSelectedModel: (model: string) => void
}

export const createAISlice: StateCreator<EditorState, [], [], AISlice> = (set) => ({
  isChatOpen: false,
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  setChatOpen: (open) => set({ isChatOpen: open }),

  selectedModel: 'gpt-4o',
  setSelectedModel: (model) => set({ selectedModel: model }),
})
