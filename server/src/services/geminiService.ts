
import { gemini, GEMINI_MODEL } from '../config/gemini.js'

export const generateGeminiResponse = async (
  prompt: string
): Promise<string> => {
  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    })

    const result = response.text

    if (!result) {
      throw new Error('Gemini returned an empty response.')
    }

    return result
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error('Unable to generate a response from Gemini.')
  }
}
