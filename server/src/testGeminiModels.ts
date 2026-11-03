
import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing.')
}

const ai = new GoogleGenAI({ apiKey })

async function testImageAnalysis() {
  try {
    const imagePath = 'D:/HealP/server/test-prescription.png'
    const image = readFileSync(imagePath)

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: image.toString('base64'),
          },
        },
        {
          text: 'Describe the visible contents of this synthetic test image in one sentence.',
        },
      ],
    })

    console.log('\nGemini image response:')
    console.log(response.text)
  } catch (error) {
    console.error('\nGemini image test failed:')
    console.error(error)
  }
}

testImageAnalysis()
