
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// ==========================================
// TYPES
// ==========================================

export type DoctorPrescriptionStatus =
  | 'pending_patient_review'
  | 'accepted'
  | 'clarification_requested'

export interface PrescriptionDetails {
  strength: string | null
  dosage: string | null
  route: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
}

export interface DoctorPrescriptionMedicine {
  name: string
  prescriptionDetails: PrescriptionDetails
}

export interface DoctorPrescription {
  prescriptionId: string
  patientId: string
  doctorId: string
  doctorName: string
  hospitalName: string | null
  diagnosis: string
  prescriptionDate: string
  followUpDate: string | null
  medicines: DoctorPrescriptionMedicine[]
  additionalInstructions: string[]
  status: DoctorPrescriptionStatus
  clarificationRequest: string | null
  clarificationResponse: string | null
  acceptedAt: unknown | null
  createdAt: unknown
  updatedAt: unknown
}

export interface DoctorPrescriptionVersion {
  versionId: string
  prescriptionId: string
  versionNumber: number
  changedBy: string
  changeReason: string
  prescriptionData: Omit<
    DoctorPrescription,
    'createdAt' | 'updatedAt' | 'acceptedAt'
  >
  createdAt: unknown
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

interface ApiResponse<T> {
  success: boolean
  message?: string
  totalPrescriptions?: number
  totalVersions?: number
  prescriptions?: T[]
  prescription?: T
  versions?: T[]
}

// ==========================================
// AUTHENTICATION
// ==========================================

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to continue.')
  }

  const token = await user.getIdToken()

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// ==========================================
// RESPONSE HANDLING
// ==========================================

async function handleResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json() as ApiResponse<T>

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || 'Something went wrong. Please try again.'
    )
  }

  return data as T
}

// ==========================================
// GET ALL DOCTOR PRESCRIPTIONS
// ==========================================

export async function getPatientDoctorPrescriptions():
  Promise<DoctorPrescription[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/doctor-prescriptions`,
    { headers }
  )

  const data = await handleResponse<{
    prescriptions: DoctorPrescription[]
  }>(response)

  return data.prescriptions
}

// ==========================================
// GET SINGLE PRESCRIPTION
// ==========================================

export async function getPatientDoctorPrescription(
  prescriptionId: string
): Promise<DoctorPrescription> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/doctor-prescriptions/${encodeURIComponent(prescriptionId)}`,
    { headers }
  )

  const data = await handleResponse<{
    prescription: DoctorPrescription
  }>(response)

  return data.prescription
}

// ==========================================
// ACCEPT PRESCRIPTION
// ==========================================

export async function acceptPatientDoctorPrescription(
  prescriptionId: string
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/doctor-prescriptions/${encodeURIComponent(prescriptionId)}/accept`,
    {
      method: 'POST',
      headers,
    }
  )

  await handleResponse(response)
}

// ==========================================
// REQUEST CLARIFICATION
// ==========================================

export async function requestPrescriptionClarification(
  prescriptionId: string,
  clarificationRequest: string
): Promise<void> {
  const normalizedRequest = clarificationRequest.trim()

  if (
    normalizedRequest.length < 5 ||
    normalizedRequest.length > 1000
  ) {
    throw new Error(
      'Your clarification request must contain 5–1000 characters.'
    )
  }

  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/doctor-prescriptions/${encodeURIComponent(prescriptionId)}/clarification`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        clarificationRequest: normalizedRequest,
      }),
    }
  )

  await handleResponse(response)
}

// ==========================================
// GET PRESCRIPTION VERSION HISTORY
// ==========================================

export async function getPatientPrescriptionVersions(
  prescriptionId: string
): Promise<DoctorPrescriptionVersion[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/doctor-prescriptions/${encodeURIComponent(prescriptionId)}/versions`,
    { headers }
  )

  const data = await handleResponse<{
    versions: DoctorPrescriptionVersion[]
  }>(response)

  return data.versions
}
