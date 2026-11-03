
import { gemini, GEMINI_MODEL } from '../config/gemini.js'
import { medicineAssistantPrompt } from '../prompts/medicineAssistantPrompt.js'

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

export async function getMedicineInformation(
  medicineName: string
): Promise<MedicineInformation> {
  const normalizedName = medicineName.trim()

  if (!normalizedName) {
    throw new Error('Medicine name is required.')
  }

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${medicineAssistantPrompt}

MEDICINE NAME:
${normalizedName}`,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const result = response.text

    if (!result) {
      throw new Error('Gemini returned an empty medicine response.')
    }

    let parsedResult: unknown

    try {
      parsedResult = JSON.parse(result)
    } catch {
      throw new Error('Gemini returned invalid JSON.')
    }

    if (
      typeof parsedResult !== 'object' ||
      parsedResult === null ||
      Array.isArray(parsedResult)
    ) {
      throw new Error('Gemini returned an invalid response structure.')
    }

    const data = parsedResult as Record<string, unknown>

    const stringFields = [
      'missedDose',
      'storageConditions',
      'disclaimer',
    ]

    const arrayFields = [
      'uses',
      'commonSideEffects',
      'seriousWarnings',
      'precautions',
      'foodInteractions',
      'uncertainties',
    ]

    const validStrings = stringFields.every(
      (field) => typeof data[field] === 'string'
    )

    const validArrays = arrayFields.every(
      (field) =>
        Array.isArray(data[field]) &&
        (data[field] as unknown[]).every(
          (item) => typeof item === 'string'
        )
    )

    const validIdentity =
      (typeof data.medicineName === 'string' || data.medicineName === null) &&
      (typeof data.activeIngredient === 'string' || data.activeIngredient === null) &&
      (typeof data.medicineCategory === 'string' || data.medicineCategory === null)

    if (
      !validStrings ||
      !validArrays ||
      !validIdentity ||
      data.professionalAdviceRequired !== true
    ) {
      throw new Error('Gemini returned an invalid medicine information structure.')
    }

    return data as unknown as MedicineInformation
  } catch (error) {
    console.error('Medicine information generation failed:', error)
    throw new Error('Unable to retrieve medicine information. Please try again.')
  }
}
