import { NavLink } from 'react-router-dom'

import {
  HeartPulse,
  LayoutDashboard,
  Activity,
  Bot,
  FileText,
  UserRound,
  ShieldCheck,
  X,
} from 'lucide-react'

import { ROUTES } from '../../routes/routePaths'

interface PatientSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

const navigation = [
  {
    label: 'Home',
    icon: LayoutDashboard,
    path: ROUTES.PATIENT_DASHBOARD,
    end: true,
  },
  {
    label: 'My Health',
    icon: Activity,
    path: ROUTES.PATIENT_HEALTH,
  },
  {
    label: 'AI Health Assistant',
    icon: Bot,
    path: ROUTES.PATIENT_AI,
  },
  {
    label: 'Reports & Documents',
    icon: FileText,
    path: ROUTES.PATIENT_REPORTS,
  },
  {
    label: 'Profile',
    icon: UserRound,
    path: ROUTES.PATIENT_PROFILE,
  },
]

function PatientSidebar({
  mobile = false,
  onClose,
}: PatientSidebarProps) {
  return (
    <aside
      className={[
        'w-64 shrink-0 border-r border-border bg-white',
        'flex flex-col',
        mobile
          ? 'h-full shadow-2xl'
          : 'hidden lg:flex',
      ].join(' ')}
    >
      {/* BRAND */}

      <div className="flex h-20 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-600 p-2.5 text-white">
            <HeartPulse size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              HealP
            </h1>

            <p className="text-xs text-slate-400">
              Digital Healthcare
            </p>
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        )}
      </div>

      {/* NAVIGATION */}

      <div className="px-4 py-7">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Patient Portal
        </p>

        <nav aria-label="Patient navigation" className="space-y-1">
          {navigation.map(({ label, icon: Icon, path, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={19} />

                  <span>{label}</span>

                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-primary-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* SECURITY CARD */}

      <div className="mt-auto p-4">
        <div className="rounded-2xl bg-primary-50 p-4">
          <ShieldCheck className="text-primary-600" size={24} />

          <h3 className="mt-3 text-sm font-semibold text-slate-800">
            Your Health, Securely
          </h3>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Your medical information belongs to you.
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          HealP © 2026
        </p>
      </div>
    </aside>
  )
}

export default PatientSidebar