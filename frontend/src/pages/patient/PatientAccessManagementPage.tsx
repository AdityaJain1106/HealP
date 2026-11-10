
import { useCallback, useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  HeartPulse,
  Pill,
  FolderLock,
  ClipboardPlus,
} from 'lucide-react'

import {
  getPatientDoctorAccess,
  revokeDoctorAccess,
} from '../../services/patientAccessManagementService'

import type {
  PatientDoctorAccess,
} from '../../services/patientAccessManagementService'

import {
  getPatientAccessRequests,
  approveDoctorAccessRequest,
  rejectDoctorAccessRequest,
} from '../../services/patientAccessService'

import type {
  DoctorAccessRequest,
  DoctorAccessPermission,
} from '../../services/patientAccessService'

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
    description: 'Read previous prescriptions',
    icon: Pill,
  },
  {
    value: 'prescriptionCreation',
    label: 'Create New Prescriptions',
    description: 'Prepare new prescriptions for your review',
    icon: ClipboardPlus,
  },
]

const permissionLabels: Record<
  PatientDoctorAccess['permissions'][number],
  { label: string; icon: typeof UserRound }
> = {
  profile: { label: 'Health Profile', icon: UserRound },
  medicalHistory: { label: 'Medical History', icon: HeartPulse },
  documents: { label: 'Medical Documents', icon: FolderLock },
  prescriptions: { label: 'View Existing Prescriptions', icon: Pill },
  prescriptionCreation: {
    label: 'Prescription Creation',
    icon: ClipboardPlus,
  },
}

