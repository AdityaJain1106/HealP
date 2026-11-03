
import { gemini, GEMINI_MODEL } from '../config/gemini.js'
import { medicalSummaryPrompt } from '../prompts/medicalSummaryPrompt.js'
import { getMedicalSummaryContext } from './medicalSummaryContextService.js'

export async function generateMedicalSummary(
  patientId: string
): Promise<string> {
  try {
    const medicalContext = await getMedicalSummaryContext(patientId)

    const prompt = `${medicalSummaryPrompt}${JSON.stringify(
      medicalContext,
      null,
      2
    )}`

    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const result = response.text

    if (!result) {
      throw new Error('Gemini returned an empty medical summary.')
    }

    // Ensure Gemini returned valid JSON before sending it to the frontend.
    JSON.parse(result)

    return result
  } catch (error) {
    console.error('Medical summary generation failed:', error)
    throw new Error('Unable to generate the medical summary.')
  }
}
