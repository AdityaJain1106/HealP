
import { adminDb } from '../config/firebaseAdmin.js'

interface MedicalSummaryContext {
  profile: {
    bloodGroup: string | null
    height: string | null
    weight: string | null
    allergies: string[]
    chronicConditions: string[]
    currentMedicines: string[]
  }
  medicalHistory: Array<{
    type: string
    title: string
    description: string
    date: string
    hospital: string | null
    doctor: string | null
    diagnosis: string | null
    medicines: string[]
    notes: string | null
  }>
  prescriptions: Array<{
    prescriptionDate: string | null
    prescriberName: string | null
    medicines: unknown[]
    additionalInstructions: string[]
    extractionWarnings: string[]
    reviewStatus: string
  }>
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is string =>
      typeof item === 'string' && item.trim().length > 0
  )
}

export async function getMedicalSummaryContext(
  patientId: string
): Promise<MedicalSummaryContext> {
  const patientRef = adminDb.collection('patients').doc(patientId)

  const [profileSnapshot, historySnapshot, prescriptionSnapshot] =
    await Promise.all([
      patientRef.get(),

      patientRef
        .collection('medicalHistory')
        .orderBy('date', 'desc')
        .get(),

      patientRef
        .collection('prescriptionReviews')
        .orderBy('createdAt', 'desc')
        .get(),
    ])

  const profile = profileSnapshot.data() ?? {}

  const medicalHistory = historySnapshot.docs.map((document) => {
    const record = document.data()

    return {
      type: toStringOrNull(record.type) ?? 'unknown',
      title: toStringOrNull(record.title) ?? '',
      description: toStringOrNull(record.description) ?? '',
      date: toStringOrNull(record.date) ?? '',
      hospital: toStringOrNull(record.hospital),
      doctor: toStringOrNull(record.doctor),
      diagnosis: toStringOrNull(record.diagnosis),
      medicines: toStringArray(record.medicines),
      notes: toStringOrNull(record.notes),
    }
  })

  const prescriptions = prescriptionSnapshot.docs.map((document) => {
    const record = document.data()

    // Prefer patient-corrected information over the original AI extraction.
    const analysis = record.patientReview ?? record.originalAnalysis
    const prescription = analysis?.prescription ?? {}

    return {
      prescriptionDate: toStringOrNull(
        prescription.prescriptionDate
      ),
      prescriberName: toStringOrNull(
        prescription.prescriberName
      ),
      medicines: Array.isArray(analysis?.medicines)
        ? analysis.medicines
        : [],
      additionalInstructions: toStringArray(
        analysis?.additionalInstructions
      ),
      extractionWarnings: toStringArray(
        analysis?.extractionWarnings
      ),
      reviewStatus: toStringOrNull(record.reviewStatus) ??
        'awaiting_review',
    }
  })

  return {
    profile: {
      bloodGroup: toStringOrNull(profile.bloodGroup),
      height: toStringOrNull(profile.height),
      weight: toStringOrNull(profile.weight),
      allergies: toStringArray(profile.allergies),
      chronicConditions: toStringArray(profile.chronicConditions),
      currentMedicines: toStringArray(profile.currentMedicines),
    },
    medicalHistory,
    prescriptions,
  }
}
