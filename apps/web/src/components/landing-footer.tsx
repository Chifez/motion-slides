import { Link } from '@tanstack/react-router'
import { Github, Twitter, ExternalLink } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'AI Studio', href: '#ai-studio' },
    { label: 'Git & Code Diffs', href: '#git-diffs' },
    { label: 'Export & Offline', href: '#export' },
    { label: 'Comparison', href: '#comparison' },
  ],
  Resources: [
    { label: 'GitHub', href: 'https://github.com/Chifez/motion-slides', external: true },
    { label: 'Documentation', href: 'https://github.com/Chifez/motion-slides', external: true },
    { label: 'Changelog', href: 'https://github.com/Chifez/motion-slides/releases', external: true },
    { label: 'Issues', href: 'https://github.com/Chifez/motion-slides/issues', external: true },
  ],
  App: [
    { label: 'Open Dashboard', href: '/dashboard', isRoute: true },
    { label: 'New Presentation', href: '/dashboard', isRoute: true },
  ],
}

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950/60 backdrop-blur-sm">
      {/* ── Top section ── */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Logo expanded size={26} />
            <p className="text-[13px] text-zinc-600 leading-relaxed max-w-[240px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              A cinematic presentation engine for developers and technical teams. Built different.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2 mt-1">
              <a
                href="https://github.com/Chifez/motion-slides"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors"
              >
                <Github size={14} />
              </a>
            </div>

            {/* MIT badge */}
            <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-500 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Open Source · MIT License
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-3">
              <p
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-600"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {category}
              </p>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    {'isRoute' in link && link.isRoute ? (
                      <Link
                        to={link.href as any}
                        className="text-[13px] text-zinc-500 hover:text-white transition-colors no-underline flex items-center gap-1.5 group"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {link.label}
                      </Link>
                    ) : 'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1 group"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {link.label}
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="text-[13px] text-zinc-500 hover:text-white transition-colors"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      {/* ── Bottom bar ── */}
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-[11px] text-zinc-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            © {year} MotionSlides. MIT License.
          </p>
          <span className="text-zinc-800 hidden sm:block">·</span>
          <a
            href="https://github.com/Chifez/motion-slides"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors flex items-center gap-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Github size={11} />
            Chifez/motion-slides
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  )
}
