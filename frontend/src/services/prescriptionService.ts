
import { auth } from '../lib/firebase'
import {
  uploadMedicalDocument,
  type MedicalDocument,
} from './documentService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface PrescriptionDetails {
  strength: string | null
  dosage: string | null
  route: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
}

export interface MedicineInformation {
  generalUses: string[]
  commonSideEffects: string[]
}

export interface PrescriptionMedicine {
  name: string | null
  prescriptionDetails: PrescriptionDetails
  medicineInformation: MedicineInformation
  confidence: 'high' | 'medium' | 'low'
  sourceText: string | null
  requiresVerification: boolean
}

export interface PrescriptionAnalysis {
  prescription: {
    patientName: string | null
    prescriberName: string | null
    hospitalName: string | null
    prescriptionDate: string | null
  }
  medicines: PrescriptionMedicine[]
  additionalInstructions: string[]
  extractionWarnings: string[]
  uncertainFields: string[]
  requiresProfessionalReview: boolean
}


export interface PrescriptionReviewSummary {
  reviewId: string
  reviewStatus: 'awaiting_review' | 'patient_reviewed'
  createdAt: string | null
  patientName: string | null
  prescriberName: string | null
  prescriptionDate: string | null
  medicineNames: string[]
}

export interface SavedPrescriptionReview {
  reviewId: string
  originalAnalysis: PrescriptionAnalysis
  patientReview: PrescriptionAnalysis | null
  reviewStatus: 'awaiting_review' | 'patient_reviewed'
  createdAt: string | null
  updatedAt: string | null
}

interface AnalyzeApiResponse {
  success: boolean
  message: string
  reviewId: string
  analysis: PrescriptionAnalysis
}

interface SaveReviewApiResponse {
  success: boolean
  message: string
  reviewId: string
}

export interface PrescriptionAnalysisResult {
  reviewId: string
  analysis: PrescriptionAnalysis
  savedDocument: MedicalDocument | null
  saveError: string | null
}

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to continue.')
  }

  return user.getIdToken()
}

export async function analyzePrescription(
  file: File
): Promise<PrescriptionAnalysisResult> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('Please upload a JPEG or PNG prescription image.')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Prescription image must be smaller than 10 MB.')
  }

  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  const token = await getAuthToken()
  const formData = new FormData()

  formData.append('file', file)

  const response = await fetch(
    `${API_BASE_URL}/api/prescriptions/analyze`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  )

  const data = await response.json() as AnalyzeApiResponse

  if (
    !response.ok ||
    !data.success ||
    !data.analysis ||
    !data.reviewId
  ) {
    throw new Error(
      data.message || 'Unable to analyze the prescription. Please try again.'
    )
  }

  let savedDocument: MedicalDocument | null = null
  let saveError: string | null = null

  try {
    savedDocument = await uploadMedicalDocument(file, {
      category: 'prescription',
    })
  } catch (error) {
    saveError = error instanceof Error
      ? error.message
      : 'The prescription could not be saved.'
  }

  return {
    reviewId: data.reviewId,
    analysis: data.analysis,
    savedDocument,
    saveError,
  }
}

export async function savePrescriptionReview(
  reviewId: string,
  patientReview: PrescriptionAnalysis
): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  if (!reviewId.trim()) {
    throw new Error('Prescription review ID is missing.')
  }

  const token = await getAuthToken()

  const response = await fetch(
    `${API_BASE_URL}/api/prescriptions/${encodeURIComponent(reviewId)}/review`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ patientReview }),
    }
  )

  const data = await response.json() as SaveReviewApiResponse

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || 'Unable to save your prescription review.'
    )
  }
}


interface PrescriptionReviewsListResponse {
  success: boolean
  message?: string
  reviews: PrescriptionReviewSummary[]
}

interface PrescriptionReviewResponse {
  success: boolean
  message?: string
  review: SavedPrescriptionReview
}

export async function getPrescriptionReviews(): Promise<PrescriptionReviewSummary[]> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/prescriptions`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json() as PrescriptionReviewsListResponse

  if (!response.ok || !data.success || !Array.isArray(data.reviews)) {
    throw new Error(data.message || 'Unable to load saved prescription reviews.')
  }

  return data.reviews
}

export async function getPrescriptionReview(
  reviewId: string
): Promise<SavedPrescriptionReview> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  if (!reviewId.trim()) {
    throw new Error('Prescription review ID is missing.')
  }

  const token = await getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/api/prescriptions/${encodeURIComponent(reviewId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await response.json() as PrescriptionReviewResponse

  if (!response.ok || !data.success || !data.review) {
    throw new Error(data.message || 'Unable to load this prescription review.')
  }

  return data.review
}


export async function deletePrescriptionReview(reviewId: string): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  if (!reviewId.trim()) {
    throw new Error('Prescription review ID is missing.')
  }

  const token = await getAuthToken()
  const response = await fetch(
    `${API_BASE_URL}/api/prescriptions/${encodeURIComponent(reviewId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  )
  const data = await response.json() as { success: boolean; message?: string }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Unable to delete this prescription review.')
  }
}
