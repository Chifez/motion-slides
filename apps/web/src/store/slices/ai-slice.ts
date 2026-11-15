import type { StateCreator } from 'zustand'
import type { EditorState } from '@/store/editor-store'
import { getStorageItem, setStorageItem } from '@/lib/safe-storage'

export const CHAT_PANEL_MIN_WIDTH = 340
export const CHAT_PANEL_MAX_WIDTH = 560
export const CHAT_PANEL_DEFAULT_WIDTH = 384
const CHAT_PANEL_WIDTH_KEY = 'ms:copilot-width'

export function clampChatPanelWidth(width: number): number {
  return Math.min(CHAT_PANEL_MAX_WIDTH, Math.max(CHAT_PANEL_MIN_WIDTH, Math.round(width)))
}

function readPersistedChatPanelWidth(): number {
  const raw = getStorageItem(CHAT_PANEL_WIDTH_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? clampChatPanelWidth(parsed) : CHAT_PANEL_DEFAULT_WIDTH
}

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

  /** Docked width of the Copilot rail in px (persisted on commit). */
  chatPanelWidth: number
  setChatPanelWidth: (width: number) => void
  commitChatPanelWidth: () => void

  /** True while the agent is generating or running tools (drives the toolbar indicator). */
  isAgentBusy: boolean
  setAgentBusy: (busy: boolean) => void

  /** The currently selected model ID */
  selectedModel: string
  setSelectedModel: (model: string) => void

  /** Currently active chat thread ID */
  activeThreadId: string | null
  setActiveThreadId: (id: string | null) => void

  /** Whether AI generation (slides, diagrams, themes) was performed on the current deck */
  hasAiGenerated: boolean
  setHasAiGenerated: (has: boolean) => void

  /** Whether the Deck Quality / Critic modal is open */
  isCriticModalOpen: boolean
  setIsCriticModalOpen: (open: boolean) => void
  openCriticModal: () => void
  closeCriticModal: () => void
}

export const createAISlice: StateCreator<EditorState, [], [], AISlice> = (set, get) => ({
  isChatOpen: false,
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  setChatOpen: (open) => set({ isChatOpen: open }),

  chatPanelWidth: readPersistedChatPanelWidth(),
  setChatPanelWidth: (width) => set({ chatPanelWidth: clampChatPanelWidth(width) }),
  commitChatPanelWidth: () => setStorageItem(CHAT_PANEL_WIDTH_KEY, String(get().chatPanelWidth)),

  isAgentBusy: false,
  setAgentBusy: (busy) => set((s) => (s.isAgentBusy === busy ? s : { isAgentBusy: busy })),

  selectedModel: 'gpt-4o',
  setSelectedModel: (model) => set({ selectedModel: model }),

  activeThreadId: null,
  setActiveThreadId: (id) => set({ activeThreadId: id }),

  hasAiGenerated: false,
  setHasAiGenerated: (has: boolean) => set({ hasAiGenerated: has }),

  isCriticModalOpen: false,
  setIsCriticModalOpen: (open: boolean) => set({ isCriticModalOpen: open }),
  openCriticModal: () => set({ isCriticModalOpen: true }),
  closeCriticModal: () => set({ isCriticModalOpen: false }),
})
