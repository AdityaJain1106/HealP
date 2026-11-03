
import { auth } from '../lib/firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

interface ChatApiResponse {
  success: boolean
  message: string
  reply?: string
}

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<string> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured.')
  }

  const user = auth.currentUser

  if (!user) {
    throw new Error('Please log in to use HealP AI Chat.')
  }

  if (!messages.length) {
    throw new Error('Please enter a message.')
  }

  const token = await user.getIdToken()

  const response = await fetch(
    `${API_BASE_URL}/api/ai-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    }
  )

  const data = await response.json() as ChatApiResponse

  if (!response.ok || !data.success || !data.reply) {
    throw new Error(
      data.message || 'Unable to generate an AI response.'
    )
  }

  return data.reply
}
