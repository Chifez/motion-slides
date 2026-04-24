import { Link } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export function LandingNavbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 bg-black/60 backdrop-blur-md border-b border-white/6">
      <Link to="/" className="no-underline">
        <Logo expanded size={28} />
      </Link>

      <nav className="hidden md:flex items-center gap-7 text-[13px] text-neutral-400 font-medium">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="https://github.com/Chifez/motion-slides" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a>
        <a href="https://github.com/Chifez/motion-slides" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
          <Github size={14} /> GitHub
        </a>
      </nav>

      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 bg-white text-black text-[13px] font-semibold px-4 py-2 rounded-full no-underline hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition-all"
      >
        Open App
      </Link>
    </header>
  )
}
