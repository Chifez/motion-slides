import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { useEditorStore } from '@/store/editor-store'
import { X, Mail, Lock, User, Loader2, Github, Chrome } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export type AuthMode = 'login' | 'signup' | 'forgot-password'

/**
 * Authentication modal with theme-flexible styling.
 * Replaces hardcoded dark-mode hex values with MS design system tokens.
 */
export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const checkSession = useEditorStore((s) => s.checkSession)
  const syncProjects = useEditorStore((s) => s.syncProjects)

  const [state, formAction] = useActionState(
    async (_prevState: { error: string | null; success: string | null }, formData: FormData) => {
      const email = formData.get('email') as string
      const password = formData.get('password') as string
      const name = formData.get('name') as string

      try {
        const currentPath = window.location.pathname
        const callbackURL = currentPath === '/' 
          ? '/dashboard' 
          : `${window.location.pathname}${window.location.search}${window.location.hash}`

        if (mode === 'signup') {
          const { error } = await authClient.signUp.email({
            email,
            password,
            name,
            callbackURL
          })
          if (error) return { error: error.message || 'Signup failed', success: null }
        } else if (mode === 'login') {
          const { error } = await authClient.signIn.email({
            email,
            password,
            callbackURL
          })
          if (error) return { error: error.message || 'Login failed', success: null }
        } else if (mode === 'forgot-password') {
          const { error } = await authClient.forgetPassword({
            email,
            redirectTo: '/reset-password',
          })
          if (error) return { error: error.message || 'Failed to send reset link', success: null }
          return { error: null, success: `Password reset link sent to ${email}. Check your inbox!` }
        }

        await checkSession()
        await syncProjects()

        onClose()
        return { error: null, success: null }
      } catch (err: any) {
        return { error: err.message || 'Authentication failed', success: null }
      }
    },
    { error: null, success: null }
  )

  const handleSocialSignIn = async (provider: 'github' | 'google') => {
    try {
      const currentPath = window.location.pathname
      const callbackURL = currentPath === '/' 
        ? '/dashboard' 
        : `${window.location.pathname}${window.location.search}${window.location.hash}`

      await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: `${window.location.origin}/?error=oauth_error`,
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
        className="relative w-full max-w-md bg-(--ms-bg-surface) border border-(--ms-border) rounded-2xl shadow-2xl overflow-hidden transition-colors"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors border-none bg-transparent cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <header className="text-center mb-8">
            <h2 className="text-2xl font-bold text-(--ms-text-primary) mb-2">
              {mode === 'login'
                ? 'Welcome back'
                : mode === 'signup'
                  ? 'Create an account'
                  : 'Reset your password'}
            </h2>
            <p className="text-sm text-(--ms-text-muted)">
              {mode === 'login'
                ? 'Sign in to sync your projects to the cloud'
                : mode === 'signup'
                  ? 'Join MotionSlides to share and collaborate'
                  : 'Enter your email and we’ll send you a recovery link'}
            </p>
          </header>

          <form action={formAction} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-(--ms-text-muted) ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ms-text-muted) opacity-40" size={18} />
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-xl py-2.5 pl-10 pr-4 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-(--ms-text-muted) ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ms-text-muted) opacity-40" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-xl py-2.5 pl-10 pr-4 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-medium text-(--ms-text-muted)">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-blue-500 hover:text-blue-400 font-medium cursor-pointer border-none bg-transparent"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ms-text-muted) opacity-40" size={18} />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-xl py-2.5 pl-10 pr-4 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                </div>
              </div>
            )}

            {state.error && (
              <p className="text-xs text-red-400 font-medium ml-1 bg-red-400/10 p-2.5 rounded-lg border border-red-400/20">
                {state.error}
              </p>
            )}

            {state.success && (
              <div className="text-xs text-emerald-400 font-medium ml-1 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 leading-relaxed">
                {state.success}
              </div>
            )}

            <AuthSubmitButton mode={mode} />
          </form>

          {mode !== 'forgot-password' && (
            <div className="mt-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-(--ms-border)"></div>
                </div>
                <span className="relative px-3 bg-(--ms-bg-surface) text-[10px] uppercase tracking-wider text-(--ms-text-muted) font-bold">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialSignIn('github')}
                  type="button"
                  className="w-full bg-(--ms-bg-base) hover:bg-(--ms-bg-elevated) border border-(--ms-border) text-(--ms-text-primary) font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Github size={16} />
                  <span className="text-sm">GitHub</span>
                </button>

                <button
                  onClick={() => handleSocialSignIn('google')}
                  type="button"
                  className="w-full bg-(--ms-bg-base) hover:bg-(--ms-bg-elevated) border border-(--ms-border) text-(--ms-text-primary) font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Chrome size={16} />
                  <span className="text-sm">Google</span>
                </button>
              </div>
            </div>
          )}

          <footer className="mt-8 text-center text-xs text-(--ms-text-muted)">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-500 hover:text-blue-400 font-medium underline underline-offset-4 cursor-pointer bg-transparent border-none"
                >
                  Create one now
                </button>
              </>
            ) : mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-500 hover:text-blue-400 font-medium underline underline-offset-4 cursor-pointer bg-transparent border-none"
                >
                  Sign in instead
                </button>
              </>
            ) : (
              <>
                Remember your password?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-blue-500 hover:text-blue-400 font-medium underline underline-offset-4 cursor-pointer bg-transparent border-none"
                >
                  Back to sign in
                </button>
              </>
            )}
          </footer>
        </div>
      </motion.div>
    </div>
  )
}

function AuthSubmitButton({ mode }: { mode: AuthMode }) {
  const { pending } = useFormStatus()

  return (
    <button
      disabled={pending}
      type="submit"
      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 mt-2 cursor-pointer border-none"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        mode === 'login'
          ? 'Sign In'
          : mode === 'signup'
            ? 'Create Account'
            : 'Send Reset Link'
      )}
    </button>
  )
}
