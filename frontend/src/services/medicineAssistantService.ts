
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface MedicineInformation {
  medicineName: string | null
  activeIngredient: string | null
  medicineCategory: string | null
  uses: string[]
  commonSideEffects: string[]
  seriousWarnings: string[]
  precautions: string[]
  foodInteractions: string[]
  missedDose: string
  storageConditions: string
  uncertainties: string[]
  professionalAdviceRequired: boolean
  disclaimer: string
}

interface MedicineApiResponse {
  success: boolean
  message: string
  medicine?: MedicineInformation
}

export async function explainMedicine(
  medicineName: string
): Promise<MedicineInformation> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to use the Medicine Assistant.')
  }

  if (!medicineName.trim()) {
    throw new Error('Please enter a medicine name.')
  }

  const token = await user.getIdToken()

  const response = await fetch(
    `${API_BASE_URL}/api/medicine-assistant/explain`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        medicineName: medicineName.trim(),
      }),
    }
  )

  const data = await response.json() as MedicineApiResponse

  if (!response.ok || !data.success || !data.medicine) {
    throw new Error(
      data.message || 'Unable to retrieve medicine information.'
    )
  }

  return data.medicine
}
