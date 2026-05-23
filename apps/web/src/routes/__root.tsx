import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { SyncFooter } from '@/components/ui/SyncFooter'
import { useSyncManager } from '@/hooks/useSyncManager'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

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

      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://motionslides.app' },
      { property: 'og:title', content: 'MotionSlides' },
      { property: 'og:description', content: 'Cinematic, motion-first presentations for developers and designers.' },
      { property: 'og:image', content: '/og-image.png' },

      // PWA & iOS
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'MotionSlides' },

      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:url', content: 'https://motionslides.app' },
      { name: 'twitter:title', content: 'MotionSlides' },
      { name: 'twitter:description', content: 'Cinematic, motion-first presentations for developers and designers.' },
      { name: 'twitter:image', content: '/og-image.png' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    ],
  }),
  shellComponent: RootDocument,
})

import { ToastContainer } from '@/components/ui/ToastContainer'

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

    <QueryClientProvider client={queryClient}>
      {children}
      <SyncFooter />
      <ToastContainer />
    </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}