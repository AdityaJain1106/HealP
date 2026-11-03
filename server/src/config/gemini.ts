
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const apiKey = process.env.GEMINI_API_KEY
const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY in server/.env')
}

export const gemini = new GoogleGenAI({
  apiKey,
})

export const GEMINI_MODEL = model

console.log(`Gemini AI configured with model: ${GEMINI_MODEL}`)
