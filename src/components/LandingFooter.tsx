import { Link } from '@tanstack/react-router'
import { Github } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/[0.06] px-6 md:px-10 py-10 bg-black">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left — Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <Logo expanded size={24} />
          <p className="text-[12px] text-neutral-600">
            A cinematic presentation engine for developers.
          </p>
        </div>

        {/* Center — Links */}
        <nav className="flex items-center gap-6 text-[13px] text-neutral-500">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <Link to="/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</Link>
          <a href="https://github.com/Chifez/motion-slides" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </nav>

        {/* Right — Social + copyright */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <a
            href="https://github.com/Chifez/motion-slides"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-white transition-colors"
          >
            <Github size={14} />
            Chifez/motion-slides
          </a>
          <p className="text-[11px] text-neutral-700">© {year} MotionSlides. MIT License.</p>
        </div>
      </div>
    </footer>
  )
}
