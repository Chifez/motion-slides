/**
 * @deprecated
 * This hook is superseded by the MotionSlide Agent (useChat in AIChat.tsx).
 * The AI generation flow is now conversational and agent-driven.
 * This file is kept as a no-op stub to avoid breaking any stale imports
 * until they can be cleaned up.
 */
export function useAIGeneration() {
  return {
    progress: { percent: 0, message: '' },
    requiresRecalc: false,
    handleGenerate: async () => {},
    handleRefine: async () => {},
    setRequiresRecalc: () => {},
  }
}
