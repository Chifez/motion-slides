import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { useEditorStore } from '@/store/editorStore'
import { X, Mail, Lock, User, Loader2, Github, Chrome } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const checkSession = useEditorStore((s) => s.checkSession)
  const syncProjects = useEditorStore((s) => s.syncProjects)

  const [state, formAction] = useActionState(
    async (_prevState: { error: string | null }, formData: FormData) => {
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      const name = formData.get('name') as string

      try {
        if (mode === 'signup') {
          await authClient.signUp.email({
            email,
            password,
            name,
            callbackURL: window.location.origin
          })
        } else {
          await authClient.signIn.email({
            email,
            password,
            callbackURL: window.location.origin
          })
        }

        // Refresh session in store
        await checkSession()
        // Auto-sync existing projects
        await syncProjects()

        onClose()
        return { error: null }
      } catch (err: any) {
        return { error: err.message || 'Authentication failed' }
      }
    },
    { error: null }
  )

  const handleSocialSignIn = async (provider: 'github' | 'google') => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin,
      })
    } catch (err: any) {
      console.error('Social sign in failed:', err)
    }
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <header className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-white/40">
              {mode === 'login'
                ? 'Sign in to sync your projects to the cloud'
                : 'Join MotionSlides to share and collaborate'}
            </p>
          </header>

          <form action={formAction} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {state.error && (
              <p className="text-xs text-red-400 font-medium ml-1 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                {state.error}
              </p>
            )}

            <AuthSubmitButton mode={mode} />
          </form>

          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative px-3 bg-[#161616] text-[10px] uppercase tracking-wider text-white/30 font-bold">
                Or continue with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialSignIn('github')}
                type="button"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Github size={16} />
                <span className="text-sm">GitHub</span>
              </button>

              <button
                onClick={() => handleSocialSignIn('google')}
                type="button"
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Chrome size={16} />
                <span className="text-sm">Google</span>
              </button>
            </div>
          </div>

          <footer className="mt-8 text-center text-xs text-white/40">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4 cursor-pointer bg-transparent border-none"
                >
                  Create one now
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4 cursor-pointer bg-transparent border-none"
                >
                  Sign in instead
                </button>
              </>
            )}
          </footer>
        </div>
      </motion.div>
    </div>
  )
}

function AuthSubmitButton({ mode }: { mode: 'login' | 'signup' }) {
  const { pending } = useFormStatus()

  return (
    <button
      disabled={pending}
      type="submit"
      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer border-none"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        mode === 'login' ? 'Sign In' : 'Create Account'
      )}
    </button>
  )
}
