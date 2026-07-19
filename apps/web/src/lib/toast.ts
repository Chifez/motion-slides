import { useEditorStore } from '@/store/editorStore'

/**
 * Programmatic toast helper. Accesses store dynamically to allow
 * triggering toast notifications from anywhere (e.g. hooks, components, or actions).
 */
export const toast = {
  success: (message: string) => {
    useEditorStore.getState().showToast(message, 'success')
  },
  error: (message: string) => {
    useEditorStore.getState().showToast(message, 'error')
  },
  info: (message: string) => {
    useEditorStore.getState().showToast(message, 'info')
  },
}
