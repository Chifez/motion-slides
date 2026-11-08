import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Lock, Loader2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/reset-password/')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
  component: ResetPasswordQueryPage,
})

export function ResetPasswordQueryPage() {
  const { token: queryToken } = Route.useSearch()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!queryToken) {
      setError('Invalid or missing password reset token. Please request a new link.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: queryToken,
      })

      if (resetError) {
        setError(resetError.message || 'Failed to reset password. The link may have expired.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        navigate({ to: '/dashboard' })
      }, 2500)
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <header className="mb-8 flex flex-col items-center">
        <Link to="/" className="no-underline mb-4">
          <Logo expanded size={32} />
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-(--ms-bg-surface) border border-(--ms-border) rounded-2xl shadow-2xl p-8 relative z-10"
      >
        {!queryToken ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white">Missing Reset Token</h2>
            <p className="text-sm text-(--ms-text-muted)">
              This password reset link is invalid or incomplete. Please request a new link from the sign-in modal.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition no-underline text-sm"
              >
                Return Home
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle size={28} />
            </div>
            <h2 className="text-2xl font-bold text-white">Password Updated!</h2>
            <p className="text-sm text-(--ms-text-muted)">
              Your password has been reset successfully. Redirecting you to your dashboard...
            </p>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition no-underline text-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-(--ms-text-primary) mb-2">
                Set new password
              </h2>
              <p className="text-sm text-(--ms-text-muted)">
                Please choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-(--ms-text-muted) ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ms-text-muted) opacity-40" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-xl py-2.5 pl-10 pr-4 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-(--ms-text-muted) ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ms-text-muted) opacity-40" size={18} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-xl py-2.5 pl-10 pr-4 text-sm text-(--ms-text-primary) placeholder-(--ms-text-muted) focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 font-medium ml-1 bg-red-400/10 p-2.5 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 mt-4 cursor-pointer border-none"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
              </button>
            </form>

            <footer className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-(--ms-text-muted) hover:text-(--ms-text-primary) transition-colors no-underline"
              >
                <ArrowLeft size={14} /> Back to Home
              </Link>
            </footer>
          </>
        )}
      </motion.div>
    </div>
  )
}

