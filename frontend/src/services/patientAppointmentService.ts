
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type AppointmentStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export interface PatientAppointment {
  appointmentId: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  accessGrantId: string
  appointmentDate: string
  appointmentTime: string
  reason: string
  status: AppointmentStatus
  doctorResponse: string | null
  createdAt: unknown
  updatedAt: unknown
  respondedAt: unknown
}

export interface CreateAppointmentInput {
  doctorId: string
  accessGrantId: string
  appointmentDate: string
  appointmentTime: string
  reason: string
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  appointments?: T[]
  appointmentId?: string
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

// Submit a new appointment request
export async function createPatientAppointment(
  input: CreateAppointmentInput
): Promise<string> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/appointments`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    }
  )

  const data = await handleResponse<{
    appointmentId: string
  }>(response)

  return data.appointmentId
}

// Retrieve appointments belonging to the logged-in patient
export async function getPatientAppointments(): Promise<
  PatientAppointment[]
> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/patient/appointments`,
    { headers }
  )

  const data = await handleResponse<{
    appointments: PatientAppointment[]
  }>(response)

  return data.appointments
}
