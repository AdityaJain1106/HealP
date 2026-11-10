
import { useState } from 'react'
import {
  Search,
  UserRound,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Users,
  X,
  FileText,
  Send,
  CheckCircle2,
  HeartPulse,
  Pill,
  FolderLock,
  ClipboardPlus,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  searchDoctorPatient,
  submitDoctorAccessRequest,
  getDoctorAccessRequests,
} from '../../services/doctorPatientService'

import type {
  DoctorPatientSearchResult,
  DoctorAccessPermission,
  DoctorAccessRequest,
} from '../../services/doctorPatientService'

const permissionOptions: {
  value: DoctorAccessPermission
  label: string
  description: string
  icon: typeof UserRound
}[] = [
  {
    value: 'profile',
    label: 'Patient Profile',
    description: 'Personal and basic health information.',
    icon: UserRound,
  },
  {
    value: 'medicalHistory',
    label: 'Medical History',
    description: 'Previous consultations, conditions and treatments.',
    icon: HeartPulse,
  },
  {
    value: 'documents',
    label: 'Reports & Documents',
    description: 'Uploaded medical reports and documents.',
    icon: FolderLock,
  },
  {
    value: 'prescriptions',
    label: 'View Existing Prescriptions',
    description: 'Read previous prescriptions and medicine records.',
    icon: Pill,
  },
  {
    value: 'prescriptionCreation',
    label: 'Create New Prescriptions',
    description:
      'Prepare new prescriptions for patient review and acknowledgement.',
    icon: ClipboardPlus,
  },
]

function DoctorPatientSearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [patient, setPatient] =
    useState<DoctorPatientSearchResult | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [reason, setReason] = useState('')
  const [permissions, setPermissions] = useState<
    DoctorAccessPermission[]
  >([])

  const [requestLoading, setRequestLoading] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState(false)

  const [existingRequest, setExistingRequest] =
    useState<DoctorAccessRequest | null>(null)

  const [requestStatusLoading, setRequestStatusLoading] = useState(false)

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = searchTerm.trim()

    if (query.length < 3) {
      setError('Enter at least 3 characters to search.')
      setPatient(null)
      return
    }

    try {
      setLoading(true)
      setError('')
      setPatient(null)
      setRequestError('')
      setRequestSuccess(false)
      setExistingRequest(null)
      setReason('')
      setPermissions([])

      const result = await searchDoctorPatient(query)
      setPatient(result)

      setRequestStatusLoading(true)

      const requests = await getDoctorAccessRequests()

      const matchingRequest = requests.find(
        (request) =>
          request.patientId === result.patientId &&
          ['pending', 'approved'].includes(request.status)
      )

      setExistingRequest(matchingRequest ?? null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to search for this patient.'
      )
    } finally {
      setLoading(false)
      setRequestStatusLoading(false)
    }
  }

  function clearSearch() {
    setSearchTerm('')
    setPatient(null)
    setError('')
    setReason('')
    setPermissions([])
    setRequestError('')
    setRequestSuccess(false)
    setExistingRequest(null)
  }

  function togglePermission(permission: DoctorAccessPermission) {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    )

    setRequestError('')
  }

  async function handleAccessRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!patient) return

    const trimmedReason = reason.trim()

    if (trimmedReason.length < 10 || trimmedReason.length > 500) {
      setRequestError('Reason must contain between 10 and 500 characters.')
      return
    }

    if (permissions.length === 0) {
      setRequestError('Select at least one permission to continue.')
      return
    }

    try {
      setRequestLoading(true)
      setRequestError('')

      await submitDoctorAccessRequest({
        patientId: patient.patientId,
        reason: trimmedReason,
        permissions,
      })

      const requests = await getDoctorAccessRequests()

      const matchingRequest = requests.find(
        (request) =>
          request.patientId === patient.patientId &&
          request.status === 'pending'
      )

      setExistingRequest(matchingRequest ?? null)
      setRequestSuccess(true)
      setReason('')
      setPermissions([])
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
          : 'Unable to submit the access request.'
      )
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/doctor"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Doctor Dashboard
        </Link>

        {/* Page heading */}
        <div className="mt-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Patient Search
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Find patients and request permission to access their records.
            </p>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <ShieldCheck
            size={21}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Patient privacy comes first
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Search only identifies a patient. Medical records remain
              private until the patient explicitly approves your access
              request.
            </p>
          </div>
        </div>

        {/* Search form */}
        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold text-slate-900">
            Find a Patient
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the patient's registered ID, email address or phone number.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Patient ID, email or phone number"
                maxLength={254}
                className="w-full rounded-xl border border-slate-200 py-3.5 pl-11 pr-11 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !searchTerm.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={17} />
                  Search Patient
                </>
              )}
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-400">
            For privacy, only exact patient matches are returned.
          </p>
        </section>

        {/* Search error */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Search result and access request */}
        {patient && (
          <section className="mt-7">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Search Result
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              {/* Patient details */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserRound size={27} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {patient.name}
                  </h3>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    Patient ID: {patient.patientId}
                  </p>

                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={13} />
                    Active patient
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-blue-500"
                />
                Medical information is not available yet. You must request
                consent before accessing any patient records.
              </div>

              {/* Existing request status */}
              {requestStatusLoading ? (
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 size={17} className="animate-spin" />
                  Checking previous access requests...
                </div>
              ) : existingRequest?.status === 'pending' ? (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle size={21} />
                    <h3 className="font-semibold">Access request pending</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Your request has already been sent. Wait for the patient
                    to respond; you cannot send another request while this
                    one is pending.
                  </p>
                  <p className="mt-3 text-xs text-amber-700">
                    Requested permissions: {existingRequest.permissions.join(', ')}
                  </p>
                </div>
              ) : existingRequest?.status === 'approved' ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 size={21} />
                    <h3 className="font-semibold">Access approved</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    The patient has approved your request. Your approved
                    access permissions are:
                  </p>
                  <p className="mt-3 text-sm font-medium text-emerald-900">
                    {(existingRequest.approvedPermissions ?? []).join(', ') ||
                      'See approved request details'}
                  </p>
                  <p className="mt-3 text-xs text-emerald-700">
                    Patient record viewing will be available once the My
                    Patients workflow is implemented.
                  </p>
                </div>
              ) : requestSuccess ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={21} />
                    <h3 className="font-semibold">
                      Access request submitted
                    </h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Your request has been sent to the patient and is awaiting
                    their response.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleAccessRequest}
                  className="mt-7 border-t border-slate-100 pt-6"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      Request Record Access
                    </h3>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Explain why you need access and select the required
                    information categories.
                  </p>

                  {/* Reason */}
                  <div className="mt-5">
                    <label
                      htmlFor="access-reason"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Reason for access
                      <span className="text-red-500"> *</span>
                    </label>

                    <textarea
                      id="access-reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Explain the clinical purpose of requesting this patient's records..."
                      rows={4}
                      minLength={10}
                      maxLength={500}
                      required
                      className="w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {reason.length}/500 characters (minimum 10)
                    </p>
                  </div>

                  {/* Permission selection */}
                  <div className="mt-6">
                    <p className="text-sm font-medium text-slate-700">
                      Permission scopes
                      <span className="text-red-500"> *</span>
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Select only the categories necessary for your purpose.
                      Prescription viewing and creation are separate permissions.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {permissionOptions.map((option) => {
                        const checked = permissions.includes(option.value)
                        const Icon = option.icon

                        return (
                          <label
                            key={option.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                              checked
                                ? 'border-blue-300 bg-blue-50/60'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePermission(option.value)}
                              className="mt-1 h-4 w-4 accent-blue-600"
                            />

                            <span className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                              <Icon size={18} />
                            </span>

                            <span>
                              <span className="block text-sm font-semibold text-slate-800">
                                {option.label}
                              </span>

                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {option.description}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Request error */}
                  {requestError && (
                    <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <p>{requestError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">
                      The patient must approve your request before access
                      is granted.
                    </p>

                    <button
                      type="submit"
                      disabled={requestLoading}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {requestLoading ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={17} />
                          Send Access Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default DoctorPatientSearchPage
