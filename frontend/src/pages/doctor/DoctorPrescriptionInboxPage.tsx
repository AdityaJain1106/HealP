import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileClock,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  ArrowLeft,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import { ROUTES } from '../../routes/routePaths'

import {
  amendDoctorPrescription,
  explainDoctorPrescription,
  getDoctorPrescriptionInbox,
  getDoctorPrescriptionVersions,
} from '../../services/doctorPrescriptionService'

import type {
  AmendDoctorPrescriptionInput,
} from '../../services/doctorPrescriptionService'

import type {
  DoctorPrescription,
  DoctorPrescriptionMedicine,
  DoctorPrescriptionVersion,
  PrescriptionDetails,
} from '../../services/patientPrescriptionService'
import { usePageTitle } from '../../hooks/usePageTitle'

interface AmendDraft {
  diagnosis: string
  hospitalName: string
  prescriptionDate: string
  followUpDate: string
  medicines: DoctorPrescriptionMedicine[]
  additionalInstructions: string
  changeReason: string
}

const emptyMedicine: DoctorPrescriptionMedicine = {
  name: '',
  prescriptionDetails: {
    strength: '',
    dosage: '',
    route: '',
    frequency: '',
    duration: '',
    instructions: '',
  },
}

function createDraft(prescription: DoctorPrescription): AmendDraft {
  return {
    diagnosis: prescription.diagnosis,
    hospitalName: prescription.hospitalName ?? '',
    prescriptionDate: prescription.prescriptionDate,
    followUpDate: prescription.followUpDate ?? '',
    medicines: prescription.medicines.map((medicine) => ({
      name: medicine.name,
      prescriptionDetails: {
        strength: medicine.prescriptionDetails.strength ?? '',
        dosage: medicine.prescriptionDetails.dosage ?? '',
        route: medicine.prescriptionDetails.route ?? '',
        frequency: medicine.prescriptionDetails.frequency ?? '',
        duration: medicine.prescriptionDetails.duration ?? '',
        instructions: medicine.prescriptionDetails.instructions ?? '',
      },
    })),
    additionalInstructions: prescription.additionalInstructions.join('\n'),
    changeReason: '',
  }
}

const detailFields: {
  key: keyof PrescriptionDetails
  label: string
  placeholder: string
}[] = [
    { key: 'strength', label: 'Strength', placeholder: 'e.g. 500 mg' },
    { key: 'dosage', label: 'Dosage', placeholder: 'e.g. 1 tablet' },
    { key: 'route', label: 'Route', placeholder: 'e.g. Oral' },
    { key: 'frequency', label: 'Frequency', placeholder: 'e.g. Twice daily' },
    { key: 'duration', label: 'Duration', placeholder: 'e.g. 5 days' },
    {
      key: 'instructions',
      label: 'Medicine instructions',
      placeholder: 'Additional instructions',
    },
  ]

