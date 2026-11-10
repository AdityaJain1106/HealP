import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Stethoscope,
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  ChevronRight,
} from 'lucide-react'

import {
  getAllUsers,
  verifyDoctor,
  type ManagedUser,
} from '../../services/adminService'
import { ROUTES } from '../../routes/routePaths'

type DoctorFilterTab = 'pending' | 'active' | 'rejected' | 'all'

export default function AdminDoctorVerificationsPage() {
  const [doctors, setDoctors] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<DoctorFilterTab>('pending')

  // Modal state
  const [selectedDoctor, setSelectedDoctor] = useState<ManagedUser | null>(null)
  const [decision, setDecision] = useState<'active' | 'rejected'>('active')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDoctors = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')

      const users = await getAllUsers({ role: 'doctor' })
      setDoctors(users)
    } catch (err) {
      console.error('Failed to load doctors list:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load doctor profiles for verification.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadDoctors()
  }, [])

  const filteredDoctors = doctors.filter((doc) => {
    // Tab filter
    if (activeTab === 'pending' && doc.accountStatus !== 'pending') return false
    if (activeTab === 'active' && doc.accountStatus !== 'active') return false
    if (activeTab === 'rejected' && doc.accountStatus !== 'rejected') return false

    // Search filter
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.email.toLowerCase().includes(q) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(q)) ||
      (doc.registrationNumber && doc.registrationNumber.toLowerCase().includes(q)) ||
      (doc.workplaceName && doc.workplaceName.toLowerCase().includes(q))
    )
  })

  const pendingCount = doctors.filter((d) => d.accountStatus === 'pending').length
  const activeCount = doctors.filter((d) => d.accountStatus === 'active').length
  const rejectedCount = doctors.filter((d) => d.accountStatus === 'rejected').length

  const handleOpenDecisionModal = (
    doctor: ManagedUser,
    action: 'active' | 'rejected'
  ) => {
    setSelectedDoctor(doctor)
    setDecision(action)
    setNotes(
      action === 'active'
        ? 'Medical registration and credentials verified in national medical registry.'
        : 'Medical registration number could not be validated or details are incomplete.'
    )
  }

  const handleExecuteDecision = async () => {
    if (!selectedDoctor) return

    try {
      setProcessing(true)
      setError('')
      setSuccess('')

      const message = await verifyDoctor(selectedDoctor.uid, decision, notes)
      setSuccess(message)
      setSelectedDoctor(null)
      await loadDoctors(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to record verification decision.'
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 space-y-6">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to={ROUTES.ADMIN_DASHBOARD} className="hover:text-indigo-600 transition">
          Admin Dashboard
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-800">Doctor Verifications</span>
      </div>

      {/* TITLE & ACTIONS */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Doctor Verification Desk
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Validate physician qualifications, verify regulatory council registrations, and manage portal authorizations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDoctors(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* FEEDBACK BANNERS */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <p>{success}</p>
        </div>
      )}

      {/* TABS & SEARCH BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        {/* TAB CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'pending', label: 'Pending Review', count: pendingCount, color: 'text-amber-600' },
            { id: 'active', label: 'Verified & Active', count: activeCount, color: 'text-emerald-600' },
            { id: 'rejected', label: 'Declined', count: rejectedCount, color: 'text-red-600' },
            { id: 'all', label: 'All Doctors', count: doctors.length, color: 'text-slate-600' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DoctorFilterTab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor, reg no, email..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* DOCTORS DIRECTORY CARDS */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 size={36} className="mx-auto animate-spin text-indigo-600" />
          <p className="mt-4 text-xs font-medium text-slate-600">
            Retrieving doctor credentials from system vault...
          </p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Stethoscope size={36} className="mx-auto text-slate-300" />
          <p className="mt-4 font-semibold text-slate-800">No doctors match this filter</p>
          <p className="mt-1 text-xs text-slate-500">
            Try switching tab categories or clearing your search term.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredDoctors.map((doc) => {
            const isDocPending = doc.accountStatus === 'pending'
            const isDocActive = doc.accountStatus === 'active'
            const isDocRejected = doc.accountStatus === 'rejected'

            return (
              <div
                key={doc.uid}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  {/* DOCTOR INFO LEFT */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-700">
                        {doc.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900">
                            Dr. {doc.name}
                          </h2>

                          {isDocActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                              <ShieldCheck size={13} />
                              Verified Doctor
                            </span>
                          )}

                          {isDocPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                              <Clock size={13} />
                              Verification Pending
                            </span>
                          )}

                          {isDocRejected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                              <XCircle size={13} />
                              Declined
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-indigo-600 font-medium">
                          {doc.specialization || 'Specialization Not Declared'}
                          {doc.qualification ? ` • ${doc.qualification}` : ''}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="text-slate-400" />
                            {doc.email}
                          </span>
                          {doc.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={13} className="text-slate-400" />
                              {doc.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CREDENTIAL DETAILS CHIPS */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs">
                      <div>
                        <p className="text-[11px] font-medium text-slate-400">
                          Medical Registration No
                        </p>
                        <p className="mt-0.5 font-mono font-bold text-slate-900">
                          {doc.registrationNumber || 'Not provided'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium text-slate-400">
                          Issuing Medical Council
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-800">
                          {doc.issuingCouncil || 'Not provided'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium text-slate-400">
                          Experience
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-800">
                          {doc.experience || 'Not specified'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-medium text-slate-400">
                          Workplace / Practice
                        </p>
                        <p className="mt-0.5 font-semibold text-slate-800 truncate">
                          {doc.workplaceName || 'Private Practice'}
                        </p>
                      </div>
                    </div>

                    {/* BIO OR CLINICAL FOCUS */}
                    {doc.bio && (
                      <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
                        "{doc.bio}"
                      </p>
                    )}

                    {/* VERIFICATION NOTES */}
                    {doc.verificationNotes && (
                      <div className="text-xs text-slate-500 bg-amber-50/60 border border-amber-200/50 p-3 rounded-xl">
                        <span className="font-semibold text-amber-900">Administrator Remarks:</span>{' '}
                        {doc.verificationNotes}
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS RIGHT */}
                  <div className="flex flex-row lg:flex-col items-center gap-2.5 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-48">
                    {isDocPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenDecisionModal(doc, 'active')}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 size={15} />
                          Approve Doctor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDecisionModal(doc, 'rejected')}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <XCircle size={15} />
                          Decline Application
                        </button>
                      </>
                    )}

                    {isDocActive && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(doc, 'rejected')}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                      >
                        <Clock size={15} />
                        Revoke Approval
                      </button>
                    )}

                    {isDocRejected && (
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(doc, 'active')}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                      >
                        <CheckCircle2 size={15} />
                        Re-evaluate & Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CONFIRMATION DECISION MODAL */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-7 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2.5 ${
                  decision === 'active'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {decision === 'active' ? (
                  <CheckCircle2 size={24} />
                ) : (
                  <XCircle size={24} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {decision === 'active'
                    ? 'Confirm Doctor Approval'
                    : 'Decline Doctor Application'}
                </h3>
                <p className="text-xs text-slate-500">
                  Dr. {selectedDoctor.name} ({selectedDoctor.email})
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5 text-slate-600">
              <p>
                <span className="font-semibold text-slate-700">Registration Number:</span>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {selectedDoctor.registrationNumber || 'Not recorded'}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Council:</span>{' '}
                {selectedDoctor.issuingCouncil || 'Not provided'}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Qualification:</span>{' '}
                {selectedDoctor.qualification || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Official Verification Notes / Feedback:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Audit notes or reasons to be shared with the applicant..."
                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDecision}
                disabled={processing}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60 ${
                  decision === 'active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
