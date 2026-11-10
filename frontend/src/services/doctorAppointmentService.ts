
import { auth } from '../lib/firebase'

import type { PatientAppointment } from './patientAppointmentService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface RespondToAppointmentInput {
  status: 'accepted' | 'rejected'
  doctorResponse?: string
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

// Retrieve appointments assigned to the logged-in doctor
export async function getDoctorAppointments(): Promise<
  PatientAppointment[]
> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/appointments`,
    { headers }
  )

  const data = await handleResponse<{
    appointments: PatientAppointment[]
  }>(response)

  return data.appointments
}

// Accept or reject an incoming appointment request
export async function respondToAppointment(
  appointmentId: string,
  input: RespondToAppointmentInput
): Promise<void> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/api/doctor/appointments/${appointmentId}/respond`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    }
  )

  await handleResponse<unknown>(response)
}
