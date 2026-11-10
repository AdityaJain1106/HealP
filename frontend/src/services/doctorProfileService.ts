
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface DoctorProfile {
  uid: string
  name: string
  email: string
  phone: string
  specialization: string
  qualification: string
  experience: string
  registrationNumber: string
  issuingCouncil: string
  workplaceName: string
  workplaceAddress: string
  bio: string
  accountStatus: string
  createdAt: string | { _seconds: number } | null
}

export type UpdateDoctorProfileInput = Partial<
  Pick<
    DoctorProfile,
    | 'name'
    | 'phone'
    | 'specialization'
    | 'qualification'
    | 'experience'
    | 'registrationNumber'
    | 'issuingCouncil'
    | 'workplaceName'
    | 'workplaceAddress'
    | 'bio'
  >
>

interface ApiResponse<T> {
  success: boolean
  message?: string
  profile?: T
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
    throw new Error(
      data.message || 'Something went wrong. Please try again.'
    )
  }

  return data as T
}

// Retrieve the authenticated doctor's profile.
export async function getDoctorProfile(): Promise<DoctorProfile> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/profile`,
    { headers }
  )

  const data = await handleResponse<{
    profile: DoctorProfile
  }>(response)

  return data.profile
}

// Update permitted doctor profile fields.
export async function updateDoctorProfile(
  input: UpdateDoctorProfileInput
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/profile`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(input),
    }
  )

  await handleResponse<unknown>(response)
}
