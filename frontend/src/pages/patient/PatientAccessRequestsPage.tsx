
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  FileText,
  HeartPulse,
  Pill,
  FolderLock,
  AlertCircle,
  X,
  ClipboardPlus,
} from 'lucide-react'

import {
  getPatientAccessRequests,
  approveDoctorAccessRequest,
  rejectDoctorAccessRequest,
} from '../../services/patientAccessService'

import type {
  DoctorAccessRequest,
  DoctorAccessPermission,
} from '../../services/patientAccessService'

import { ROUTES } from '../../routes/routePaths'
import { usePageTitle } from '../../hooks/usePageTitle'

const permissionOptions: {
  value: DoctorAccessPermission
  label: string
  description: string
  icon: typeof UserRound
}[] = [
  {
    value: 'profile',
    label: 'Health Profile',
    description: 'Personal and basic health information',
    icon: UserRound,
  },
  {
    value: 'medicalHistory',
    label: 'Medical History',
    description: 'Conditions, consultations and medical timeline',
    icon: HeartPulse,
  },
  {
    value: 'documents',
    label: 'Medical Documents',
    description: 'Reports, scans and uploaded documents',
    icon: FolderLock,
  },
  {
    value: 'prescriptions',
    label: 'View Existing Prescriptions',
    description: 'Read previous prescriptions and AI-reviewed information',
    icon: Pill,
  },
  {
    value: 'prescriptionCreation',
    label: 'Create New Prescriptions',
    description:
      'Authorize this doctor to prepare and submit new prescriptions for your review',
    icon: ClipboardPlus,
  },
]

function formatDate(
  timestamp?: DoctorAccessRequest['createdAt']
): string {
  if (!timestamp) return 'Date unavailable'

  let date: Date

  if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (timestamp._seconds || timestamp.seconds) {
    date = new Date(
      (timestamp._seconds ?? timestamp.seconds ?? 0) * 1000
    )
  } else {
    return 'Date unavailable'
  }

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function PatientAccessRequestsPage() {
  usePageTitle('Access Requests')
  const navigate = useNavigate()

  const [requests, setRequests] = useState<DoctorAccessRequest[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, DoctorAccessPermission[]>
  >({})

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getPatientAccessRequests()
      setRequests(result)

      setSelectedPermissions((previous) => {
        const next = { ...previous }

        result.forEach((request) => {
          if (!next[request.requestId]) {
            next[request.requestId] = [...request.permissions]
          }
        })

        return next
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load access requests.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  function togglePermission(
    requestId: string,
    permission: DoctorAccessPermission
  ) {
    setSelectedPermissions((previous) => {
      const current = previous[requestId] ?? []

      const updated = current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]

      return {
        ...previous,
        [requestId]: updated,
      }
    })
  }

  async function handleApprove(request: DoctorAccessRequest) {
    const permissions = selectedPermissions[request.requestId] ?? []

    if (permissions.length === 0) {
      setError('Select at least one permission before approving.')
      return
    }

    const confirmed = window.confirm(
      'Approve this doctor’s request with only the selected permissions?'
    )

    if (!confirmed) return

    try {
      setProcessingId(request.requestId)
      setError('')
      setSuccess('')

      await approveDoctorAccessRequest(
        request.requestId,
        permissions
      )

      navigate(ROUTES.PATIENT_ACCESS_MANAGEMENT, {
        replace: true,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to approve this request.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(request: DoctorAccessRequest) {
    const confirmed = window.confirm(
      'Are you sure you want to reject this doctor’s access request?'
    )

    if (!confirmed) return

    try {
      setProcessingId(request.requestId)
      setError('')
      setSuccess('')

      await rejectDoctorAccessRequest(request.requestId)

      navigate(ROUTES.PATIENT_ACCESS_MANAGEMENT, {
        replace: true,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reject this request.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10 pt-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Doctor Access Requests
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage who can access your health records.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Security information */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <ShieldAlert
          size={21}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Your health data, your permission
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Doctors cannot access your records through this consent
            system unless you approve their request. You can select
            exactly which categories they may access. Viewing existing
            prescriptions and authorizing new prescription creation are
            separate permissions.
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={19} />
          <p className="flex-1">{success}</p>
          <button
            type="button"
            onClick={() => setSuccess('')}
            aria-label="Dismiss success"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Request count */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock size={21} />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Awaiting your response
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {requests.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Pending requests
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FileText size={21} />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Consent management
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {requests.reduce(
                (total, request) => total + request.permissions.length,
                0
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Requested permissions
            </p>
          </div>
        </div>
      )}

      {/* Request list */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Incoming Requests
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review each request carefully before granting access.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
            <Loader2
              size={30}
              className="animate-spin text-blue-600"
            />
            <p className="mt-4 text-sm text-slate-500">
              Loading access requests...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck size={30} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              No pending access requests
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When a doctor requests access to your health records,
              their request will appear here for your approval.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => {
              const selected =
                selectedPermissions[request.requestId] ?? []

              const isProcessing =
                processingId === request.requestId

              return (
                <article
                  key={request.requestId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  {/* Doctor details */}
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound size={24} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          Doctor Access Request
                        </h3>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          Doctor ID: {request.doctorId}
                        </p>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={13} />
                          Requested on {formatDate(request.createdAt)}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      <Clock size={13} />
                      Pending review
                    </span>
                  </div>

                  {/* Reason */}
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Reason for requesting access
                    </p>

                    <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {request.reason}
                    </p>
                  </div>

                  {/* Permissions */}
                  <div className="mt-6">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          Requested permissions
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Select which categories this doctor can access.
                        </p>
                      </div>

                      <span className="text-xs font-medium text-blue-600">
                        {selected.length} of {request.permissions.length} selected
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {permissionOptions
                        .filter((option) =>
                          request.permissions.includes(option.value)
                        )
                        .map((option) => {
                          const Icon = option.icon
                          const checked = selected.includes(option.value)

                          return (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                checked
                                  ? 'border-blue-200 bg-blue-50/50'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isProcessing}
                                onChange={() =>
                                  togglePermission(
                                    request.requestId,
                                    option.value
                                  )
                                }
                                className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                              />

                              <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                                <Icon size={18} />
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800">
                                  {option.label}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {option.description}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => void handleReject(request)}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={17} />
                      )}
                      Reject Request
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleApprove(request)}
                      disabled={isProcessing || selected.length === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={17} />
                      )}
                      Approve Selected Access
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default PatientAccessRequestsPage
