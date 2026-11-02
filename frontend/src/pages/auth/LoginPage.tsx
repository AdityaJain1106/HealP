import { Link } from 'react-router-dom'
import { HeartPulse, ArrowLeft } from 'lucide-react'
import { ROUTES } from '../../routes/routePaths'

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <HeartPulse size={26} />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Welcome to HealP
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Authentication will be integrated with Firebase in a
          later milestone.
        </p>

        <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          Login interface setup is ready. Patient and doctor
          authentication will be implemented separately.
        </div>
      </div>
    </main>
  )
}

export default LoginPage