
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface MedicalSummary {
  overview: string

  knownConditions: {
    name: string
    details: string
    date: string | null
  }[]

  medicalTimeline: {
    date: string | null
    event: string
    details: string
    type: string
  }[]

  currentMedicines: {
    name: string
    details: string
    verificationStatus:
      | 'patient_reviewed'
      | 'awaiting_review'
      | 'profile_recorded'
  }[]

  allergies: {
    name: string
    details: string
  }[]

  importantNotes: string[]
  missingInformation: string[]
  disclaimer: string
}

interface MedicalSummaryApiResponse {
  success: boolean
  message: string
  summary?: MedicalSummary
}

export async function generateMedicalSummary(): Promise<MedicalSummary> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to generate your medical summary.')
  }

  const token = await user.getIdToken()

  const response = await fetch(
    `${API_BASE_URL}/api/medical-summary/generate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json() as MedicalSummaryApiResponse

  if (!response.ok || !data.success || !data.summary) {
    throw new Error(
      data.message || 'Unable to generate your medical summary.'
    )
  }

  return data.summary
}
