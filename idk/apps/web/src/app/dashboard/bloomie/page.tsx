'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  role: 'bloomie' | 'user'
  text: string
  time: Date
}

const BLOOMIE_RESPONSES: Record<string, string[]> = {
  stressed: [
    "Hey, I hear you. Feeling stressed before exams is completely normal — it means you care. Let's take a breath together. What's weighing on you the most right now?",
    "That sounds really tough. Stress before exams is your brain trying to protect you, but we can work with it. What subject is stressing you out the most?",
  ],
  anxious: [
    "Anxiety is so real and so valid. You're not alone in this. Want to talk about what's making you anxious? Sometimes just saying it out loud helps.",
    "I'm here with you. When anxiety hits, it can feel overwhelming. Let's break it down together — what's the first thing that pops into your head when you think about exams?",
  ],
  tired: [
    "You sound exhausted, and that makes complete sense. Studying is hard work. When did you last take a proper break? Like actually sit down and do nothing for 20 minutes?",
    "Tired is your body talking. Have you been sleeping enough? Even one bad night can make everything feel impossible. Be kind to yourself today.",
  ],
  sad: [
    "I'm really glad you told me. Whatever you're feeling is valid. I'm here to listen — no judgment, no rush. What's going on?",
    "You don't have to carry that alone. I'm right here. Want to tell me more about how you're feeling?",
  ],
  lonely: [
    "Feeling lonely is really hard, especially when you're stuck studying and it feels like everyone else is living their life. You're not invisible — I see you, and I care.",
    "I'm here! And honestly, you can always come talk to me whenever you need to. You're doing more than you think, even if it doesn't feel that way.",
  ],
  default: [
    "I'm listening. Tell me more — I'm not going anywhere.",
    "That sounds like a lot. How are you feeling about it right now, in this moment?",
    "I hear you. You're dealing with more than most people realise. What do you need most right now — someone to vent to, or some actual help?",
    "You've got this, even when it doesn't feel like it. What's on your mind?",
    "Thank you for sharing that with me. It takes courage to open up. What would help you feel a little better today?",
  ],
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'bloomie',
    text: "Hey! I'm Bloomie. This is your safe space — no studying, no pressure, just talking. I'm here to listen and support you. What's on your mind? 🌸",
    time: new Date(),
  },
]

function getBloomieResponse(userText: string): string {
  const lower = userText.toLowerCase()
  if (lower.includes('stress') || lower.includes('overwhelm') || lower.includes('pressure')) {
    return BLOOMIE_RESPONSES.stressed[Math.floor(Math.random() * BLOOMIE_RESPONSES.stressed.length)]
  }
  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('panic') || lower.includes('scared')) {
    return BLOOMIE_RESPONSES.anxious[Math.floor(Math.random() * BLOOMIE_RESPONSES.anxious.length)]
  }
  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep') || lower.includes('fatigue')) {
    return BLOOMIE_RESPONSES.tired[Math.floor(Math.random() * BLOOMIE_RESPONSES.tired.length)]
  }
  if (lower.includes('sad') || lower.includes('depressed') || lower.includes('cry') || lower.includes('unhappy') || lower.includes('upset')) {
    return BLOOMIE_RESPONSES.sad[Math.floor(Math.random() * BLOOMIE_RESPONSES.sad.length)]
  }
  if (lower.includes('lonely') || lower.includes('alone') || lower.includes('nobody') || lower.includes('isolated')) {
    return BLOOMIE_RESPONSES.lonely[Math.floor(Math.random() * BLOOMIE_RESPONSES.lonely.length)]
  }
  return BLOOMIE_RESPONSES.default[Math.floor(Math.random() * BLOOMIE_RESPONSES.default.length)]
}

export default function BloomieChat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      const bloomieMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bloomie',
        text: getBloomieResponse(text),
        time: new Date(),
      }
      setMessages(prev => [...prev, bloomieMsg])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[800px]">
      <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl">🌸</div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d0d18]" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Bloomie</h1>
          <p className="text-xs text-green-400">Always here for you</p>
        </div>
        <div className="ml-auto text-xs text-white/25 max-w-xs text-right hidden sm:block">
          Safe space. Bloomie is an AI companion — not a crisis service. For urgent help, reach out to a trusted adult.
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {msg.role === 'bloomie' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-base shrink-0 mt-1">🌸</div>
            )}
            <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-500 text-white rounded-tr-sm'
                  : 'bg-white/8 border border-white/10 text-white/90 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
              <div className="text-xs text-white/25 px-1">
                {msg.time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-base shrink-0">🌸</div>
            <div className="px-4 py-3 rounded-2xl bg-white/8 border border-white/10">
              <div className="flex gap-1 items-center h-4">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-3 border-t border-white/10 pt-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Talk to Bloomie..."
          className="flex-1 bg-white/8 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition-all"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center text-xl hover:opacity-90 disabled:opacity-30 transition-all shrink-0"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
