
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  HeartPulse,
  ArrowLeft,
  UserRound,
  Stethoscope,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Globe,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'

import { ROUTES } from '../../routes/routePaths'
import { db } from '../../lib/firebase'
import {
  loginWithEmail,
  registerWithEmail,
  signInWithGoogle,
} from '../../services/authService'
import type { UserRole } from '../../context/AuthContext'

type AuthMode = 'login' | 'signup'

function LoginPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<AuthMode>('login')
  const [role, setRole] = useState<UserRole>('patient')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectUser = async (uid: string) => {
    const userSnapshot = await getDoc(doc(db, 'users', uid))

    if (!userSnapshot.exists()) {
      throw new Error('Your HealP profile could not be found.')
    }

    const userRole = userSnapshot.data().role

    if (userRole === 'patient') {
      navigate(ROUTES.PATIENT_DASHBOARD, { replace: true })
    } else if (userRole === 'doctor') {
      navigate(ROUTES.DOCTOR_DASHBOARD, { replace: true })
    } else {
      throw new Error('Your account has an invalid role.')
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.')
      return
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    try {
      setLoading(true)

      const credential =
        mode === 'signup'
          ? await registerWithEmail(
              name.trim(),
              email.trim(),
              password,
              role,
            )
          : await loginWithEmail(email.trim(), password)

      await redirectUser(credential.user.uid)
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string }

      const messages: Record<string, string> = {
        'auth/email-already-in-use':
          'An account already exists with this email.',
        'auth/invalid-email':
          'Please enter a valid email address.',
        'auth/invalid-credential':
          'Incorrect email or password.',
        'auth/user-not-found':
          'No account found with this email.',
        'auth/wrong-password':
          'Incorrect email or password.',
        'auth/weak-password':
          'Please choose a stronger password.',
        'auth/too-many-requests':
          'Too many attempts. Please try again later.',
        'auth/network-request-failed':
          'Network error. Check your internet connection.',
      }

      setError(
        messages[firebaseError.code || ''] ||
          firebaseError.message ||
          'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')

    try {
      setLoading(true)

      const credential = await signInWithGoogle(role)
      await redirectUser(credential.user.uid)
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string }

      if (firebaseError.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.')
      } else {
        setError(
          firebaseError.message ||
            'Google sign-in failed. Please try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <Link
          to={ROUTES.HOME}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <HeartPulse size={26} />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            {mode === 'signup' ? 'Create your HealP account' : 'Welcome to HealP'}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {mode === 'signup'
              ? 'Join HealP and manage healthcare more intelligently.'
              : 'Sign in to access your healthcare portal.'}
          </p>

          {/* Account role */}
          <div className="mt-7">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Continue as
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                  role === 'patient'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserRound size={18} />
                Patient
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                  role === 'doctor'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Stethoscope size={18} />
                Doctor
              </button>
            </div>
          </div>

          {/* Login / Signup toggle */}
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
              }}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Authentication form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClass} pr-12`}
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signup'
                  ? `Create ${role === 'patient' ? 'Patient' : 'Doctor'} Account`
                  : 'Login'}
            </button>
          </form>

          {/* Google authentication */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Globe size={19} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to use HealP responsibly.
            Your medical information must remain private and secure.
          </p>
        </div>
      </div>
    </main>
  )
}

export default LoginPage
