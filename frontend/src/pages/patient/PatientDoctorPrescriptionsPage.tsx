
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  History,
  Loader2,
  Pill,
  RefreshCw,
  Send,
  Stethoscope,
} from 'lucide-react'

import {
  getPatientDoctorPrescriptions,
  getPatientDoctorPrescription,
  acceptPatientDoctorPrescription,
  requestPrescriptionClarification,
  getPatientPrescriptionVersions,
} from '../../services/patientPrescriptionService'

import type {
  DoctorPrescription,
  DoctorPrescriptionVersion,
} from '../../services/patientPrescriptionService'
import { usePageTitle } from '../../hooks/usePageTitle'

const statusConfig = {
  pending_patient_review: {
    label: 'Awaiting your review',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  clarification_requested: {
    label: 'Clarification requested',
    icon: AlertCircle,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
}

function formatDate(value: string): string {
  if (!value) return 'Date unavailable'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimestamp(value: unknown): string {
  if (!value) return 'Date unavailable'

  let date: Date | null = null

  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value)
  } else if (typeof value === 'object') {
    const timestamp = value as {
      seconds?: number
      _seconds?: number
      toDate?: () => Date
    }

    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate()
    } else {
      const seconds = timestamp.seconds ?? timestamp._seconds
      if (typeof seconds === 'number') date = new Date(seconds * 1000)
    }
  }

  if (!date || Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">
        {value?.trim() || 'Not specified'}
      </p>
    </div>
  )
}