export default function DoctorPrescriptionInboxPage() {
  usePageTitle('Prescription Inbox')
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({})
  const [versions, setVersions] = useState<
    Record<string, DoctorPrescriptionVersion[]>
  >({})
  const [versionsLoading, setVersionsLoading] = useState<Record<string, boolean>>({})
  const [versionsError, setVersionsError] = useState<Record<string, string>>({})

  const [editingId, setEditingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, AmendDraft>>({})

  const loadInbox = useCallback(async () => {
    try {
      setRefreshing(true)
      setError('')

      const data = await getDoctorPrescriptionInbox()
      setPrescriptions(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load prescription requests.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadInbox()
  }, [loadInbox])

  const handleExplanation = async (prescription: DoctorPrescription) => {
    const id = prescription.prescriptionId
    const explanation = explanations[id]?.trim() ?? ''

    if (explanation.length < 5 || explanation.length > 2000) {
      setError('Explanation must contain 5–2000 characters.')
      return
    }

    try {
      setSubmittingId(id)
      setError('')
      setSuccess('')

      await explainDoctorPrescription(
        prescription.patientId,
        id,
        explanation
      )

      setExplanations((previous) => ({
        ...previous,
        [id]: '',
      }))

      setSuccess('Explanation sent successfully. The patient has been notified.')
      await loadInbox()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send the explanation.'
      )
    } finally {
      setSubmittingId(null)
    }
  }

  const toggleVersionHistory = async (prescription: DoctorPrescription) => {
    const id = prescription.prescriptionId
    const isExpanded = expandedVersions[id]

    setExpandedVersions((previous) => ({
      ...previous,
      [id]: !previous[id],
    }))

    if (isExpanded || versions[id]) return

    try {
      setVersionsLoading((previous) => ({
        ...previous,
        [id]: true,
      }))

      setVersionsError((previous) => ({
        ...previous,
        [id]: '',
      }))

      const data = await getDoctorPrescriptionVersions(
        prescription.patientId,
        id
      )

      setVersions((previous) => ({
        ...previous,
        [id]: data,
      }))
    } catch (err) {
      setVersionsError((previous) => ({
        ...previous,
        [id]:
          err instanceof Error
            ? err.message
            : 'Unable to load version history.',
      }))
    } finally {
      setVersionsLoading((previous) => ({
        ...previous,
        [id]: false,
      }))
    }
  }

  const startEditing = (prescription: DoctorPrescription) => {
  usePageTitle('Prescription Inbox')
    const id = prescription.prescriptionId

    setDrafts((previous) => ({
      ...previous,
      [id]: createDraft(prescription),
    }))

    setEditingId(id)
    setError('')
    setSuccess('')
  }

  const updateDraft = (
    id: string,
    changes: Partial<AmendDraft>
  ) => {
  usePageTitle('Prescription Inbox')
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        ...changes,
      },
    }))
  }

  const updateMedicine = (
    id: string,
    index: number,
    changes: Partial<DoctorPrescriptionMedicine>
  ) => {
  usePageTitle('Prescription Inbox')
    const draft = drafts[id]
    if (!draft) return

    const medicines = [...draft.medicines]

    medicines[index] = {
      ...medicines[index],
      ...changes,
    }

    updateDraft(id, { medicines })
  }

  const updateMedicineDetails = (
    id: string,
    index: number,
    key: keyof PrescriptionDetails,
    value: string
  ) => {
  usePageTitle('Prescription Inbox')
    const draft = drafts[id]
    if (!draft) return

    const medicine = draft.medicines[index]

    updateMedicine(id, index, {
      prescriptionDetails: {
        ...medicine.prescriptionDetails,
        [key]: value,
      },
    })
  }

  const handleAmendment = async (prescription: DoctorPrescription) => {
    const id = prescription.prescriptionId
    const draft = drafts[id]

    if (!draft) return

    if (!draft.changeReason.trim() || draft.changeReason.trim().length < 5) {
      setError('Please provide a change reason of at least 5 characters.')
      return
    }

    if (!draft.diagnosis.trim()) {
      setError('Diagnosis is required.')
      return
    }

    if (!draft.prescriptionDate) {
      setError('Prescription date is required.')
      return
    }

    if (draft.medicines.length === 0) {
      setError('At least one medicine is required.')
      return
    }

    if (
      draft.medicines.some(
        (medicine) =>
          !medicine.name.trim() ||
          !medicine.prescriptionDetails.dosage?.trim() ||
          !medicine.prescriptionDetails.frequency?.trim()
      )
    ) {
      setError(
        'Every medicine requires a name, dosage and frequency.'
      )
      return
    }

    const input: AmendDoctorPrescriptionInput = {
      diagnosis: draft.diagnosis.trim(),
      hospitalName: draft.hospitalName.trim() || null,
      prescriptionDate: draft.prescriptionDate,
      followUpDate: draft.followUpDate || null,
      medicines: draft.medicines,
      additionalInstructions: draft.additionalInstructions
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      changeReason: draft.changeReason.trim(),
    }

    try {
      setSubmittingId(id)
      setError('')
      setSuccess('')

      await amendDoctorPrescription(
        prescription.patientId,
        id,
        input
      )

      setEditingId(null)

      setVersions((previous) => {
        const updated = { ...previous }
        delete updated[id]
        return updated
      })

      setSuccess(
        'Prescription amended successfully. The updated version has been sent to the patient for review.'
      )

      await loadInbox()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to amend the prescription.'
      )
    } finally {
      setSubmittingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <Link
        to={ROUTES.DOCTOR_DASHBOARD}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Doctor Dashboard
      </Link>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Prescription Inbox
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review patient clarification requests and respond to prescription queries.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadInbox()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Request count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">
          Pending clarification requests
        </p>

        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          {prescriptions.length}
        </span>
      </div>

      {/* Empty state */}
      {prescriptions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            No pending clarification requests
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Patient clarification requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {prescriptions.map((prescription) => {
            const id = prescription.prescriptionId
            const isSubmitting = submittingId === id
            const draft = drafts[id]
            const isEditing = editingId === id

            return (
              <article
                key={id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="space-y-5 p-5">
                  {/* Prescription header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {prescription.diagnosis}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Patient ID: {prescription.patientId}
                      </p>

                      <p className="text-sm text-slate-500">
                        Doctor: {prescription.doctorName}
                      </p>

                      {prescription.hospitalName && (
                        <p className="text-sm text-slate-500">
                          Hospital: {prescription.hospitalName}
                        </p>
                      )}

                      <p className="text-sm text-slate-500">
                        Prescription date: {prescription.prescriptionDate}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                      Clarification requested
                    </span>
                  </div>

                  {/* Patient question */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <MessageSquare className="h-4 w-4" />
                      Patient's clarification
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
                      {prescription.clarificationRequest ||
                        'No clarification message provided.'}
                    </p>
                  </div>

                  {/* Current prescription */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Current prescription
                    </h3>

                    <div className="mt-3 space-y-2">
                      {prescription.medicines.map((medicine, index) => (
                        <div
                          key={`${id}-${index}`}
                          className="rounded-lg bg-slate-50 p-3"
                        >
                          <p className="font-medium text-slate-800">
                            {medicine.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {[
                              medicine.prescriptionDetails.strength,
                              medicine.prescriptionDetails.dosage,
                              medicine.prescriptionDetails.route,
                              medicine.prescriptionDetails.frequency,
                              medicine.prescriptionDetails.duration,
                            ]
                              .filter(Boolean)
                              .join(' • ') || 'No additional details'}
                          </p>

                          {medicine.prescriptionDetails.instructions && (
                            <p className="mt-1 text-sm text-slate-600">
                              {medicine.prescriptionDetails.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {prescription.additionalInstructions.length > 0 && (
                      <div className="mt-3 rounded-lg bg-blue-50 p-3">
                        <p className="text-sm font-semibold text-blue-900">
                          Additional instructions
                        </p>

                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                          {prescription.additionalInstructions.map(
                            (instruction, index) => (
                              <li key={index}>{instruction}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Version history */}
                  <div className="border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => void toggleVersionHistory(prescription)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <FileClock className="h-4 w-4 text-blue-600" />
                        Prescription version history
                      </span>

                      {expandedVersions[id] ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    {expandedVersions[id] && (
                      <div className="mt-4 space-y-3">
                        {versionsLoading[id] && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading version history...
                          </div>
                        )}

                        {versionsError[id] && (
                          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {versionsError[id]}

                            <button
                              type="button"
                              onClick={() => {
                                setVersions((previous) => {
                                  const updated = { ...previous }
                                  delete updated[id]
                                  return updated
                                })

                                void toggleVersionHistory(prescription)
                              }}
                              className="ml-2 font-semibold underline"
                            >
                              Retry
                            </button>
                          </div>
                        )}

                        {versions[id]?.map((version) => (
                          <VersionCard
                            key={version.versionId}
                            version={version}
                          />
                        ))}

                        {versions[id]?.length === 0 && (
                          <p className="text-sm text-slate-500">
                            No version history found.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Explain option */}
                  {!isEditing && (
                    <div className="border-t border-slate-100 pt-5">
                      <label
                        htmlFor={`explanation-${id}`}
                        className="mb-2 block text-sm font-semibold text-slate-800"
                      >
                        Send an explanation
                      </label>

                      <textarea
                        id={`explanation-${id}`}
                        rows={3}
                        maxLength={2000}
                        value={explanations[id] ?? ''}
                        onChange={(event) =>
                          setExplanations((previous) => ({
                            ...previous,
                            [id]: event.target.value,
                          }))
                        }
                        placeholder="Explain the prescription or clarify the patient's concern..."
                        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          {(explanations[id] ?? '').length}/2000 characters
                        </span>

                        <button
                          type="button"
                          disabled={
                            isSubmitting ||
                            (explanations[id] ?? '').trim().length < 5
                          }
                          onClick={() => void handleExplanation(prescription)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Send explanation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Amendment controls */}
                  {!isEditing && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Need to change the prescription?
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Create a new version for the patient to review.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => startEditing(prescription)}
                        className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                      >
                        Amend prescription
                      </button>
                    </div>
                  )}

                  {/* Amendment form */}
                  {isEditing && draft && (
                    <div className="space-y-5 border-t border-slate-200 pt-5">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Amend prescription
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Your changes will create a new version. The patient
                          must review the updated prescription.
                        </p>
                      </div>

                      {/* Diagnosis and dates */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Diagnosis *
                          </label>

                          <textarea
                            rows={2}
                            maxLength={1000}
                            value={draft.diagnosis}
                            onChange={(event) =>
                              updateDraft(id, {
                                diagnosis: event.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Hospital
                          </label>

                          <input
                            value={draft.hospitalName}
                            onChange={(event) =>
                              updateDraft(id, {
                                hospitalName: event.target.value,
                              })
                            }
                            maxLength={200}
                            className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Prescription date *
                          </label>

                          <input
                            type="date"
                            value={draft.prescriptionDate}
                            onChange={(event) =>
                              updateDraft(id, {
                                prescriptionDate: event.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Follow-up date
                          </label>

                          <input
                            type="date"
                            value={draft.followUpDate}
                            onChange={(event) =>
                              updateDraft(id, {
                                followUpDate: event.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Medicines */}
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-slate-800">
                            Medicines
                          </h4>

                          <button
                            type="button"
                            onClick={() =>
                              updateDraft(id, {
                                medicines: [
                                  ...draft.medicines,
                                  {
                                    ...emptyMedicine,
                                    prescriptionDetails: {
                                      ...emptyMedicine.prescriptionDetails,
                                    },
                                  },
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4" />
                            Add medicine
                          </button>
                        </div>

                        <div className="space-y-4">
                          {draft.medicines.map((medicine, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-slate-200 p-4"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-800">
                                  Medicine {index + 1}
                                </p>

                                <button
                                  type="button"
                                  disabled={draft.medicines.length === 1}
                                  onClick={() =>
                                    updateDraft(id, {
                                      medicines: draft.medicines.filter(
                                        (_, medicineIndex) =>
                                          medicineIndex !== index
                                      ),
                                    })
                                  }
                                  className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                                  title="Remove medicine"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mb-3">
                                <label className="mb-1 block text-xs font-medium text-slate-600">
                                  Medicine name *
                                </label>

                                <input
                                  value={medicine.name}
                                  maxLength={200}
                                  onChange={(event) =>
                                    updateMedicine(id, index, {
                                      name: event.target.value,
                                    })
                                  }
                                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                {detailFields.map((field) => (
                                  <div key={field.key}>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                      {field.label}
                                      {field.key === 'dosage' ||
                                        field.key === 'frequency'
                                        ? ' *'
                                        : ''}
                                    </label>

                                    <input
                                      value={
                                        medicine.prescriptionDetails[
                                        field.key
                                        ] ?? ''
                                      }
                                      placeholder={field.placeholder}
                                      onChange={(event) =>
                                        updateMedicineDetails(
                                          id,
                                          index,
                                          field.key,
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional instructions */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Additional instructions
                        </label>

                        <textarea
                          rows={3}
                          maxLength={5000}
                          value={draft.additionalInstructions}
                          onChange={(event) =>
                            updateDraft(id, {
                              additionalInstructions: event.target.value,
                            })
                          }
                          placeholder="Enter one instruction per line..."
                          className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                        />

                        <p className="mt-1 text-xs text-slate-400">
                          Each non-empty line will be saved as a separate instruction.
                        </p>
                      </div>

                      {/* Change reason */}
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Reason for amendment *
                        </label>

                        <textarea
                          rows={2}
                          minLength={5}
                          maxLength={500}
                          value={draft.changeReason}
                          onChange={(event) =>
                            updateDraft(id, {
                              changeReason: event.target.value,
                            })
                          }
                          placeholder="Explain why this prescription is being changed..."
                          className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
                        />

                        <p className="mt-1 text-xs text-slate-400">
                          {draft.changeReason.length}/500 characters (minimum 5)
                        </p>
                      </div>

                      {/* Form actions */}
                      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => void handleAmendment(prescription)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Save new version
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VersionCard({
  version,
}: {
  version: DoctorPrescriptionVersion
}) {
  const data = version.prescriptionData

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-800">
          Version {version.versionNumber}
        </p>

        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {version.versionNumber === 1
            ? 'Original prescription'
            : 'Amended prescription'}
        </span>
      </div>

      <p className="mt-2 text-sm font-medium text-slate-700">
        {data.diagnosis}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Prescription date: {data.prescriptionDate}
      </p>

      <div className="mt-3 space-y-2">
        {data.medicines.map((medicine, index) => (
          <div
            key={`${version.versionId}-${index}`}
            className="rounded-lg bg-white p-3"
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
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>
        ))}
      </div>

      {version.changeReason && (
        <div className="mt-3 rounded-lg bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-900">
            Reason for change
          </p>

          <p className="mt-1 text-sm text-blue-800">
            {version.changeReason}
          </p>
        </div>
      )}
    </div>
  )
}
