
import { Router } from 'express'
import { adminDb } from '../config/firebaseAdmin.js'
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'
import {
  generateChatResponse,
  type ChatMessage,
} from '../services/aiChatService.js'

const router = Router()

router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const patientId = res.locals.firebaseUser.uid

    // Verify that the user is an active patient.
    const userSnapshot = await adminDb
      .collection('users')
      .doc(patientId)
      .get()

    const userData = userSnapshot.data()

    if (
      !userSnapshot.exists ||
      userData?.role !== 'patient' ||
      (userData?.accountStatus ?? 'active') !== 'active'
    ) {
      res.status(403).json({
        success: false,
        message: 'Only active patient accounts can use AI Chat.',
      })
      return
    }

    const messages = req.body?.messages

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 12
    ) {
      res.status(400).json({
        success: false,
        message: 'Provide between 1 and 12 chat messages.',
      })
      return
    }

    const validMessages = messages.every(
      (message: unknown) => {
        if (
          typeof message !== 'object' ||
          message === null
        ) {
          return false
        }

        const item = message as Record<string, unknown>

        return (
          (item.role === 'user' || item.role === 'model') &&
          typeof item.content === 'string' &&
          item.content.trim().length > 0 &&
          item.content.length <= 4000
        )
      }
    )

    if (!validMessages) {
      res.status(400).json({
        success: false,
        message: 'Invalid chat messages. Each message must contain a valid role and text.',
      })
      return
    }

    const chatMessages = messages as ChatMessage[]

    if (chatMessages[chatMessages.length - 1].role !== 'user') {
      res.status(400).json({
        success: false,
        message: 'The latest message must be from the user.',
      })
      return
    }

    const reply = await generateChatResponse(chatMessages)

    res.status(200).json({
      success: true,
      message: 'AI response generated successfully.',
      reply,
    })
  } catch (error) {
    console.error('AI Chat route error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to generate a response. Please try again.',
    })
  }
})

export default router
