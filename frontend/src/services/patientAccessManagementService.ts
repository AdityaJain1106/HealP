
import { auth } from '../lib/firebase'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/+$/, '')

export interface PatientDoctorAccess {
  grantId: string
  doctorId: string
  doctorName: string
  permissions: (
    | 'profile'
    | 'medicalHistory'
    | 'documents'
    | 'prescriptions'
    | 'prescriptionCreation'
  )[]
  grantedAt?: {
    _seconds?: number
    seconds?: number
  } | null
}

interface ApiResponse {
  success: boolean
  message?: string
  accesses?: PatientDoctorAccess[]
}

async function getAuthHeaders() {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to manage doctor permissions.')
  }

  const token = await user.getIdToken()

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Something went wrong.')
  }

  return data as T
}

export async function getPatientDoctorAccess():
Promise<PatientDoctorAccess[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/access-management`,
    {
      method: 'GET',
      headers,
    }
  )

  const data = await handleResponse<ApiResponse>(response)

  return data.accesses ?? []
}

export async function revokeDoctorAccess(
  grantId: string
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/access-management/${encodeURIComponent(grantId)}`,
    {
      method: 'DELETE',
      headers,
    }
  )

  await handleResponse<ApiResponse>(response)
}
