import { Link } from 'react-router-dom'
import { HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react'
import { ROUTES } from '../routes/routePaths'

function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <HeartPulse size={34} />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Welcome to HealP
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-slate-500">
          Your centralized digital health record and intelligent
          healthcare companion.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm">
            <HeartPulse className="text-blue-600" size={30} />

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Patient Portal
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage medical records, prescriptions, health reports,
              and AI-powered health summaries.
            </p>

            <Link
              to={ROUTES.LOGIN}
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Continue as Patient
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm">
            <Stethoscope className="text-emerald-600" size={30} />

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Doctor Portal
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Access authorized patient records, manage consultations,
              and review medical summaries.
            </p>

            <Link
              to={ROUTES.LOGIN}
              className="mt-6 inline-flex rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Continue as Doctor
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
          <ShieldCheck size={17} />
          Secure healthcare management platform
        </div>
      </div>
    </main>
  )
}

export default LandingPage