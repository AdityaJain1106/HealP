
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Stethoscope,
  Users,
  CalendarDays,
  ArrowRight,
  UserRoundCheck,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Activity,
  AlertCircle,
  UserCircle,
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { logoutUser } from '../../services/authService'
import { ROUTES } from '../../routes/routePaths'
import { usePageTitle } from '../../hooks/usePageTitle'

function DoctorDashboardPage() {
  usePageTitle('Doctor Dashboard')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  const doctorName =
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'Doctor'

  const initials = doctorName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const currentDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  

  const handleLogout = async () => {
    if (loggingOut) return

    try {
      setLoggingOut(true)
      setLogoutError('')
      await logoutUser()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Unable to log out. Please try again.',
      )
      setLoggingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to={ROUTES.DOCTOR_DASHBOARD} className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm">
              <Stethoscope size={23} />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">
                HealP
              </p>
              <p className="text-xs text-slate-500">
                Doctor Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.DOCTOR_PROFILE}
              className="group flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-slate-100"
              title="View and edit your doctor profile"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition">
                  {doctorName}
                </p>
                <p className="text-xs text-slate-500">
                  Profile & Settings
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 ring-2 ring-transparent transition group-hover:ring-blue-300">
                {initials}
              </div>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={17} />
              <span className="hidden sm:inline">
                {loggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* WELCOME SECTION */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 p-7 text-white shadow-lg sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
              <ShieldCheck size={15} />
              Secure Doctor Workspace
            </div>

            <p className="text-sm font-medium text-blue-100">
              {currentDate}
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, Dr. {doctorName}!
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-50 sm:text-base">
              Manage your patients, review appointment requests and
              access authorized medical records from one place.
            </p>
          </div>

          <div className="pointer-events-none absolute -right-12 -top-16 hidden h-80 w-80 rounded-full border-[35px] border-white/10 sm:block" />
          <div className="pointer-events-none absolute -bottom-32 right-40 hidden h-64 w-64 rounded-full bg-white/10 blur-2xl sm:block" />
          <Activity
            size={125}
            className="pointer-events-none absolute bottom-8 right-12 hidden text-white/15 lg:block"
          />
        </section>

        {/* ERROR MESSAGE */}
        {logoutError && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} />
            {logoutError}
          </div>
        )}

        {/* OVERVIEW */}
        <section className="mt-10">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Workspace
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Your dashboard
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Everything you need to manage your healthcare workflow.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: 'Patient Management',
                description: 'Search and manage authorized patients.',
                icon: Users,
                color: 'bg-blue-50 text-blue-600',
                path: ROUTES.DOCTOR_PATIENT_SEARCH,
              },
              {
                label: 'My Patients',
                description: 'Access your connected patients.',
                icon: UserRoundCheck,
                color: 'bg-emerald-50 text-emerald-600',
                path: ROUTES.DOCTOR_MY_PATIENTS,
              },
              {
                label: 'Appointments',
                description: 'Review and respond to booking requests.',
                icon: CalendarDays,
                color: 'bg-amber-50 text-amber-600',
                path: ROUTES.DOCTOR_APPOINTMENTS,
              },
              {
                label: 'Prescription Queries',
                description: 'Handle patient prescription questions.',
                icon: MessageSquare,
                color: 'bg-violet-50 text-violet-600',
                path: ROUTES.DOCTOR_PRESCRIPTION_INBOX,
              },
              {
                label: 'Doctor Profile',
                description: 'Manage registration, workplace and bio.',
                icon: UserCircle,
                color: 'bg-sky-50 text-sky-600',
                path: ROUTES.DOCTOR_PROFILE,
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl p-3 ${item.color}`}>
                      <Icon size={22} />
                    </div>
                    <ArrowRight
                      size={19}
                      className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                    />
                  </div>

                  <h3 className="mt-5 font-semibold text-slate-900">
                    {item.label}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        

        {/* FOOTER */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} HealP. Doctor Portal.</p>
          <p className="flex items-center gap-2">
            <ShieldCheck size={14} />
            Secure healthcare workspace
          </p>
        </footer>
      </div>
    </main>
  )
}

export default DoctorDashboardPage
