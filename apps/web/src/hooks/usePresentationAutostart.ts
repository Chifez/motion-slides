import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/store/editorStore'

interface Options {
  mode: 'edit' | 'view' | 'present'
  autoplay: boolean
  isPending: boolean
}

export function usePresentationAutostart({ mode, autoplay, isPending }: Options) {
  const startPresentation = useEditorStore(s => s.startPresentation)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (isPending || hasStarted.current) return
    if (mode === 'present' || (mode === 'view' && autoplay)) {
      hasStarted.current = true
      startPresentation({ autoplay })
    }
  }, [mode, autoplay, isPending, startPresentation])
}
