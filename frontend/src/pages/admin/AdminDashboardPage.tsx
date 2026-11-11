import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Stethoscope,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Activity,
} from 'lucide-react'

import {
  getAdminStats,
  getPendingDoctors,
  verifyDoctor,
  type AdminStats,
  type ManagedUser,
} from '../../services/adminService'
import { ROUTES } from '../../routes/routePaths'
import { usePageTitle } from '../../hooks/usePageTitle'

export default function AdminDashboardPage() {
  usePageTitle('Admin Dashboard')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingDoctors, setPendingDoctors] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Verification modal state
  const [activeDoctor, setActiveDoctor] = useState<ManagedUser | null>(null)
  const [verificationAction, setVerificationAction] = useState<'active' | 'rejected'>('active')
  const [verificationNotes, setVerificationNotes] = useState('')

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')

      const [statsData, pendingData] = await Promise.all([
        getAdminStats(),
        getPendingDoctors(),
      ])

      setStats(statsData)
      setPendingDoctors(pendingData)
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load administration data. Please try again.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleOpenVerifyModal = (doctor: ManagedUser, action: 'active' | 'rejected') => {
  usePageTitle('Admin Dashboard')
    setActiveDoctor(doctor)
    setVerificationAction(action)
    setVerificationNotes(
      action === 'active'
        ? 'Medical credentials and registration verified against official records.'
        : 'Medical council registration or qualification details could not be validated.'
    )
  }

  const handleConfirmVerification = async () => {
    if (!activeDoctor) return

    try {
      setActionLoadingId(activeDoctor.uid)
      setError('')
      setSuccess('')

      const message = await verifyDoctor(
        activeDoctor.uid,
        verificationAction,
        verificationNotes
      )

      setSuccess(message)
      setActiveDoctor(null)
      await loadData(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Verification action failed. Please try again.'
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-100 p-1.5 text-indigo-700">
              <ShieldAlert size={18} />
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Governance & Oversight
            </p>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            System Administration
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Manage user accounts, doctor verification workflows, and system security policies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={18} className="shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <p>{success}</p>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            title: 'Total Users',
            value: stats ? stats.totalUsers : '-',
            description: `${stats?.activeAccounts ?? 0} active accounts`,
            icon: Users,
            color: 'bg-blue-50 text-blue-600',
            border: 'border-blue-100',
          },
          {
            title: 'Registered Patients',
            value: stats ? stats.totalPatients : '-',
            description: 'Lifelong health vaults',
            icon: Activity,
            color: 'bg-emerald-50 text-emerald-600',
            border: 'border-emerald-100',
          },
          {
            title: 'Verified Doctors',
            value: stats ? stats.totalDoctors - stats.pendingDoctors : '-',
            description: `${stats?.totalDoctors ?? 0} total registered`,
            icon: Stethoscope,
            color: 'bg-indigo-50 text-indigo-600',
            border: 'border-indigo-100',
          },
          {
            title: 'Pending Verifications',
            value: stats ? stats.pendingDoctors : '-',
            description: 'Requires administrator review',
            icon: Clock,
            color: 'bg-amber-50 text-amber-600',
            border: stats && stats.pendingDoctors > 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-amber-100',
            highlight: stats && stats.pendingDoctors > 0,
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${item.border}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">{item.title}</p>
                <div className={`rounded-xl p-2.5 ${item.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
                {loading ? <Loader2 size={24} className="animate-spin text-slate-400" /> : item.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{item.description}</p>
            </div>
          )
        })}
      </section>

      {/* PENDING DOCTORS SECTION */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Doctor Verification Queue
              </h2>
              {pendingDoctors.length > 0 && (
                <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  {pendingDoctors.length} Pending
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Healthcare professionals awaiting verification of medical licensing credentials.
            </p>
          </div>

          <Link
            to={ROUTES.ADMIN_DOCTORS}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View Full Verification Desk</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-indigo-600" />
            <p className="mt-3 text-xs text-slate-500">Loading pending applications...</p>
          </div>
        ) : pendingDoctors.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">
              All caught up!
            </p>
            <p className="mt-1 text-xs text-slate-500">
              There are currently no doctor applications pending administrator verification.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pendingDoctors.map((doc) => (
              <div
                key={doc.uid}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:border-indigo-200 hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                        {doc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 leading-snug">
                          Dr. {doc.name}
                        </p>
                        <p className="text-xs text-indigo-600 font-medium">
                          {doc.specialization || 'General Practitioner'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-3 text-xs text-slate-600">
                    <div>
                      <span className="font-medium text-slate-400">Email: </span>
                      <span className="text-slate-800">{doc.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-400">Reg No: </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {doc.registrationNumber || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-400">Council: </span>
                      <span>{doc.issuingCouncil || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-400">Workplace: </span>
                      <span>{doc.workplaceName || 'Private Practice'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-200/60 pt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenVerifyModal(doc, 'active')}
                    disabled={actionLoadingId === doc.uid}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={14} />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenVerifyModal(doc, 'rejected')}
                    disabled={actionLoadingId === doc.uid}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <XCircle size={14} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* QUICK WORKSPACE LINKS */}
      <section className="grid gap-5 sm:grid-cols-2">
        <Link
          to={ROUTES.ADMIN_DOCTORS}
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <UserCheck size={22} />
            </div>
            <ArrowRight
              size={18}
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600"
            />
          </div>
          <h3 className="mt-4 font-bold text-slate-900">
            Doctor Credential Verification
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Review detailed medical council registrations, qualifications, clinical experience, and issue formal verification decisions.
          </p>
        </Link>

        <Link
          to={ROUTES.ADMIN_USERS}
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Users size={22} />
            </div>
            <ArrowRight
              size={18}
              className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
            />
          </div>
          <h3 className="mt-4 font-bold text-slate-900">
            Account Governance Directory
          </h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            View complete directory of patients, doctors, and administrators. Manage account statuses (active, suspended, rejected) and role permissions.
          </p>
        </Link>
      </section>

      {/* CONFIRMATION / NOTES MODAL */}
      {activeDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-7 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2.5 ${
                  verificationAction === 'active'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {verificationAction === 'active' ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <XCircle size={24} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {verificationAction === 'active'
                    ? 'Approve Doctor Registration'
                    : 'Decline Doctor Application'}
                </h3>
                <p className="text-xs text-slate-500">
                  Candidate: Dr. {activeDoctor.name} ({activeDoctor.email})
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-xs space-y-1.5 text-slate-600 border border-slate-200">
              <p>
                <span className="font-semibold text-slate-700">Registration:</span>{' '}
                <span className="font-mono">{activeDoctor.registrationNumber || 'None'}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Council:</span>{' '}
                {activeDoctor.issuingCouncil || 'Not provided'}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Specialization:</span>{' '}
                {activeDoctor.specialization || 'Not specified'}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Verification Notes / Communication to Doctor:
              </label>
              <textarea
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Enter audit remarks or feedback for the applicant..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveDoctor(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={actionLoadingId !== null}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60 ${
                  verificationAction === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoadingId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : verificationAction === 'active' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <XCircle size={14} />
                )}
                Confirm {verificationAction === 'active' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
