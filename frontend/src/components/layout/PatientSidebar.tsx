
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import {
  HeartPulse,
  LayoutDashboard,
  Activity,
  Bot,
  FileText,
  ShieldCheck,
  X,
  ChevronDown,
  ClipboardList,
  MessageCircle,
  Pill,
  Stethoscope,
  FileSearch,
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
    label: 'Reports & Documents',
    icon: FileText,
    path: ROUTES.PATIENT_REPORTS,
  },
]

const aiTools = [
  {
    label: 'AI Medical Summary',
    icon: ClipboardList,
    path: `${ROUTES.PATIENT_AI}/summary`,
  },
  {
    label: 'AI Chat Assistant',
    icon: MessageCircle,
    path: `${ROUTES.PATIENT_AI}/chat`,
  },
  {
    label: 'AI Medicine Assistant',
    icon: Pill,
    path: `${ROUTES.PATIENT_AI}/medicine`,
  },
  {
    label: 'AI Symptom Checker',
    icon: Stethoscope,
    path: `${ROUTES.PATIENT_AI}/symptoms`,
  },
  {
    label: 'AI Prescription Reader',
    icon: FileSearch,
    path: `${ROUTES.PATIENT_AI}/prescriptions`,
  },
]

function PatientSidebar({
  mobile = false,
  onClose,
}: PatientSidebarProps) {
  const location = useLocation()

  const isAISection = location.pathname.startsWith(ROUTES.PATIENT_AI)

  const [aiMenuOpen, setAiMenuOpen] = useState(isAISection)

  const closeMobileNavigation = () => {
    if (mobile) onClose?.()
  }

  return (
    <aside
      className={[
        'w-64 shrink-0 border-r border-border bg-white',
        'flex flex-col overflow-y-auto',
        mobile
          ? 'h-full shadow-2xl'
          : 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-screen',
      ].join(' ')}
    >
      {/* BRAND */}

      <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-600 p-2.5 text-white">
            <HeartPulse size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">HealP</h1>
            <p className="text-xs text-slate-400">Digital Healthcare</p>
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

      <div className="shrink-0 px-4 py-7">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Patient Portal
        </p>

        <nav aria-label="Patient navigation" className="space-y-1">
          {navigation.slice(0, 2).map(({ label, icon: Icon, path, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={closeMobileNavigation}
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

          {/* AI HEALTH ASSISTANT MENU */}

          <div
            onMouseEnter={() => setAiMenuOpen(true)}
            onMouseLeave={() => {
              if (!isAISection) setAiMenuOpen(false)
            }}
          >
            <button
              type="button"
              onClick={() => setAiMenuOpen((previous) => !previous)}
              aria-expanded={aiMenuOpen}
              className={[
                'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isAISection
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              ].join(' ')}
            >
              <Bot size={19} />
              <span className="flex-1 text-left">AI Health Assistant</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${aiMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {aiMenuOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-blue-100 pl-3">
                {aiTools.map(({ label, icon: Icon, path }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={closeMobileNavigation}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                      ].join(' ')
                    }
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {navigation.slice(2).map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={closeMobileNavigation}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                ].join(' ')
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* SECURITY CARD */}

      <div className="mt-auto shrink-0 p-4">
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
