import { useBlocker } from '@tanstack/react-router'
import { useEditorStore } from '@/store/editor-store'

interface Options {
  isPending: boolean
  isSynced: boolean
}

/**
 * Blocks in-app navigation when there are unsynced changes.
 */
export function useProjectSync({ isPending, isSynced }: Options) {
  const user = useEditorStore(state => state.user)
  const syncProjects = useEditorStore(state => state.syncProjects)

  const { proceed, reset, status } = useBlocker({
    condition: !isPending && !!user && !isSynced,
  })

  return { proceed, reset, status, syncProjects }
}
