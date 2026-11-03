
import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import { generateGeminiResponse } from '../services/geminiService.js'

const router = Router()

router.post('/test', verifyFirebaseToken, async (req, res) => {
  try {
    const prompt = req.body?.prompt

    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({
        success: false,
        message: 'A valid prompt is required.',
      })
      return
    }

    const response = await generateGeminiResponse(prompt.trim())

    res.status(200).json({
      success: true,
      message: 'Gemini API connected successfully.',
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      response,
    })
  } catch (error) {
    console.error('Gemini test endpoint failed:', error)

    res.status(500).json({
      success: false,
      message: 'Gemini could not process the request.',
    })
  }
})

export default router
