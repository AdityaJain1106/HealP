import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface AdminStats {
  totalUsers: number
  totalPatients: number
  totalDoctors: number
  totalAdmins: number
  pendingDoctors: number
  activeAccounts: number
  suspendedAccounts: number
  rejectedDoctors: number
}

export interface ManagedUser {
  uid: string
  name: string
  email: string
  phone?: string
  role: 'patient' | 'doctor' | 'admin'
  accountStatus: 'active' | 'pending' | 'rejected' | 'suspended'
  authProvider?: string
  specialization?: string
  qualification?: string
  experience?: string
  registrationNumber?: string
  issuingCouncil?: string
  workplaceName?: string
  workplaceAddress?: string
  bio?: string
  verificationNotes?: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface UserDetailsResponse {
  user: ManagedUser & Record<string, unknown>
  patientProfile?: Record<string, unknown>
  medicalHistoryCount?: number
  documentsCount?: number
  approvedPatientsCount?: number
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  stats?: T
  doctors?: T
  users?: T
  details?: T
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in as an administrator to continue.')
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
      data.message || 'Administrative operation failed. Please try again.'
    )
  }

  return data as T
}

export async function getAdminStats(): Promise<AdminStats> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers,
  })

  const data = await handleResponse<{ stats: AdminStats }>(response)
  return data.stats
}

export async function getPendingDoctors(): Promise<ManagedUser[]> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/api/admin/doctors/pending`, {
    headers,
  })

  const data = await handleResponse<{ doctors: ManagedUser[] }>(response)
  return data.doctors
}

export async function verifyDoctor(
  doctorId: string,
  status: 'active' | 'rejected',
  notes?: string
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/admin/doctors/${encodeURIComponent(doctorId)}/verify`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ status, notes }),
    }
  )

  const data = await handleResponse<{ message: string }>(response)
  return data.message
}

export async function getAllUsers(filters?: {
  role?: string
  status?: string
  search?: string
}): Promise<ManagedUser[]> {
  const headers = await getAuthHeaders()

  const queryParams = new URLSearchParams()
  if (filters?.role && filters.role !== 'all') {
    queryParams.append('role', filters.role)
  }
  if (filters?.status && filters.status !== 'all') {
    queryParams.append('status', filters.status)
  }
  if (filters?.search) {
    queryParams.append('search', filters.search)
  }

  const url = `${API_BASE_URL}/api/admin/users?${queryParams.toString()}`

  const response = await fetch(url, { headers })
  const data = await handleResponse<{ users: ManagedUser[] }>(response)
  return data.users
}

export async function getUserDetails(userId: string): Promise<UserDetailsResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}`,
    { headers }
  )

  const data = await handleResponse<{ details: UserDetailsResponse }>(response)
  return data.details
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'pending' | 'rejected' | 'suspended',
  reason?: string
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/status`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, reason }),
    }
  )

  const data = await handleResponse<{ message: string }>(response)
  return data.message
}

export async function updateUserRole(
  userId: string,
  role: 'patient' | 'doctor' | 'admin'
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role }),
    }
  )

  const data = await handleResponse<{ message: string }>(response)
  return data.message
}

export async function deleteUserAccount(userId: string): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      headers,
    }
  )

  const data = await handleResponse<{ message: string }>(response)
  return data.message
}

