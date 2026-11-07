
import { Router } from 'express'
import {
  sendContactEmail,
  type ContactEmailInput,
} from '../services/emailService.js'

const router = Router()

const allowedCategories = [
  'General Inquiry',
  'Suggestion',
  'Feature Request',
  'Bug Report',
  'Other',
]

router.post('/', async (req, res) => {
  try {
    const { name, email, category, message } = req.body ?? {}

    // Validate name
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 80
    ) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid name (maximum 80 characters).',
      })
      return
    }

    // Validate email
    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
      return
    }

    // Validate category
    if (
      typeof category !== 'string' ||
      !allowedCategories.includes(category)
    ) {
      res.status(400).json({
        success: false,
        message: 'Please select a valid contact category.',
      })
      return
    }

    // Validate message
    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.trim().length > 2000
    ) {
      res.status(400).json({
        success: false,
        message: 'Message must contain 1–2000 characters.',
      })
      return
    }

    const contactData: ContactEmailInput = {
      name: name.trim(),
      email: email.trim(),
      category,
      message: message.trim(),
    }

    await sendContactEmail(contactData)

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully!',
    })
  } catch (error) {
    console.error('Contact route error:', error)

    res.status(500).json({
      success: false,
      message: 'Unable to send your message. Please try again later.',
    })
  }
})

export default router