function PatientDoctorPrescriptionsPage() {
  usePageTitle('Doctor Prescriptions')
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedPrescription, setSelectedPrescription] =
    useState<DoctorPrescription | null>(null)

  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [clarificationText, setClarificationText] = useState('')
  const [actionLoading, setActionLoading] = useState<'accept' | 'clarification' | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [versions, setVersions] = useState<DoctorPrescriptionVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionsLoaded, setVersionsLoaded] = useState(false)
  const [versionsError, setVersionsError] = useState('')

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const result = await getPatientDoctorPrescriptions()
      setPrescriptions(result)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load doctor prescriptions.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPrescriptions()
  }, [loadPrescriptions])

  async function handleOpenPrescription(prescriptionId: string) {
    try {
      setDetailLoading(true)
      setDetailError('')
      setSelectedPrescription(null)

      const result = await getPatientDoctorPrescription(prescriptionId)
      setSelectedPrescription(result)
    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : 'Unable to load prescription details.'
      )
    } finally {
      setDetailLoading(false)
    }
  }

  async function refreshPrescription(prescriptionId: string) {
    const [updatedPrescription, updatedList] = await Promise.all([
      getPatientDoctorPrescription(prescriptionId),
      getPatientDoctorPrescriptions(),
    ])

    setSelectedPrescription(updatedPrescription)
    setPrescriptions(updatedList)
  }

  async function handleLoadVersionHistory() {
    if (!selectedPrescription) return

    try {
      setVersionsLoading(true)
      setVersionsError('')

      const result = await getPatientPrescriptionVersions(
        selectedPrescription.prescriptionId
      )

      setVersions(result)
      setVersionsLoaded(true)
    } catch (err) {
      setVersionsError(
        err instanceof Error
          ? err.message
          : 'Unable to load prescription version history.'
      )
    } finally {
      setVersionsLoading(false)
    }
  }

  async function handleAcceptPrescription() {
    if (!selectedPrescription) return

    try {
      setActionLoading('accept')
      setActionError('')
      setActionMessage('')

      await acceptPatientDoctorPrescription(selectedPrescription.prescriptionId)
      await refreshPrescription(selectedPrescription.prescriptionId)

      setActionMessage('Prescription acknowledgement recorded successfully.')
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to accept this prescription.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  async function handleClarificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedPrescription) return

    const message = clarificationText.trim()

    if (message.length < 5 || message.length > 1000) {
      setActionError('Your question must contain between 5 and 1000 characters.')
      return
    }

    try {
      setActionLoading('clarification')
      setActionError('')
      setActionMessage('')

      await requestPrescriptionClarification(
        selectedPrescription.prescriptionId,
        message
      )

      setClarificationText('')
      await refreshPrescription(selectedPrescription.prescriptionId)
      setActionMessage('Your clarification request has been sent to the doctor.')
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Unable to submit your clarification request.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  function handleBackToList() {
    setSelectedPrescription(null)
    setDetailError('')
    setActionMessage('')
    setActionError('')
    setClarificationText('')
    setVersions([])
    setVersionsLoaded(false)
    setVersionsError('')
  }

  if (selectedPrescription) {
    const prescription = selectedPrescription
    const status = statusConfig[prescription.status]
    const StatusIcon = status.icon

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to prescriptions
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-600">
                <Stethoscope size={20} />
                <span className="text-sm font-medium">
                  Doctor-issued prescription
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900">
                {prescription.diagnosis}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Prescription details and instructions from your doctor.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${status.className}`}
            >
              <StatusIcon size={15} />
              {status.label}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              label="Prescribing doctor"
              value={`Dr. ${prescription.doctorName}`}
            />

            <DetailItem
              label="Hospital / Clinic"
              value={prescription.hospitalName}
            />

            <DetailItem
              label="Prescription date"
              value={formatDate(prescription.prescriptionDate)}
            />

            <DetailItem
              label="Follow-up date"
              value={
                prescription.followUpDate
                  ? formatDate(prescription.followUpDate)
                  : null
              }
            />
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Pill size={21} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Prescribed medicines
              </h2>
              <p className="text-sm text-slate-500">
                {prescription.medicines.length} medicines prescribed
              </p>
            </div>
          </div>

          {prescription.medicines.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No medicine details are available.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {prescription.medicines.map((medicine, index) => {
                const details = medicine.prescriptionDetails

                return (
                  <div
                    key={`${prescription.prescriptionId}-${index}`}
                    className="rounded-xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                        {index + 1}
                      </div>

                      <h3 className="font-semibold text-slate-900">
                        {medicine.name}
                      </h3>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <DetailItem
                        label="Strength"
                        value={details.strength}
                      />

                      <DetailItem
                        label="Dosage"
                        value={details.dosage}
                      />

                      <DetailItem
                        label="Route"
                        value={details.route}
                      />

                      <DetailItem
                        label="Frequency"
                        value={details.frequency}
                      />

                      <DetailItem
                        label="Duration"
                        value={details.duration}
                      />
                    </div>

                    {details.instructions && (
                      <div className="mt-5 rounded-lg bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Medicine instructions
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                          {details.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {prescription.additionalInstructions.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Additional instructions
              </h2>
            </div>

            <ul className="mt-4 space-y-3">
              {prescription.additionalInstructions.map(
                (instruction, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    {instruction}
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                <History size={21} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Prescription version history
                </h2>
                <p className="text-sm text-slate-500">
                  Review previous versions and the doctor's amendment reasons.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleLoadVersionHistory()}
              disabled={versionsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {versionsLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <History size={16} />
              )}
              {versionsLoaded ? 'Refresh history' : 'View version history'}
            </button>
          </div>

          {versionsError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {versionsError}
            </div>
          )}

          {versionsLoaded && (
            versions.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No version history is available for this prescription.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {versions.map((version, index) => {
                  const snapshot = version.prescriptionData
                  const isLatest = index === 0

                  return (
                    <article
                      key={version.versionId}
                      className="rounded-xl border border-slate-200 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            Version {version.versionNumber}
                          </h3>
                          {isLatest && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Latest version
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(version.createdAt)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-800">
                        {snapshot.diagnosis}
                      </p>

                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Doctor's amendment reason
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {version.changeReason?.trim() || 'Initial prescription'}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Medicines in this version
                        </p>
                        {snapshot.medicines.length > 0 ? (
                          <ul className="mt-2 space-y-2">
                            {snapshot.medicines.map((medicine, medicineIndex) => (
                              <li
                                key={`${version.versionId}-${medicineIndex}`}
                                className="rounded-lg bg-slate-50 px-3 py-2"
                              >
                                <p className="text-sm font-medium text-slate-800">
                                  {medicine.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {[
                                    medicine.prescriptionDetails.strength,
                                    medicine.prescriptionDetails.dosage,
                                    medicine.prescriptionDetails.frequency,
                                    medicine.prescriptionDetails.duration,
                                  ].filter(Boolean).join(' · ') || 'No further details recorded'}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            No medicine details recorded in this version.
                          </p>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          )}
        </section>

        {prescription.status === 'clarification_requested' && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900">
              Clarification conversation
            </h2>

            {prescription.clarificationRequest && (
              <div className="mt-4 rounded-xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Your question
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {prescription.clarificationRequest}
                </p>
              </div>
            )}

            {prescription.clarificationResponse ? (
              <div className="mt-3 rounded-xl border border-blue-100 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Doctor's response
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {prescription.clarificationResponse}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-blue-700">
                Waiting for your doctor to respond.
              </p>
            )}
          </section>
        )}

        {actionMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} />
              {actionMessage}
            </div>
          </div>
        )}

        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {prescription.status === 'pending_patient_review' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-slate-900">
              Review this prescription
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review the details above. You can acknowledge receipt or ask your
              doctor to clarify an instruction before proceeding.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleAcceptPrescription()}
                disabled={actionLoading !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === 'accept' ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Acknowledge prescription
              </button>
            </div>

            <form onSubmit={handleClarificationSubmit} className="mt-6 border-t border-slate-100 pt-5">
              <label
                htmlFor="prescription-clarification"
                className="block text-sm font-semibold text-slate-800"
              >
                Need clarification?
              </label>
              <p className="mt-1 text-sm text-slate-500">
                Send a question to the prescribing doctor. Do not change or stop
                medication based only on an assumption.
              </p>

              <textarea
                id="prescription-clarification"
                value={clarificationText}
                onChange={(event) => setClarificationText(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Describe what you would like your doctor to clarify..."
                disabled={actionLoading !== null}
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className={`text-xs ${clarificationText.trim().length > 1000 ? 'text-red-600' : 'text-slate-400'}`}>
                  {clarificationText.trim().length}/1000 characters (minimum 5)
                </span>

                <button
                  type="submit"
                  disabled={
                    actionLoading !== null ||
                    clarificationText.trim().length < 5 ||
                    clarificationText.trim().length > 1000
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading === 'clarification' ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send clarification request
                </button>
              </div>
            </form>
          </section>
        )}

        {prescription.status === 'accepted' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-emerald-800">
              <CheckCircle2 size={18} />
              You have acknowledged receipt of this prescription.
            </div>
            <p className="mt-2 text-sm text-emerald-700">
              This acknowledgement records that you have received the
              prescription. It does not replace a discussion with your doctor
              about any medical concerns.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Please follow your doctor's guidance. If any instruction is unclear,
            contact your doctor or pharmacist before making changes to your
            medication.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Stethoscope size={22} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Doctor Prescriptions
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            View prescriptions issued by your doctors and review their instructions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPrescriptions()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total prescriptions</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {prescriptions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
            <p className="text-sm text-amber-700">Awaiting review</p>
            <p className="mt-2 text-2xl font-bold text-amber-800">
              {prescriptions.filter(
                (item) => item.status === 'pending_patient_review'
              ).length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
            <p className="text-sm text-emerald-700">Accepted</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">
              {prescriptions.filter(
                (item) => item.status === 'accepted'
              ).length}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            Loading your prescriptions...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold text-red-800">
                Unable to load prescriptions
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => void loadPrescriptions()}
                className="mt-3 text-sm font-semibold text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {detailError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {detailError}
        </div>
      )}

      {detailLoading && (
        <div className="flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
          <Loader2 size={22} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">
            Loading prescription details...
          </p>
        </div>
      )}

      {!loading && !error && prescriptions.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
            <FileText size={30} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No doctor prescriptions yet
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            Prescriptions issued by your doctors will appear here when they are
            shared with your account.
          </p>
        </div>
      )}

      {!loading && !error && prescriptions.length > 0 && (
        <div className="space-y-4">
          {prescriptions.map((prescription) => {
            const status = statusConfig[prescription.status]
            const StatusIcon = status.icon

            return (
              <div
                key={prescription.prescriptionId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {prescription.diagnosis}
                      </h2>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon size={13} />
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Stethoscope size={15} />
                        Dr. {prescription.doctorName}
                      </span>

                      {prescription.hospitalName && (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 size={15} />
                          {prescription.hospitalName}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {formatDate(prescription.prescriptionDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <Pill size={16} />
                    {prescription.medicines.length}{' '}
                    {prescription.medicines.length === 1
                      ? 'medicine'
                      : 'medicines'}
                  </div>
                </div>

                {prescription.medicines.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Prescribed medicines
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {prescription.medicines.map((medicine, index) => (
                        <span
                          key={`${prescription.prescriptionId}-${index}`}
                          className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        >
                          {medicine.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {prescription.followUpDate && (
                  <p className="mt-4 text-sm text-slate-500">
                    Follow-up: {formatDate(prescription.followUpDate)}
                  </p>
                )}

                <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      void handleOpenPrescription(prescription.prescriptionId)
                    }
                    disabled={detailLoading}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    View prescription
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PatientDoctorPrescriptionsPage
