import { auth } from '../lib/firebase'

import type {
  DoctorPrescription,
  DoctorPrescriptionMedicine,
  DoctorPrescriptionVersion,
} from './patientPrescriptionService'



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface AmendDoctorPrescriptionInput {
  diagnosis: string
  hospitalName?: string | null
  prescriptionDate: string
  followUpDate?: string | null
  medicines: DoctorPrescriptionMedicine[]
  additionalInstructions?: string[]
  changeReason: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  totalPrescriptions?: number
  prescriptions?: T
  versionId?: string
}

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

async function handleResponse<T>(response: Response): Promise<T> {
  let data: ApiResponse<T>

  try {
    data = (await response.json()) as ApiResponse<T>
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }

  return data as T
}

/**
 * Retrieves clarification requests for the authenticated doctor.
 * GET /api/doctor/prescriptions/inbox
 */
export async function getDoctorPrescriptionInbox(): Promise<DoctorPrescription[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/prescriptions/inbox`,
    { headers }
  )

  const data = await handleResponse<{
    prescriptions: DoctorPrescription[]
  }>(response)

  return data.prescriptions
}

/**
 * Sends a clarification response to the patient.
 * POST /api/doctor/patients/:patientId/prescriptions/:prescriptionId/explain
 */
export async function explainDoctorPrescription(
  patientId: string,
  prescriptionId: string,
  explanation: string
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/prescriptions/${encodeURIComponent(prescriptionId)}/explain`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ explanation }),
    }
  )

  await handleResponse<unknown>(response)
}

/**
 * Creates a new immutable version and sends it to the patient for review.
 * POST /api/doctor/patients/:patientId/prescriptions/:prescriptionId/amend
 */
export async function amendDoctorPrescription(
  patientId: string,
  prescriptionId: string,
  input: AmendDoctorPrescriptionInput
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/prescriptions/${encodeURIComponent(prescriptionId)}/amend`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    }
  )

  const data = await handleResponse<{ versionId: string }>(response)

  if (!data.versionId) {
    throw new Error('The prescription was amended, but no version ID was returned.')
  }

  return data.versionId
}

/**
 * Retrieves prescription version history for the authenticated doctor.
 * GET /api/doctor/patients/:patientId/prescriptions/:prescriptionId/versions
 */
export async function getDoctorPrescriptionVersions(
  patientId: string,
  prescriptionId: string
): Promise<DoctorPrescriptionVersion[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/patients/${encodeURIComponent(patientId)}/prescriptions/${encodeURIComponent(prescriptionId)}/versions`,
    { headers }
  )

  const data = await handleResponse<{
    versions: DoctorPrescriptionVersion[]
  }>(response)

  return data.versions
}