import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Shield, Lock, Eye, Server, RefreshCw } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPolicyPage,
})

export function PrivacyPolicyPage() {
  const lastUpdated = 'September 20, 2026'

  return (
    <div className="min-h-screen text-zinc-100 bg-[#050507] selection:bg-purple-500/30 selection:text-purple-200">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#050507]/80 border-b border-zinc-800/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline text-zinc-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link to="/" className="flex items-center gap-2 no-underline">
            <Logo expanded size={24} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield size={20} />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-purple-400">Legal & Transparency</span>
            <p className="text-xs text-zinc-500">Last updated: {lastUpdated}</p>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
          Privacy Policy
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed mb-12">
          At <strong className="text-zinc-200">MotionSlides</strong>, we respect your privacy and are committed to protecting the information you share with us. This Privacy Policy explains how your data is collected, used, and safeguarded when using our web application.
        </p>

        <div className="space-y-12 text-zinc-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
              <Eye size={18} className="text-blue-400" />
              <h2>1. Information We Collect</h2>
            </div>
            <p className="text-zinc-400">
              When you use MotionSlides, we may collect the following types of information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
              <li>
                <strong className="text-zinc-200">Authentication Information:</strong> When you register or sign in via Google OAuth, GitHub OAuth, or Email/Password, we receive your name, email address, and profile avatar provided by the respective identity provider.
              </li>
              <li>
                <strong className="text-zinc-200">Presentation Content & Metadata:</strong> Slides, graphics, diagram structures, speaker notes, and revision histories that you create or upload in MotionSlides.
              </li>
              <li>
                <strong className="text-zinc-200">Local-First Storage:</strong> By default, your drafts and active workspaces are saved in your browser's local IndexedDB cache. When you sign in, projects are synchronized with our cloud database.
              </li>
              <li>
                <strong className="text-zinc-200">AI Prompt Inputs:</strong> When using the AI Design Studio Copilot, messages and slide context you explicitly submit are sent to AI model providers (such as OpenAI and Anthropic) solely to generate your requested edits.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
              <RefreshCw size={18} className="text-emerald-400" />
              <h2>2. How We Use Your Information</h2>
            </div>
            <p className="text-zinc-400">
              We use your information exclusively to provide, maintain, and improve our services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
              <li>To authenticate your identity, secure your account, and manage active sessions.</li>
              <li>To synchronize and persist your presentation decks across devices.</li>
              <li>To enable team collaboration, version history comparisons, and presentation sharing when you choose to share a project link.</li>
              <li>We <strong>never</strong> sell, rent, or monetize your personal information or presentation contents with third-party advertisers.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
              <Server size={18} className="text-purple-400" />
              <h2>3. Third-Party Infrastructure & Services</h2>
            </div>
            <p className="text-zinc-400">
              MotionSlides relies on trusted enterprise cloud infrastructure to operate reliably and securely:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
              <li>
                <strong className="text-zinc-200">Cloudflare Workers:</strong> For edge computing, application hosting, and global Content Delivery Network (CDN) acceleration.
              </li>
              <li>
                <strong className="text-zinc-200">Neon PostgreSQL:</strong> For managed serverless relational database storage of accounts and synced presentations.
              </li>
              <li>
                <strong className="text-zinc-200">OAuth Providers (Google & GitHub):</strong> To provide secure single sign-on without requiring MotionSlides to handle or store your external account passwords.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-semibold text-lg">
              <Lock size={18} className="text-amber-400" />
              <h2>4. Data Protection & Security</h2>
            </div>
            <p className="text-zinc-400">
              We employ strict industry-standard security measures:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-300 pl-2">
              <li>All web traffic is transmitted exclusively over encrypted HTTPS connections (TLS 1.3).</li>
              <li>Sensitive credentials and user API keys are encrypted at rest using AES-256-GCM.</li>
              <li>You have full control over your data: you may export decks locally (HTML, PDF, JSON) or delete your projects and account at any time directly from the dashboard.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-white font-semibold text-lg">5. Contact Information</h2>
            <p className="text-zinc-400">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact the maintainers:
            </p>
            <p className="text-zinc-300 font-medium">
              Email:{' '}
              <a href="mailto:chifez1@gmail.com" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">
                chifez1@gmail.com
              </a>
            </p>
            <p className="text-zinc-300 font-medium">
              Repository:{' '}
              <a
                href="https://github.com/Chifez/motion-slides"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
              >
                github.com/Chifez/motion-slides
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#050507] py-8 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} MotionSlides. Released under the MIT License.</p>
      </footer>
    </div>
  )
}
