'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Loader2, RefreshCw } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Suggestions rapides ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Quelles formations sont disponibles en mai 2026 ?",
  "Comment fonctionne le financement AFDAS ?",
  "Quels sont les critères Qualiopi à surveiller ?",
  "Quelle est la différence entre CPF et OPCO ?",
  "Qui contacter pour une inscription ?",
  "Qu'est-ce que le référentiel Qualiopi ?",
]

// ─── Bulle de message ─────────────────────────────────────────────────────────
function BulleMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-[#A0195B] text-white' : 'bg-[#FEE7F0] text-[#A0195B]'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Contenu */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-[#A0195B] text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>
        <span suppressHydrationWarning className="text-xs text-gray-400 px-1">
         {`${msg.timestamp.getHours().toString().padStart(2,'0')}:${msg.timestamp.getMinutes().toString().padStart(2,'0')}`}
        </span>
      </div>
    </div>
  )
}

// ─── Indicateur de frappe ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-[#FEE7F0] text-[#A0195B] flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant Color Aim 📷\n\nJe peux vous aider sur les formations, les financements (AFDAS, FAFCEA, OPCO 2i, CPF), la certification Qualiopi, ou toute autre question.\n\nComment puis-je vous aider ?",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function envoyer(texte?: string) {
    const question = (texte ?? input).trim()
    if (!question || loading) return

    const msgUser: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, msgUser])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, msgUser].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()
      const msgBot: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reponse ?? "Désolé, je n'ai pas pu répondre. Réessayez.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, msgBot])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Une erreur s'est produite. Vérifiez votre connexion et réessayez.",
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function reset() {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant Color Aim 📷\n\nJe peux vous aider sur les formations, les financements (AFDAS, FAFCEA, OPCO 2i, CPF), la certification Qualiopi, ou toute autre question.\n\nComment puis-je vous aider ?",
      timestamp: new Date(),
    }])
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] max-h-screen p-6 max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#A0195B]" />
            Assistant Color Aim
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Formations · Financements · Qualiopi</p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#A0195B] border border-gray-200 hover:border-[#A0195B] px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Nouvelle conversation
        </button>
      </div>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-4 mb-4">
        {messages.map(msg => (
          <BulleMessage key={msg.id} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex gap-2 flex-wrap mb-3 flex-shrink-0">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => envoyer(s)}
              className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-[#A0195B] hover:text-[#A0195B] px-3 py-1.5 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Barre de saisie */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && envoyer()}
          placeholder="Posez votre question…"
          disabled={loading}
          className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#A0195B] focus:ring-1 focus:ring-[#A0195B] disabled:opacity-50 disabled:bg-gray-50"
        />
        <button
          onClick={() => envoyer()}
          disabled={loading || !input.trim()}
          className="bg-[#A0195B] text-white px-4 py-3 rounded-xl hover:bg-[#8A1548] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
