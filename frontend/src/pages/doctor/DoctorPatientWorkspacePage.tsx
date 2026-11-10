
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  UserRound,
  ClipboardList,
  FileText,
  Pill,
  PlusCircle,
  ShieldCheck,
  LoaderCircle,
  AlertCircle,
  CalendarDays,
  Stethoscope,
  Download,
} from 'lucide-react'
import {
  getDoctorPatientProfile,
  getDoctorPatientMedicalHistory,
  getDoctorPatientDocuments,
  getDoctorPatientDocumentDownloadUrl,
  getDoctorPatientPrescriptions,
  createDoctorPrescription,
  type CreateDoctorPrescriptionInput,
  type DoctorPrescriptionMedicine,
  type DoctorPatientProfile,
  type DoctorPatientMedicalRecord,
  type DoctorPatientDocument,
  type DoctorPatientPrescription,
} from '../../services/doctorPatientService'

type WorkspaceTab =
  | 'overview'
  | 'history'
  | 'documents'
  | 'prescriptions'
  | 'write-prescription'

const tabs: {
  id: WorkspaceTab
  label: string
  icon: typeof UserRound
}[] = [
  { id: 'overview', label: 'Overview', icon: UserRound },
  { id: 'history', label: 'Medical History', icon: ClipboardList },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  {
    id: 'write-prescription',
    label: 'Write Prescription',
    icon: PlusCircle,
  },
]

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  return String(value)
}

function displayList(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return 'None recorded'
  }

  return value.map(String).join(', ')
}

function ProfileField({
  label,
  value,
}: {
  label: string
  value: unknown
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {displayValue(value)}
      </p>
    </div>
  )
}

function ProfileListField({
  label,
  value,
}: {
  label: string
  value: unknown
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-slate-700">
        {displayList(value)}
      </p>
    </div>
  )
}

function PatientOverview({
  profile,
}: {
  profile: DoctorPatientProfile
}) {
  return (
    <div className="mt-8 space-y-8">
      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Personal Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField label="Full Name" value={profile.name} />
          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Phone" value={profile.phone} />
          <ProfileField label="Date of Birth" value={profile.dateOfBirth} />
          <ProfileField label="Gender" value={profile.gender} />
          <ProfileField label="Blood Group" value={profile.bloodGroup} />
          <ProfileField label="Height" value={profile.height} />
          <ProfileField label="Weight" value={profile.weight} />
          <ProfileField label="Address" value={profile.address} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Health Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileListField label="Allergies" value={profile.allergies} />
          <ProfileListField
            label="Chronic Conditions"
            value={profile.chronicConditions}
          />
          <ProfileListField
            label="Current Medicines"
            value={profile.currentMedicines}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
          Additional Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField
            label="Emergency Contact Name"
            value={profile.emergencyContactName}
          />
          <ProfileField
            label="Emergency Contact Phone"
            value={profile.emergencyContactPhone}
          />
          <ProfileField
            label="Insurance Provider"
            value={profile.insuranceProvider}
          />
          <ProfileField
            label="Insurance Policy Number"
            value={profile.insurancePolicyNumber}
          />
          <ProfileField
            label="Organ Donor"
            value={
              typeof profile.organDonor === 'boolean'
                ? profile.organDonor
                  ? 'Yes'
                  : 'No'
                : 'Not provided'
            }
          />
        </div>
      </div>
    </div>
  )
}

