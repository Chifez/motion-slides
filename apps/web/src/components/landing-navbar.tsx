import { Link } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const NAV_LINKS = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Copilot', href: '#copilot' },
  { label: 'Code & Git', href: '#code-git' },
  { label: 'Export', href: '#export' },
  { label: 'Compare', href: '#compare' },
] as const

export function LandingNavbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-[60px] bg-[#070709]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center">
      <div className="max-w-[1120px] mx-auto w-full px-[24px] flex items-center justify-between gap-[16px]">
        <Link to="/" className="no-underline shrink-0">
          <Logo expanded size={26} />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-[28px] text-[13px] font-medium text-zinc-400"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-zinc-100 transition-colors duration-150 no-underline"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-[10px] shrink-0">
          <a
            href="https://github.com/Chifez/motion-slides"
            target="_blank"
            rel="noreferrer"
            aria-label="MotionSlides on GitHub"
            title="View on GitHub"
            className="w-[34px] h-[34px] flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.07] hover:border-white/[0.16] transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97]"
          >
            <Github size={15} />
          </a>

          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center bg-zinc-100 hover:bg-white text-zinc-950 text-[13px] font-semibold px-[16px] py-[8px] rounded-full no-underline transition-[transform,background-color] duration-150 active:scale-[0.97]"
          >
            Open Editor
          </Link>
        </div>
      </div>
    </header>
  )
}
