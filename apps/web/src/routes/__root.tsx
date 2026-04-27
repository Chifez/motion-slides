import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'MotionSlides' },
      { name: 'description', content: 'Cinematic, motion-first presentations for developers and designers.' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' }
    ],
  }),
  shellComponent: RootDocument,
})

import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { SyncFooter } from '@/components/ui/SyncFooter'
import { useSyncManager } from '@/hooks/useSyncManager'

function RootDocument({ children }: { children: React.ReactNode }) {
  const checkSession = useEditorStore((s) => s.checkSession)
  
  // Initialize background sync
  useSyncManager()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <SyncFooter />
        <Scripts />
      </body>
    </html>
  )
}