function MedicalHistorySection({
  records,
}: {
  records: DoctorPatientMedicalRecord[]
}) {
  if (records.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
        <ClipboardList
          size={32}
          className="mx-auto text-slate-400"
        />
        <h3 className="mt-3 font-semibold text-slate-700">
          No medical history found
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          No medical history records have been added by this patient yet.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Medical Records
        </h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {records.length} {records.length === 1 ? 'Record' : 'Records'}
        </span>
      </div>

      {records.map((record, index) => (
        <article
          key={
            typeof record.id === 'string'
              ? record.id
              : `record-${index}`
          }
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Stethoscope size={21} />
              </div>

              <div>
                <h4 className="font-bold text-slate-900">
                  {displayValue(record.title)}
                </h4>
                <p className="mt-1 text-xs font-medium capitalize text-blue-600">
                  {displayValue(record.type)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays size={15} />
              {displayValue(record.date)}
            </div>
          </div>

          {typeof record.description === 'string' &&
            record.description && (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {record.description}
              </p>
            )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {typeof record.diagnosis === 'string' &&
              record.diagnosis && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Diagnosis
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {record.diagnosis}
                  </p>
                </div>
              )}

            {typeof record.doctor === 'string' && record.doctor && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Doctor
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {record.doctor}
                </p>
              </div>
            )}

            {typeof record.hospital === 'string' &&
              record.hospital && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Hospital
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {record.hospital}
                  </p>
                </div>
              )}

            {Array.isArray(record.medicines) &&
              record.medicines.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Medicines
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {displayList(record.medicines)}
                  </p>
                </div>
              )}

            {typeof record.notes === 'string' && record.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notes
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {record.notes}
                </p>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function DoctorPatientWorkspacePage() {
  const { patientId } = useParams<{ patientId: string }>()

  const [activeTab, setActiveTab] =
    useState<WorkspaceTab>('overview')

  const [profile, setProfile] =
    useState<DoctorPatientProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [history, setHistory] =
    useState<DoctorPatientMedicalRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const [documents, setDocuments] = useState<DoctorPatientDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [documentsLoaded, setDocumentsLoaded] = useState(false)
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null)

  const [prescriptions, setPrescriptions] = useState<DoctorPatientPrescription[]>([])
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false)
  const [prescriptionsError, setPrescriptionsError] = useState<string | null>(null)
  const [prescriptionsLoaded, setPrescriptionsLoaded] = useState(false)

  const [diagnosis, setDiagnosis] = useState('')
  const [prescriptionDate, setPrescriptionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [followUpDate, setFollowUpDate] = useState('')
  const [medicines, setMedicines] = useState<DoctorPrescriptionMedicine[]>([
    {
      name: '',
      prescriptionDetails: {
        strength: '',
        dosage: '',
        route: '',
        frequency: '',
        duration: '',
        instructions: '',
      },
    },
  ])
  const [additionalInstructionsText, setAdditionalInstructionsText] = useState('')
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false)
  const [prescriptionSubmitError, setPrescriptionSubmitError] = useState<string | null>(null)
  const [prescriptionSubmitSuccess, setPrescriptionSubmitSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) {
      setProfileLoading(false)
      return
    }

    let cancelled = false

    const loadProfile = async () => {
      setProfileLoading(true)
      setProfileError(null)
      setProfile(null)

      try {
        const data = await getDoctorPatientProfile(patientId)

        if (!cancelled) {
          setProfile(data)
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(
            error instanceof Error
              ? error.message
              : 'Unable to load patient profile.',
          )
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [patientId])

  useEffect(() => {
    if (
      !patientId ||
      activeTab !== 'history' ||
      historyLoaded
    ) {
      return
    }

    let cancelled = false

    const loadHistory = async () => {
      setHistoryLoading(true)
      setHistoryError(null)

      try {
        const records =
          await getDoctorPatientMedicalHistory(patientId)

        if (!cancelled) {
          setHistory(records)
          setHistoryLoaded(true)
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : 'Unable to load medical history.',
          )
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [patientId, activeTab, historyLoaded])

  useEffect(() => {
    if (!patientId || activeTab !== 'documents' || documentsLoaded) {
      return
    }

    let cancelled = false

    const loadDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)

      try {
        const data = await getDoctorPatientDocuments(patientId)
        if (!cancelled) {
          setDocuments(data)
          setDocumentsLoaded(true)
        }
      } catch (error) {
        if (!cancelled) {
          setDocumentsError(
            error instanceof Error ? error.message : 'Unable to load patient documents.'
          )
        }
      } finally {
        if (!cancelled) {
          setDocumentsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [patientId, activeTab, documentsLoaded])

  const handleDocumentDownload = async (document: DoctorPatientDocument) => {
    if (!patientId || downloadingDocumentId) return

    setDownloadingDocumentId(document.id)

    try {
      const downloadUrl = await getDoctorPatientDocumentDownloadUrl(
        patientId,
        document.id
      )
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setDocumentsError(
        error instanceof Error ? error.message : 'Unable to download this document.'
      )
    } finally {
      setDownloadingDocumentId(null)
    }
  }


  useEffect(() => {
    if (!patientId || activeTab !== 'prescriptions' || prescriptionsLoaded) {
      return
    }

    let cancelled = false

    const loadPrescriptions = async () => {
      setPrescriptionsLoading(true)
      setPrescriptionsError(null)

      try {
        const data = await getDoctorPatientPrescriptions(patientId)
        if (!cancelled) {
          setPrescriptions(data)
          setPrescriptionsLoaded(true)
        }
      } catch (error) {
        if (!cancelled) {
          setPrescriptionsError(
            error instanceof Error
              ? error.message
              : 'Unable to load patient prescriptions.'
          )
        }
      } finally {
        if (!cancelled) {
          setPrescriptionsLoading(false)
        }
      }
    }

    void loadPrescriptions()

    return () => {
      cancelled = true
    }
  }, [patientId, activeTab, prescriptionsLoaded])


  const updateMedicine = (
    index: number,
    field: 'name' | keyof DoctorPrescriptionMedicine['prescriptionDetails'],
    value: string
  ) => {
    setMedicines((current) =>
      current.map((medicine, medicineIndex) => {
        if (medicineIndex !== index) return medicine

        if (field === 'name') {
          return { ...medicine, name: value }
        }

        return {
          ...medicine,
          prescriptionDetails: {
            ...medicine.prescriptionDetails,
            [field]: value,
          },
        }
      })
    )
  }

  const addMedicine = () => {
    setMedicines((current) => [
      ...current,
      {
        name: '',
        prescriptionDetails: {
          strength: '',
          dosage: '',
          route: '',
          frequency: '',
          duration: '',
          instructions: '',
        },
      },
    ])
  }

  const removeMedicine = (index: number) => {
    setMedicines((current) =>
      current.length > 1
        ? current.filter((_, medicineIndex) => medicineIndex !== index)
        : current
    )
  }

  const handleCreatePrescription = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    if (!patientId || prescriptionSubmitting) return

    setPrescriptionSubmitError(null)
    setPrescriptionSubmitSuccess(null)

    const validMedicines = medicines.filter((medicine) =>
      medicine.name.trim() &&
      Object.values(medicine.prescriptionDetails).some(
        (value) => typeof value === 'string' && value.trim()
      )
    )

    if (!diagnosis.trim()) {
      setPrescriptionSubmitError('Please enter a diagnosis.')
      return
    }

    if (validMedicines.length === 0) {
      setPrescriptionSubmitError('Add at least one medicine with its details.')
      return
    }

    setPrescriptionSubmitting(true)

    const input: CreateDoctorPrescriptionInput = {
      diagnosis: diagnosis.trim(),
      prescriptionDate,
      followUpDate: followUpDate || null,
      medicines: validMedicines.map((medicine) => ({
        name: medicine.name.trim(),
        prescriptionDetails: {
          strength: medicine.prescriptionDetails.strength?.trim() || null,
          dosage: medicine.prescriptionDetails.dosage?.trim() || null,
          route: medicine.prescriptionDetails.route?.trim() || null,
          frequency: medicine.prescriptionDetails.frequency?.trim() || null,
          duration: medicine.prescriptionDetails.duration?.trim() || null,
          instructions: medicine.prescriptionDetails.instructions?.trim() || null,
        },
      })),
      additionalInstructions: additionalInstructionsText
        .split('\n')
        .map((instruction) => instruction.trim())
        .filter(Boolean),
    }

    try {
      const prescriptionId = await createDoctorPrescription(patientId, input)
      setPrescriptionSubmitSuccess(
        `Prescription created successfully. ID: ${prescriptionId}. It is now awaiting patient review.`
      )
      setDiagnosis('')
      setFollowUpDate('')
      setMedicines([{
        name: '',
        prescriptionDetails: {
          strength: '',
          dosage: '',
          route: '',
          frequency: '',
          duration: '',
          instructions: '',
        },
      }])
      setAdditionalInstructionsText('')
      setPrescriptionsLoaded(false)
    } catch (error) {
      setPrescriptionSubmitError(
        error instanceof Error
          ? error.message
          : 'Unable to create prescription.'
      )
    } finally {
      setPrescriptionSubmitting(false)
    }
  }

  if (!patientId) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            Patient not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            A valid patient ID is required to open this workspace.
          </p>
          <Link
            to="/doctor/my-patients"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to My Patients
          </Link>
        </div>
      </main>
    )
  }

  const activeTabDetails = tabs.find(
    (tab) => tab.id === activeTab,
  )

  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/doctor/my-patients"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Back to My Patients
        </Link>

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserRound size={29} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Patient Workspace
                </p>
                <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                  {profile?.name || 'Patient Record'}
                </h1>
                <p className="mt-1 break-all text-xs text-slate-500">
                  Patient ID: {patientId}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={15} />
              Consent-based access
            </span>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            {activeTabDetails && (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <activeTabDetails.icon size={22} />
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeTabDetails?.label}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Patient workspace section
              </p>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <>
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-blue-600"
                  />
                  <p className="mt-3 text-sm">
                    Loading patient profile...
                  </p>
                </div>
              ) : profileError ? (
                <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={21}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />
                    <div>
                      <h3 className="font-semibold text-amber-900">
                        Unable to access patient profile
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        {profileError}
                      </p>
                      <p className="mt-2 text-xs text-amber-700">
                        Check whether the patient has granted you the
                        profile permission.
                      </p>
                    </div>
                  </div>
                </div>
              ) : profile ? (
                <PatientOverview profile={profile} />
              ) : (
                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-12 text-center">
                  <p className="text-sm text-slate-500">
                    No patient profile is available.
                  </p>
                </div>
              )}
            </>
          ) : activeTab === 'history' ? (
            <>
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <LoaderCircle
                    size={28}
                    className="animate-spin text-blue-600"
                  />
                  <p className="mt-3 text-sm">
                    Loading medical history...
                  </p>
                </div>
              ) : historyError ? (
                <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={21}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />
                    <div>
                      <h3 className="font-semibold text-amber-900">
                        Unable to access medical history
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        {historyError}
                      </p>
                      <p className="mt-2 text-xs text-amber-700">
                        Check whether the patient has granted you the
                        medical history permission.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHistoryLoaded(false)
                      setHistoryError(null)
                    }}
                    className="mt-4 rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <MedicalHistorySection records={history} />
              )}
            </>
          ) : activeTab === 'documents' ? (
            <>
              {documentsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <LoaderCircle size={28} className="animate-spin text-blue-600" />
                  <p className="mt-3 text-sm">Loading patient documents...</p>
                </div>
              ) : documentsError ? (
                <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={21} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <h3 className="font-semibold text-amber-900">Unable to access patient documents</h3>
                      <p className="mt-1 text-sm leading-6 text-amber-800">{documentsError}</p>
                      <p className="mt-2 text-xs text-amber-700">
                        Check whether the patient has granted you the documents permission.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentsLoaded(false)
                      setDocumentsError(null)
                    }}
                    className="mt-4 rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
                  >
                    Try again
                  </button>
                </div>
              ) : documents.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <FileText size={32} className="mx-auto text-slate-400" />
                  <h3 className="mt-3 font-semibold text-slate-700">No documents found</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    No documents have been uploaded by this patient yet.
                  </p>
                </div>
              ) : (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Patient Documents
                    </h3>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
                    </span>
                  </div>
                  {documents.map((document) => (
                    <article
                      key={document.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FileText size={21} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="break-words font-semibold text-slate-900">
                            {document.originalName}
                          </h4>
                          <p className="mt-1 text-xs capitalize text-blue-600">
                            {document.category || 'Uncategorized'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>{document.mimeType}</span>
                            <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                            <span>
                              Uploaded: {document.uploadedAt
                                ? new Date(document.uploadedAt).toLocaleDateString()
                                : 'Date unavailable'}
                            </span>
                            {document.documentDate && (
                              <span>
                                Document date: {new Date(document.documentDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {(document.doctor || document.hospital) && (
                            <p className="mt-2 text-xs text-slate-500">
                              {[document.doctor, document.hospital].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDocumentDownload(document)}
                        disabled={downloadingDocumentId !== null}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingDocumentId === document.id ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                        {downloadingDocumentId === document.id ? 'Preparing...' : 'Download'}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'prescriptions' ? (
            <>
              {prescriptionsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <LoaderCircle size={28} className="animate-spin text-blue-600" />
                  <p className="mt-3 text-sm">Loading patient prescriptions...</p>
                </div>
              ) : prescriptionsError ? (
                <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={21} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <h3 className="font-semibold text-amber-900">Unable to access patient prescriptions</h3>
                      <p className="mt-1 text-sm leading-6 text-amber-800">{prescriptionsError}</p>
                      <p className="mt-2 text-xs text-amber-700">
                        Check whether the patient has granted you the prescriptions permission.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrescriptionsLoaded(false)
                      setPrescriptionsError(null)
                    }}
                    className="mt-4 rounded-lg bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
                  >
                    Try again
                  </button>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <Pill size={32} className="mx-auto text-slate-400" />
                  <h3 className="mt-3 font-semibold text-slate-700">No prescriptions found</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    No doctor-issued prescriptions are available for this patient.
                  </p>
                </div>
              ) : (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Doctor-issued Prescriptions
                    </h3>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {prescriptions.length} {prescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}
                    </span>
                  </div>
                  {prescriptions.map((prescription) => (
                    <article
                      key={prescription.prescriptionId}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{prescription.diagnosis}</h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Prescribed by {prescription.doctorName}
                            {prescription.hospitalName ? ` · ${prescription.hospitalName}` : ''}
                          </p>
                        </div>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          prescription.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700'
                            : prescription.status === 'clarification_requested'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                        }`}>
                          {prescription.status.replaceAll('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span>
                          Prescription date: {prescription.prescriptionDate
                            ? new Date(prescription.prescriptionDate).toLocaleDateString()
                            : 'Not provided'}
                        </span>
                        {prescription.followUpDate && (
                          <span>
                            Follow-up: {new Date(prescription.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="mt-5">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Medicines</h5>
                        <div className="mt-2 space-y-3">
                          {prescription.medicines.map((medicine, index) => (
                            <div
                              key={`${prescription.prescriptionId}-medicine-${index}`}
                              className="rounded-xl bg-slate-50 p-4"
                            >
                              <p className="text-sm font-semibold text-slate-800">{medicine.name}</p>
                              <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                                {medicine.prescriptionDetails.strength && <p>Strength: {medicine.prescriptionDetails.strength}</p>}
                                {medicine.prescriptionDetails.dosage && <p>Dosage: {medicine.prescriptionDetails.dosage}</p>}
                                {medicine.prescriptionDetails.route && <p>Route: {medicine.prescriptionDetails.route}</p>}
                                {medicine.prescriptionDetails.frequency && <p>Frequency: {medicine.prescriptionDetails.frequency}</p>}
                                {medicine.prescriptionDetails.duration && <p>Duration: {medicine.prescriptionDetails.duration}</p>}
                                {medicine.prescriptionDetails.instructions && (
                                  <p className="sm:col-span-2 lg:col-span-3">
                                    Instructions: {medicine.prescriptionDetails.instructions}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.additionalInstructions.length > 0 && (
                        <div className="mt-5">
                          <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Additional Instructions
                          </h5>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                            {prescription.additionalInstructions.map((instruction, index) => (
                              <li key={`${prescription.prescriptionId}-instruction-${index}`}>
                                {instruction}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'write-prescription' ? (
            <form onSubmit={handleCreatePrescription} className="mt-8 space-y-6">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                The prescription will be sent to the patient for review. The patient can accept it or request clarification.
              </div>

              {prescriptionSubmitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {prescriptionSubmitError}
                </div>
              )}
              {prescriptionSubmitSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {prescriptionSubmitSuccess}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Diagnosis *</span>
                  <textarea
                    value={diagnosis}
                    onChange={(event) => setDiagnosis(event.target.value)}
                    required
                    rows={3}
                    maxLength={2000}
                    placeholder="Enter the diagnosis"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Prescription date *</span>
                  <input
                    type="date"
                    value={prescriptionDate}
                    onChange={(event) => setPrescriptionDate(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Follow-up date</span>
                  <input
                    type="date"
                    value={followUpDate}
                    min={prescriptionDate}
                    onChange={(event) => setFollowUpDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Medicines</h3>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <PlusCircle size={16} /> Add medicine
                  </button>
                </div>

                {medicines.map((medicine, index) => (
                  <section
                    key={`medicine-form-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-semibold text-slate-800">Medicine {index + 1}</h4>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicine(index)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="sm:col-span-2 lg:col-span-3">
                        <span className="mb-2 block text-xs font-semibold text-slate-600">Medicine name *</span>
                        <input
                          value={medicine.name}
                          onChange={(event) => updateMedicine(index, 'name', event.target.value)}
                          required
                          maxLength={200}
                          placeholder="Medicine name"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        />
                      </label>
                      {([
                        ['strength', 'Strength', 'e.g. 500 mg'],
                        ['dosage', 'Dosage', 'e.g. 1 tablet'],
                        ['route', 'Route', 'e.g. Oral'],
                        ['frequency', 'Frequency', 'e.g. Twice daily'],
                        ['duration', 'Duration', 'e.g. 5 days'],
                        ['instructions', 'Medicine instructions', 'Additional instructions'],
                      ] as const).map(([field, label, placeholder]) => (
                        <label key={field}>
                          <span className="mb-2 block text-xs font-semibold text-slate-600">{label}</span>
                          <input
                            value={medicine.prescriptionDetails[field] ?? ''}
                            onChange={(event) => updateMedicine(index, field, event.target.value)}
                            maxLength={500}
                            placeholder={placeholder}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Additional instructions</span>
                <textarea
                  value={additionalInstructionsText}
                  onChange={(event) => setAdditionalInstructionsText(event.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Enter additional instructions, one per line"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <span className="mt-1 block text-xs text-slate-400">Each line will be saved as a separate instruction.</span>
              </label>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={prescriptionSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prescriptionSubmitting && <LoaderCircle size={17} className="animate-spin" />}
                  {prescriptionSubmitting ? 'Creating prescription...' : 'Create prescription'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <p className="font-semibold text-slate-700">
                {activeTabDetails?.label}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This section will display information according to the
                permissions granted by the patient.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default DoctorPatientWorkspacePage
