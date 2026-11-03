import { gemini, GEMINI_MODEL } from '../config/gemini.js'
import { aiChatPrompt } from '../prompts/aiChatPrompt.js'

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export async function generateChatResponse(
  messages: ChatMessage[]
): Promise<string> {
  if (!messages.length) {
    throw new Error('At least one message is required.')
  }

  if (messages[messages.length - 1].role !== 'user') {
    throw new Error('The latest message must be from the user.')
  }

  const conversationHistory = messages.slice(-12)

  const contents = conversationHistory.map((message) => ({
    role: message.role,
    parts: [{ text: message.content }],
  }))

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: aiChatPrompt,
        temperature: 0.4,
      },
    })

    const answer = response.text?.trim()

    if (!answer) {
      throw new Error('Gemini returned an empty response.')
    }

    return answer
  } catch (error) {
    console.error('AI Chat generation failed:', error)

    throw new Error(
      'Unable to generate a response. Please try again.'
    )
  }
}