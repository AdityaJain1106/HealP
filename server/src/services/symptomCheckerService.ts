
import { gemini, GEMINI_MODEL } from '../config/gemini.js'
import { symptomCheckerPrompt } from '../prompts/symptomCheckerPrompt.js'

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

export async function assessSymptoms(
  symptoms: string,
  duration: string,
  severity: string
): Promise<SymptomAssessment> {
  if (!symptoms.trim()) {
    throw new Error('Please provide your symptoms.')
  }

  const userInput = `
SYMPTOMS:
${symptoms}

DURATION:
${duration}

SEVERITY:
${severity}

Provide an educational symptom assessment.
Do not diagnose the user.
Return only valid JSON using exactly this structure:

{
  "possibleCauses": [],
  "explanations": [],
  "preventiveMeasures": [],
  "warningSigns": [],
  "recommendedAction": "",
  "emergencyConcern": false,
  "followUpQuestions": [],
  "disclaimer": ""
}

All array items must be strings.
emergencyConcern must be a boolean.
`

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: userInput,
      config: {
        systemInstruction: symptomCheckerPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const result = response.text

    if (!result) {
      throw new Error('Gemini returned an empty symptom assessment.')
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
      throw new Error('Invalid symptom assessment structure.')
    }

    const data = parsedResult as Record<string, unknown>

    const arrayFields = [
      'possibleCauses',
      'explanations',
      'preventiveMeasures',
      'warningSigns',
      'followUpQuestions',
    ]

    const validArrays = arrayFields.every(
      (field) =>
        Array.isArray(data[field]) &&
        (data[field] as unknown[]).every(
          (item) => typeof item === 'string'
        )
    )

    const validStrings = [
      'recommendedAction',
      'disclaimer',
    ].every((field) => typeof data[field] === 'string')

    if (
      !validArrays ||
      !validStrings ||
      typeof data.emergencyConcern !== 'boolean'
    ) {
      throw new Error('Invalid symptom assessment response.')
    }

    return data as unknown as SymptomAssessment
  } catch (error) {
    console.error('Symptom assessment generation failed:', error)

    throw new Error(
      'Unable to assess symptoms right now. Please try again.'
    )
  }
}
