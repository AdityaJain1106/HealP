import {
  HeartPulse,
  Activity,
  Bot,
  FileText,
  UserRound,
  CalendarDays,
  Hospital,
  Pill,
  Droplets,
  ShieldCheck,
  AlertCircle,
  Upload,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Phone,
  FlaskConical,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import {
  getPatientProfile,
} from '../../services/patientProfileService'
import type {
  PatientProfile,
} from '../../services/patientProfileService'
import PrescriptionUploadDialog from '../../components/patient/PrescriptionUploadDialog'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import PageContainer from '../../components/common/PageContainer'
import { ROUTES } from '../../routes/routePaths'

function PatientDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false)

  const patientName =
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'there'

  const [patientProfile, setPatientProfile] =
    useState<PatientProfile | null>(null)

  useEffect(() => {
    if (!user) return

    const uid = user.uid
    let cancelled = false

    async function loadProfile() {
      try {
        const data = await getPatientProfile(uid)

        if (!cancelled) {
          setPatientProfile(data)
        }
      } catch (error) {
        console.error('Unable to load dashboard profile:', error)
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  const currentDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const healthStats = [
    {
      title: 'Medical Documents',
      value: '—',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50',
      status: 'Records',
      variant: 'info' as const,
    },
    {
      title: 'Health Records',
      value: '—',
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50',
      status: 'Health',
      variant: 'success' as const,
    },
    {
      title: 'Current Medicines',
      value: '—',
      icon: Pill,
      color: 'text-purple-600 bg-purple-50',
      status: 'Medication',
      variant: 'primary' as const,
    },
    {
      title: 'Follow-up Appointments',
      value: '—',
      icon: CalendarDays,
      color: 'text-amber-600 bg-amber-50',
      status: 'Upcoming',
      variant: 'warning' as const,
    },
  ]

  const quickAccess = [
    {
      title: 'Upload Reports',
      description: 'Store your medical reports.',
      icon: Upload,
      color: 'text-blue-600 bg-blue-50',
      path: ROUTES.PATIENT_REPORTS,
    },
    {
      title: 'AI Health Assistant',
      description: 'Get AI-powered health assistance.',
      icon: Bot,
      color: 'text-purple-600 bg-purple-50',
      path: ROUTES.PATIENT_AI,
    },
    {
      title: 'Medical History',
      description: 'Review your health timeline.',
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50',
      path: ROUTES.PATIENT_HEALTH,
    },
    {
      title: 'My Profile',
      description: 'Manage personal information.',
      icon: UserRound,
      color: 'text-orange-600 bg-orange-50',
      path: ROUTES.PATIENT_PROFILE,
    },
  ]

  const healthcareServices = [
    {
      title: 'Hospitals',
      description: 'Find nearby hospitals and healthcare facilities.',
      icon: Hospital,
      color: 'text-blue-600 bg-blue-50',
      path: ROUTES.PATIENT_HOSPITALS,
    },
    {
      title: 'Pharmacies',
      description: 'Locate pharmacies for your medication needs.',
      icon: Pill,
      color: 'text-emerald-600 bg-emerald-50',
      path: ROUTES.PATIENT_PHARMACIES,
    },
    {
      title: 'Blood Banks',
      description: 'Discover blood banks and donation centers.',
      icon: Droplets,
      color: 'text-rose-600 bg-rose-50',
      path: ROUTES.PATIENT_BLOOD_BANKS,
    },
    {
      title: 'Diagnostic Centers',
      description: 'Find laboratories and testing facilities.',
      icon: FlaskConical,
      color: 'text-purple-600 bg-purple-50',
      path: ROUTES.PATIENT_DIAGNOSTICS,
    },
  ]

  const healthAwareness = [
    {
      title: 'Stay Healthy',
      description:
        'Maintain a balanced lifestyle, stay hydrated, exercise regularly, and follow your healthcare professional’s advice.',
      icon: HeartPulse,
      color: 'text-emerald-600',
      background: 'bg-emerald-50',
      border: 'border-emerald-100',
      badge: 'Daily Wellness',
      badgeVariant: 'success' as const,
      points: ['Stay hydrated', 'Exercise regularly'],
    },
    {
      title: 'Keep Your Records Updated',
      description:
        'Maintain updated medical records and share relevant information with your healthcare professional.',
      icon: ShieldCheck,
      color: 'text-blue-600',
      background: 'bg-blue-50',
      border: 'border-blue-100',
      badge: 'Health Management',
      badgeVariant: 'info' as const,
      points: ['Update medical details', 'Keep reports organized'],
    },
  ]

  const emergencyDetails = [
    {
      title: 'Blood Group',
      value: patientProfile?.bloodGroup || 'Not provided',
      description: 'Your blood group information',
      icon: Droplets,
      iconColor: 'text-rose-600',
      iconBackground: 'bg-rose-50',
    },
    {
      title: 'Allergies',
      value: patientProfile?.allergies?.length
        ? patientProfile.allergies.join(', ')
        : 'Not provided',
      description: 'Known allergies and reactions',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      iconBackground: 'bg-amber-50',
    },
    {
      title: 'Emergency Contact',
      value: patientProfile?.emergencyContactName
        ? `${patientProfile.emergencyContactName} ${patientProfile.emergencyContactPhone || ''
        }`
        : 'Not provided',
      description: 'Person to contact in an emergency',
      icon: Phone,
      iconColor: 'text-blue-600',
      iconBackground: 'bg-blue-50',
    },
  ]

  return (
    <PageContainer size="full">
      <div className="min-w-0">

        {/* WELCOME SECTION */}

        <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              {currentDate}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome back, {patientName}! 👋
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Here's an overview of your health and medical records.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              leftIcon={<Upload size={18} />}
              onClick={() => setShowPrescriptionUpload(true)}
            >
              Upload Prescription
            </Button>
          </div>
        </section>

        {/* HEALTH OVERVIEW */}

        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Health Overview
            </h2>

            <Badge variant="success" className="w-fit">
              Personal Health Vault
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {healthStats.map((stat) => {
              const Icon = stat.icon

              return (
                <Card
                  key={stat.title}
                  hoverable
                  className="flex min-w-0 flex-row items-center gap-3 p-4 sm:block sm:p-5"
                >
                  <div className={`shrink-0 rounded-xl p-3 ${stat.color}`}>
                    <Icon size={22} />
                  </div>

                  <div className="min-w-0 flex-1 sm:mt-5">
                    <p className="text-xl font-bold text-slate-900 sm:text-2xl">
                      {stat.value}
                    </p>

                    <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
                      {stat.title}
                    </p>
                  </div>

                  <div className="shrink-0 sm:absolute sm:right-5 sm:top-5">
                    <Badge variant={stat.variant}>
                      {stat.status}
                    </Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* QUICK ACCESS */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Access
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Access your frequently used healthcare tools.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickAccess.map(
              ({ title, description, icon: Icon, color, path }) => (
                <Card
                  key={title}
                  hoverable
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${title}`}
                  onClick={() => navigate(path)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(path)
                    }
                  }}
                  className="group flex min-h-32 min-w-0 cursor-pointer flex-col justify-between gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-3 ${color}`}>
                      <Icon size={23} />
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="text-slate-300 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {description}
                    </p>
                  </div>
                </Card>
              ),
            )}
          </div>
        </section>

        {/* HEALTHCARE SERVICES */}

        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Nearby Healthcare Services
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Find healthcare facilities around you.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {healthcareServices.map(
              ({ title, description, icon: Icon, color, path }) => (
                <Card
                  key={title}
                  hoverable
                  role="link"
                  tabIndex={0}
                  aria-label={`Explore ${title}`}
                  onClick={() => navigate(path)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      navigate(path)
                    }
                  }}
                  className="group flex min-h-36 min-w-0 cursor-pointer items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                >
                  <div
                    className={`shrink-0 rounded-2xl p-3.5 transition-transform duration-200 group-hover:scale-105 ${color}`}
                  >
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-primary-600">
                      {title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {description}
                    </p>

                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary-600">
                      Explore services
                      <ArrowUpRight
                        size={14}
                        className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </Card>
              ),
            )}
          </div>
        </section>

        {/* HEALTH AWARENESS */}

        <section className="mb-8">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={19} className="text-primary-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                Health Awareness
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Small steps today contribute to better health tomorrow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {healthAwareness.map(
              ({
                title,
                description,
                icon: Icon,
                color,
                background,
                border,
                badge,
                badgeVariant,
                points,
              }) => (
                <Card
                  key={title}
                  hoverable
                  className={`group flex h-full min-h-64 min-w-0 flex-col justify-between border ${border} transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`rounded-2xl p-3.5 ${background}`}>
                        <Icon size={26} className={color} strokeWidth={1.8} />
                      </div>

                      <ArrowUpRight
                        size={18}
                        className="text-slate-300 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1"
                      />
                    </div>

                    <h3 className="mt-5 text-base font-semibold text-slate-900">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      {points.map((point) => (
                        <div
                          key={point}
                          className="flex items-center gap-2 text-xs text-slate-500"
                        >
                          <CheckCircle2 size={14} className={color} />
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <Badge variant={badgeVariant}>
                      {badge}
                    </Badge>
                  </div>
                </Card>
              ),
            )}
          </div>
        </section>

        {/* EMERGENCY INFORMATION */}

        <section className="mb-8">
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <AlertCircle className="shrink-0 text-red-500" size={21} />

              <h2 className="text-lg font-semibold text-slate-900">
                Emergency Information
              </h2>

              <Badge variant="warning">
                Important
              </Badge>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Keep your essential emergency details accessible.
            </p>
          </div>

          <Card className="border border-red-100 bg-red-50/30 p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="shrink-0 rounded-xl bg-red-100 p-2.5 text-red-600">
                <ShieldCheck size={22} />
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">
                  Your Emergency Profile
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These details can help healthcare professionals
                  and emergency contacts access important information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {emergencyDetails.map(
                ({
                  title,
                  value,
                  description,
                  icon: Icon,
                  iconColor,
                  iconBackground,
                }) => (
                  <div
                    key={title}
                    className="min-w-0 rounded-xl border border-slate-100 bg-white p-4 transition-shadow duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`shrink-0 rounded-lg p-2.5 ${iconBackground}`}>
                        <Icon size={20} className={iconColor} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          {title}
                        </p>

                        <p className="mt-1 break-words text-sm font-semibold text-slate-400">
                          {value}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      {description}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-red-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Your emergency details have not been configured yet.
              </p>

              <button
                type="button"
                onClick={() => navigate(ROUTES.PATIENT_PROFILE)}
                className="flex items-center gap-2 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <UserRound size={15} />
                Update details in My Profile
              </button>
            </div>
          </Card>
        </section>

        {/* FOOTER */}

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-border py-6 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
          <p>© 2026 HealP. Your Digital Health Companion.</p>

          <p className="flex items-center gap-2">
            <ShieldCheck size={15} />
            Secure Healthcare Platform
          </p>
        </footer>
      </div>
      {showPrescriptionUpload && (
        <PrescriptionUploadDialog
          onClose={() => setShowPrescriptionUpload(false)}
          onSuccess={(mode) => {
            setShowPrescriptionUpload(false)

            if (mode === 'ai') {
              navigate(ROUTES.PATIENT_AI)
            } else {
              navigate(ROUTES.PATIENT_REPORTS)
            }
          }}
        />
      )}
    </PageContainer>
  )
}

export default PatientDashboardPage