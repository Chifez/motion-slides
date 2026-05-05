import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { SyncFooter } from '@/components/ui/SyncFooter'
import { useSyncManager } from '@/hooks/useSyncManager'

const THEME_SCRIPT = `
  (function () {
    try {
      var theme = localStorage.getItem('ms-theme');
      if (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      }
      if (theme === 'dark') document.documentElement.classList.add('dark');
    } catch (e) {}
  })();
`

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
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const checkSession = useEditorStore((s) => s.checkSession)
  const initializeIdentity = useEditorStore((s) => s.initializeIdentity)
  const theme = useEditorStore((s) => s.theme)

  useSyncManager()

  // Bootstrap auth + identity once on mount
  useEffect(() => {
    checkSession()
    initializeIdentity()
    document.body.classList.add('transitions-enabled')
  }, [checkSession, initializeIdentity])


  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="bg-(--ms-bg-base) text-(--ms-text-primary)">
        {children}
        <SyncFooter />
        <Scripts />
      </body>
    </html>
  )
}