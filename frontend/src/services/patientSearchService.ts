
import { auth } from '../lib/firebase'
import { getMedicalHistory } from './medicalHistoryService'
import { getPatientProfile } from './patientProfileService'
import { getMedicalDocuments } from './documentService'
import { getPrescriptionReviews } from './prescriptionService'
import { ROUTES } from '../routes/routePaths'

export interface PatientSearchResult {
  id: string
  title: string
  subtitle: string
  category: string
  route: string
  searchText: string
}

function normalize(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(normalize).join(' ')
  }

  if (value === null || value === undefined) {
    return ''
  }

  return String(value).toLowerCase()
}

function createResult(
  id: string,
  title: string,
  subtitle: string,
  category: string,
  route: string,
  searchableFields: unknown[]
): PatientSearchResult {
  return {
    id,
    title,
    subtitle,
    category,
    route,
    searchText: normalize([
      title,
      subtitle,
      category,
      ...searchableFields,
    ]),
  }
}

export async function searchPatientRecords(
  searchTerm: string
): Promise<PatientSearchResult[]> {
  const patientId = auth.currentUser?.uid

  if (!patientId) {
    throw new Error('Please log in to search your health records.')
  }

  const term = searchTerm.trim().toLowerCase()

  if (term.length < 2) {
    return []
  }

  const [
    history,
    documents,
    prescriptions,
    profile,
  ] = await Promise.all([
    getMedicalHistory(patientId),
    getMedicalDocuments(),
    getPrescriptionReviews(),
    getPatientProfile(patientId),
  ])

  const results: PatientSearchResult[] = []

  // Medical history
  history.forEach((record) => {
    const result = createResult(
      record.id ?? `${record.type}-${record.date}`,
      record.title || record.diagnosis || 'Medical record',
      [
        record.date,
        record.hospital,
        record.doctor,
      ].filter(Boolean).join(' • ') || 'Medical history',
      'Medical History',
      ROUTES.PATIENT_HEALTH,
      [
        record.type,
        record.description,
        record.diagnosis,
        record.medicines,
        record.notes,
        record.hospital,
        record.doctor,
      ]
    )

    if (result.searchText.includes(term)) {
      results.push(result)
    }
  })

  // Uploaded reports and documents
  documents.forEach((document) => {
    const result = createResult(
      document.id,
      document.originalName || document.fileName,
      [
        document.category.replaceAll('_', ' '),
        document.hospital,
        document.doctor,
        document.documentDate,
      ].filter(Boolean).join(' • '),
      'Report / Document',
      ROUTES.PATIENT_REPORTS,
      [
        document.originalName,
        document.fileName,
        document.category,
        document.hospital,
        document.doctor,
        document.documentDate,
      ]
    )

    if (result.searchText.includes(term)) {
      results.push(result)
    }
  })

  // AI prescription reviews
  prescriptions.forEach((prescription) => {
    const result = createResult(
      prescription.reviewId,
      prescription.medicineNames.length
        ? prescription.medicineNames.join(', ')
        : 'Prescription review',
      [
        prescription.prescriberName,
        prescription.prescriptionDate,
        prescription.reviewStatus === 'patient_reviewed'
          ? 'Reviewed'
          : 'Awaiting review',
      ].filter(Boolean).join(' • '),
      'AI Prescription',
      ROUTES.PATIENT_AI,
      [
        prescription.patientName,
        prescription.prescriberName,
        prescription.prescriptionDate,
        prescription.medicineNames,
        prescription.reviewStatus,
      ]
    )

    if (result.searchText.includes(term)) {
      results.push(result)
    }
  })

  // Patient profile and medical information
  if (profile) {
    const profileFields = [
      profile.name,
      profile.email,
      profile.phone,
      profile.address,
      profile.bloodGroup,
      profile.allergies,
      profile.chronicConditions,
      profile.currentMedicines,
    ]

    const profileMatches = normalize(profileFields).includes(term)

    if (profileMatches) {
      results.push(
        createResult(
          'patient-profile',
          'Patient Profile',
          'Personal information and medical details',
          'Profile',
          ROUTES.PATIENT_PROFILE,
          profileFields
        )
      )
    }
  }

  return results.slice(0, 20)
}
