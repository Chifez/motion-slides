import { Link } from '@tanstack/react-router'
import { Github, ExternalLink } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const FOOTER_LINKS = {
  Product: [
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'AI Copilot', href: '#copilot' },
    { label: 'Code & Git', href: '#code-git' },
    { label: 'Export & Delivery', href: '#export' },
    { label: 'Compare', href: '#compare' },
  ],
  Resources: [
    { label: 'GitHub', href: 'https://github.com/Chifez/motion-slides', external: true },
    { label: 'Documentation', href: 'https://github.com/Chifez/motion-slides', external: true },
    { label: 'Changelog', href: 'https://github.com/Chifez/motion-slides/releases', external: true },
    { label: 'Issues', href: 'https://github.com/Chifez/motion-slides/issues', external: true },
  ],
  Workspace: [
    { label: 'Open Editor', href: '/dashboard', isRoute: true },
    { label: 'Dashboard', href: '/dashboard', isRoute: true },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy', isRoute: true },
  ]

}

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/[0.06] bg-[#070709]">
      {/* Top section */}
      <div className="max-w-[1120px] mx-auto px-[24px] pt-[64px] pb-[44px]">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-[30px]">
          {/* Brand column */}
          <div className="md:col-span-2 flex flex-col gap-[16px]">
            <Logo expanded size={26} />
            <p className="text-[13px] text-zinc-500 leading-[1.6] max-w-[260px]">
              Motion-first presentation engine for systems, architecture diagrams, code diffs, and AI-assisted decks.
            </p>

            {/* Social + MIT license badge */}
            <div className="flex items-center gap-[10px] mt-[4px]">
              <a
                href="https://github.com/Chifez/motion-slides"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub repository"
                className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] bg-[#0C0C0F] border border-white/[0.08] text-zinc-500 hover:text-zinc-100 hover:border-white/[0.16] transition-[transform,color,border-color] duration-150 active:scale-[0.97]"
              >
                <Github size={14} />
              </a>

              <div className="inline-flex items-center gap-[6px] bg-[#0C0C0F] border border-white/[0.08] rounded-full px-[12px] py-[5px]">
                <span className="w-[6px] h-[6px] rounded-full bg-emerald-500" />
                <span className="font-mono text-[11px] text-zinc-400">
                  Open Source · MIT License
                </span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-[12px]">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {category}
              </p>
              <ul className="flex flex-col gap-[10px] list-none p-0 m-0">
                {links.map((link) => (
                  <li key={link.label}>
                    {'isRoute' in link && link.isRoute ? (
                      <Link
                        to={link.href as '/dashboard' | '/privacy'}
                        className="text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors duration-150 no-underline inline-flex items-center gap-[4px]"
                      >
                        {link.label}
                      </Link>
                    ) : 'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors duration-150 no-underline inline-flex items-center gap-[4px] group"
                      >
                        {link.label}
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity duration-150" />
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        className="text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors duration-150 no-underline"
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

      {/* Divider */}
      <div className="max-w-[1120px] mx-auto px-[24px]">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1120px] mx-auto px-[24px] py-[24px] flex flex-col sm:flex-row items-center justify-between gap-[16px]">
        <div className="flex items-center gap-[16px]">
          <p className="text-[12px] text-zinc-600">
            © {year} MotionSlides. MIT License.
          </p>
          <span className="text-zinc-800 hidden sm:inline">·</span>
          <Link
            to="/privacy"
            className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors duration-150 no-underline"
          >
            Privacy Policy
          </Link>
          <span className="text-zinc-800 hidden sm:inline">·</span>
          <a
            href="https://github.com/Chifez/motion-slides"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-zinc-600 hover:text-zinc-300 transition-colors duration-150 no-underline inline-flex items-center gap-[5px]"
          >
            <Github size={12} />
            Chifez/motion-slides
          </a>
        </div>

        <div className="flex items-center gap-[6px]">
          <span className="w-[6px] h-[6px] rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px] text-zinc-600">
            Local-first &amp; Cloud-synced
          </span>
        </div>
      </div>
    </footer>
  )
}