function formatDate(
  timestamp?: {
    _seconds?: number
    seconds?: number
  } | string | null
): string {
  if (!timestamp) return 'Date unavailable'

  let date: Date

  if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else {
    const seconds = timestamp._seconds ?? timestamp.seconds
    if (!seconds) return 'Date unavailable'
    date = new Date(seconds * 1000)
  }

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function PatientAccessManagementPage() {
  const [accesses, setAccesses] = useState<PatientDoctorAccess[]>([])
  const [requests, setRequests] = useState<DoctorAccessRequest[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, DoctorAccessPermission[]>
  >({})

  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const [accessResults, requestResults] = await Promise.all([
        getPatientDoctorAccess(),
        getPatientAccessRequests(),
      ])

      setAccesses(accessResults)
      setRequests(requestResults)

      setSelectedPermissions((previous) => {
        const next = { ...previous }

        requestResults.forEach((request) => {
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
          : 'Unable to load access information.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  function togglePermission(
    requestId: string,
    permission: DoctorAccessPermission
  ) {
    setSelectedPermissions((previous) => {
      const current = previous[requestId] ?? []

      const updated = current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]

      return { ...previous, [requestId]: updated }
    })
  }

  async function handleApprove(request: DoctorAccessRequest) {
    const permissions = selectedPermissions[request.requestId] ?? []

    if (permissions.length === 0) {
      setError('Select at least one permission before approving.')
      return
    }

    if (
      !window.confirm(
        'Approve this doctor’s request with only the selected permissions?'
      )
    ) {
      return
    }

    try {
      setProcessingId(request.requestId)
      setError('')
      setSuccess('')

      await approveDoctorAccessRequest(request.requestId, permissions)

      setRequests((previous) =>
        previous.filter((item) => item.requestId !== request.requestId)
      )

      setSuccess(
        'Access approved. The doctor now appears under Active Permissions.'
      )

      // Reload both lists so the newly approved grant appears immediately.
      await loadData()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to approve this request.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(request: DoctorAccessRequest) {
    if (
      !window.confirm(
        'Are you sure you want to reject this doctor’s access request?'
      )
    ) {
      return
    }

    try {
      setProcessingId(request.requestId)
      setError('')
      setSuccess('')

      await rejectDoctorAccessRequest(request.requestId)

      setRequests((previous) =>
        previous.filter((item) => item.requestId !== request.requestId)
      )

      setSuccess('Doctor access request rejected.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to reject this request.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRevoke(access: PatientDoctorAccess) {
    if (
      !window.confirm(
        `Revoke all access granted to ${access.doctorName}? They will no longer be able to access your records through this consent grant.`
      )
    ) {
      return
    }

    try {
      setProcessingId(access.grantId)
      setError('')
      setSuccess('')

      await revokeDoctorAccess(access.grantId)

      setAccesses((previous) =>
        previous.filter((item) => item.grantId !== access.grantId)
      )

      setSuccess(
        `Access granted to ${access.doctorName} has been revoked successfully.`
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to revoke doctor access.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 pb-10 pt-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Access & Permissions
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review requests and manage doctors authorized to access your
              health records.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
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
        <ShieldAlert size={21} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Your health data, your permission
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Review every incoming request before granting access. You choose
            exactly which categories a doctor can access. You can revoke
            existing permissions at any time. Previously downloaded copies
            cannot be remotely recalled.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={19} />
          <p className="flex-1">{success}</p>
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss success">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock size={21} />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Awaiting response
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {requests.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Pending requests</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <UserRound size={21} />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Currently authorized
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {accesses.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Active doctors</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <ShieldCheck size={21} />
              </div>
              <span className="text-xs font-medium text-slate-400">
                Consent management
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {accesses.reduce(
                (total, access) => total + access.permissions.length,
                0
              )}
            </p>
            <p className="mt-1 text-sm text-slate-500">Active permissions</p>
          </div>
        </div>
      )}

      {/* Pending requests */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock size={19} className="text-amber-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pending Requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the doctor's reason and choose which permissions to grant.
            </p>
          </div>
          {!loading && (
            <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {requests.length} pending
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-12">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
            <h3 className="mt-3 font-semibold text-slate-900">
              No pending requests
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              New doctor access requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => {
              const selected = selectedPermissions[request.requestId] ?? []
              const isProcessing = processingId === request.requestId

              return (
                <article
                  key={request.requestId}
                  className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Doctor Access Request
                        </h3>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          Doctor ID: {request.doctorId}
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={13} />
                          Requested on {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      <Clock size={13} />
                      Pending review
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Reason for requesting access
                    </p>
                    <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {request.reason}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          Requested permissions
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          Uncheck anything you do not want to share.
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
                                  togglePermission(request.requestId, option.value)
                                }
                                className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                              />
                              <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                                <Icon size={18} />
                              </div>
                              <div>
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

      {/* Active permissions */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={19} className="text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Active Permissions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Doctors who currently have your permission to access records.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-12">
            <Loader2 size={28} className="animate-spin text-blue-600" />
          </div>
        ) : accesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <ShieldCheck size={28} className="mx-auto text-blue-500" />
            <h3 className="mt-3 font-semibold text-slate-900">
              No active doctor permissions
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Once you approve a request, the doctor and granted permissions
              will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {accesses.map((access) => {
              const isProcessing = processingId === access.grantId

              return (
                <article
                  key={access.grantId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <UserRound size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {access.doctorName}
                        </h3>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          Doctor ID: {access.doctorId}
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={13} />
                          Access granted on {formatDate(access.grantedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <ShieldCheck size={13} />
                      Active access
                    </span>
                  </div>

                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-slate-800">
                      Approved permissions
                    </h4>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {access.permissions.map((permission) => {
                        const option = permissionLabels[permission]
                        if (!option) return null
                        const Icon = option.icon

                        return (
                          <div
                            key={permission}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                          >
                            <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                              <Icon size={17} />
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {option.label}
                            </span>
                            <CheckCircle2
                              size={16}
                              className="ml-auto shrink-0 text-emerald-600"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                    <p className="text-xs leading-5 text-slate-500">
                      You can revoke this doctor's access at any time.
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleRevoke(access)}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Revoke Access
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

export default PatientAccessManagementPage
