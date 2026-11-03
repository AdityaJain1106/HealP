
import { gemini, GEMINI_MODEL } from '../config/gemini.js'
import { prescriptionAnalysisPrompt } from '../prompts/prescriptionPrompt.js'
import { validatePrescriptionAnalysis } from './prescriptionValidation.js'
import { applyPrescriptionSafety } from './prescriptionSafety.js'
import type { PrescriptionAnalysis } from '../types/prescription.js'

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)

  return /\b(429|500|502|503|504)\b/.test(message) ||
    /high demand|temporarily unavailable|overloaded/i.test(message)
}

export const analyzePrescriptionImage = async (
  fileBuffer: Buffer,
  mimeType: string
): Promise<PrescriptionAnalysis> => {
  const base64Image = fileBuffer.toString('base64')

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: prescriptionAnalysisPrompt,
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      })

      const result = response.text

      if (!result) {
        throw new Error('Gemini returned an empty prescription analysis.')
      }

      let parsedResponse: unknown

      try {
        parsedResponse = JSON.parse(result)
      } catch {
        throw new Error('Gemini returned invalid JSON.')
      }

      if (!validatePrescriptionAnalysis(parsedResponse)) {
        throw new Error('Gemini returned an invalid prescription structure.')
      }

      return applyPrescriptionSafety(parsedResponse)
    } catch (error) {
      console.error(`Prescription analysis attempt ${attempt} failed:`, error)

      if (attempt === 3 || !isRetryableError(error)) {
        throw new Error('Unable to analyze the prescription image.')
      }

      await sleep(attempt * 2000)
    }
  }

  throw new Error('Unable to analyze the prescription image.')
}
