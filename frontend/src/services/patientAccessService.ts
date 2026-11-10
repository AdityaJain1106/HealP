
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type DoctorAccessPermission =
  | 'profile'
  | 'medicalHistory'
  | 'documents'
  | 'prescriptions'
  | 'prescriptionCreation'

export interface DoctorAccessRequest {
  requestId: string
  doctorId: string
  patientId: string
  reason: string
  permissions: DoctorAccessPermission[]
  status: 'pending' | 'approved' | 'rejected' | 'revoked'
  createdAt?: {
    _seconds?: number
    seconds?: number
  } | string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  requests?: T[]
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
  const data = await response.json() as ApiResponse<T>

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || 'Something went wrong. Please try again.'
    )
  }

  return data as T
}

// Fetch pending doctor access requests
export async function getPatientAccessRequests(): Promise<
  DoctorAccessRequest[]
> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/access-requests`,
    { headers }
  )

  const data = await handleResponse<{
    requests: DoctorAccessRequest[]
  }>(response)

  return data.requests
}

// Approve selected permissions
export async function approveDoctorAccessRequest(
  requestId: string,
  permissions: DoctorAccessPermission[]
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/access-requests/${encodeURIComponent(requestId)}/approve`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ permissions }),
    }
  )

  await handleResponse(response)
}

// Reject a doctor access request
export async function rejectDoctorAccessRequest(
  requestId: string
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/access-requests/${encodeURIComponent(requestId)}/reject`,
    {
      method: 'POST',
      headers,
    }
  )

  await handleResponse(response)
}
