
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface SymptomAssessment {
  possibleCauses: string[]
  explanations: string[]
  preventiveMeasures: string[]
  warningSigns: string[]
  recommendedAction: string
  emergencyConcern: boolean
  followUpQuestions: string[]
  disclaimer: string
}

interface SymptomApiResponse {
  success: boolean
  message: string
  assessment?: SymptomAssessment
}

export async function assessSymptoms(
  symptoms: string,
  duration: string,
  severity: string
): Promise<SymptomAssessment> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to use the Symptom Checker.')
  }

  if (!symptoms.trim()) {
    throw new Error('Please describe your symptoms.')
  }

  const token = await user.getIdToken()

  const response = await fetch(
    `${API_BASE_URL}/api/symptom-checker/assess`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        symptoms: symptoms.trim(),
        duration,
        severity,
      }),
    }
  )

  const data = await response.json() as SymptomApiResponse

  if (!response.ok || !data.success || !data.assessment) {
    throw new Error(
      data.message || 'Unable to assess symptoms. Please try again.'
    )
  }

  return data.assessment
}
