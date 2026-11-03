
import { useState, type FormEvent } from 'react'
import {
  Bot,
  MessageCircle,
  Send,
  User,
  Loader2,
  Plus,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'

import Card from '../common/Card'
import Badge from '../common/Badge'

import {
  sendChatMessage,
  type ChatMessage,
} from '../../services/aiChatService'

const initialMessage: ChatMessage = {
  role: 'model',
  content:
    "Hello! I'm HealP AI Health Assistant. You can ask me about medical terminology, reports, medicines, prescriptions, and general healthcare information. How can I help you today?",
}

function AIChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    initialMessage,
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const userMessage = input.trim()

    if (!userMessage || loading) return

    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        role: 'user',
        content: userMessage,
      },
    ]

    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const reply = await sendChatMessage(updatedMessages)

      setMessages([
        ...updatedMessages,
        {
          role: 'model',
          content: reply,
        },
      ])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to generate a response. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleNewChat = () => {
    if (loading) return

    setMessages([initialMessage])
    setInput('')
    setError(null)
  }

  return (
    <div className="space-y-5">
      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Bot size={26} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                HealP AI Chat
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your conversational healthcare assistant
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            New Chat
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Badge variant="success" dot>
            AI Assistant
          </Badge>

          <span className="text-xs text-slate-400">
            Educational information only
          </span>
        </div>
      </Card>

      <Card padding="lg">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <MessageCircle size={19} className="text-primary-600" />
          <h3 className="font-semibold text-slate-900">
            Conversation
          </h3>
        </div>

        <div className="max-h-[550px] min-h-[350px] space-y-5 overflow-y-auto pr-2">
          {messages.map((message, index) => {
            const isUser = message.role === 'user'

            return (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  isUser ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isUser
                      ? 'bg-primary-600 text-white'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isUser ? <User size={18} /> : <Bot size={19} />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'rounded-tr-sm bg-primary-600 text-white'
                      : 'rounded-tl-sm bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold opacity-70">
                    {isUser ? 'You' : 'HealP AI'}
                  </p>

                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {message.content}
                  </p>
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Bot size={19} />
              </div>

              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
                <Loader2
                  size={17}
                  className="animate-spin text-primary-600"
                />

                <span className="text-sm text-slate-500">
                  HealP AI is thinking...
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSend}
          className="mt-6 flex items-end gap-3 border-t border-slate-100 pt-5"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey
              ) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="Ask something about healthcare..."
            rows={2}
            maxLength={4000}
            disabled={loading}
            className="min-h-[52px] flex-1 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-slate-50"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}

            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />

          <p>
            HealP AI provides educational information and does not
            replace professional medical advice, diagnosis or treatment.
            Consult a qualified healthcare professional for medical decisions.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default AIChatAssistant
