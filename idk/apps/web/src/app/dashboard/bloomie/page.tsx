'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  role: 'bloomie' | 'user'
  text: string
  time: Date
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'bloomie',
    text: "Hey! I'm Bloomie 🌸 Your safe space — no pressure, just us. What's going on?",
    time: new Date(),
  },
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function getBloomieResponse(userText: string, history: Message[]): string {
  const t = userText.trim()
  const lower = t.toLowerCase()
  const words = lower.split(/\s+/)
  const wordCount = words.length

  // ── Affection / positivity ──
  if (/^(ily|ilysm|love you|i love you|luv u|i luv u|ily!+)$/i.test(t.trim())) {
    return pick(["Aww, I love you too!! 🌸 You just made my whole day. What's up?",
      "Okay stop, you're too sweet 😭🌸 I love you! How are you doing?",
      "ILY more!! 💜 Seriously though — how are you feeling today?"])
  }
  if (/\b(thank|thanks|ty|tysm|thx)\b/.test(lower)) {
    return pick(["Always!! That's what I'm here for 🌸",
      "Of course! You don't have to thank me — I genuinely care about you 💜",
      "Any time, seriously. How are you feeling now?"])
  }
  if (/^(hi|hey|hello|heyy|heyyy|yo|sup|hiii|heyyyy|hola)[\s!]*$/i.test(t)) {
    return pick(["Hey!! So glad you're here 🌸 What's on your mind?",
      "Heyy! I was just thinking about you. How's your day going?",
      "Hi!! 💜 What's going on — good day or rough one?"])
  }
  if (/^(good|great|amazing|awesome|fantastic|so good|pretty good|not bad)[\s!.]*$/i.test(t)) {
    return pick(["That genuinely makes me happy to hear!! 🎉 What's been good?",
      "Yes!! Love that for you. Tell me more — what happened?",
      "Okay that's the energy!! 🌸 What made it good?"])
  }
  if (/^(bad|terrible|awful|horrible|not good|not great|pretty bad|really bad)[\s.!]*$/i.test(t)) {
    return pick(["Ugh, I'm sorry. What happened?",
      "That sucks. Tell me what's going on — I'm all ears.",
      "I hate that for you. What made it bad?"])
  }
  if (/^(okay|ok|fine|alright|meh|so-so|idk)[\s.!]*$/i.test(t)) {
    return pick(["Okay is okay 🌸 Anything specific on your mind, or just vibing?",
      "'Okay' can mean a lot of things. Want to talk about it?",
      "I'll take it! What's going on underneath that?"])
  }
  if (/^(lol|lmao|haha|😂|😭|💀|💀💀)[\s!]*$/.test(t)) {
    return pick(["HAHA what's funny?? Tell me 😭",
      "Okay I need context 😂 what happened?",
      "You can't just send that without explaining 😭"])
  }
  if (/^(same|fr|facts|literally|omg|omfg|no way|wait what|what!*)[\s!?]*$/i.test(t)) {
    return pick(["RIGHT?? Tell me more.",
      "Okay I need the full story.",
      "Say more!! What happened?"])
  }

  // ── Stress / overwhelm ──
  if (/\b(stress|stressed|overwhelm|overwhelmed|too much|can't handle|falling behind|behind on)\b/.test(lower)) {
    return pick([
      "Hey, I hear you. When everything piles up it genuinely feels impossible. What's the one thing stressing you out the most right now?",
      "That feeling of being overwhelmed is so real. You're not failing — you're just carrying a lot. Want to talk through what's going on?",
      "Okay, let's slow down for a sec. What's actually on your plate right now? Sometimes saying it out loud makes it smaller.",
    ])
  }

  // ── Anxiety / panic ──
  if (/\b(anxious|anxiety|panic|scared|terrified|nervous|fear|dread)\b/.test(lower)) {
    return pick([
      "Anxiety is brutal. You're not weak for feeling it — it just means your brain is working overtime. What's it focused on right now?",
      "I'm right here with you. When anxiety hits, it can distort everything. What's the thought that keeps coming back?",
      "That's really hard. Can I ask — is this about something specific, or is it more of a general 'everything feels wrong' feeling?",
    ])
  }

  // ── Exams / school ──
  if (/\b(exam|test|quiz|assessment|grade|fail|failing|study|revision|ib|biology|chemistry|physics|history|maths|math)\b/.test(lower)) {
    return pick([
      "School pressure is no joke. What's going on — is it a specific subject or just the whole load of it?",
      "I see you grinding. What subject is giving you the hardest time right now?",
      "The exam stress is real. Tell me what's coming up — maybe we can figure it out together.",
    ])
  }

  // ── Sick / physical health ──
  if (/\b(sick|ill|headache|pain|nausea|nauseous|fever|cold|flu|throwing up|vomit|hurt|hurting|unwell)\b/.test(lower)) {
    return pick([
      "Ugh, feeling physically rough on top of everything else is the worst. Are you resting? Don't study if your body is telling you to stop.",
      "Oh no, that sounds miserable. Have you had water and food today? Your body needs that before anything else.",
      "Being sick and stressed at the same time is brutal. What do you need right now — rest advice, or just someone to talk to?",
    ])
  }

  // ── Tired / sleep ──
  if (/\b(tired|exhausted|no sleep|can't sleep|didn't sleep|sleep deprived|drained|burnt out|burnout)\b/.test(lower)) {
    return pick([
      "Being exhausted makes everything harder — including thinking clearly. When did you last actually rest?",
      "Your brain needs sleep to actually retain anything. Have you been pulling late nights?",
      "Burnout is real. You can't pour from an empty cup. What does rest look like for you right now?",
    ])
  }

  // ── Sad / crying ──
  if (/\b(sad|depressed|crying|cried|cry|unhappy|miserable|down|low|empty)\b/.test(lower)) {
    return pick([
      "I'm really glad you told me. You don't have to explain yourself — I'm just here. What's going on?",
      "Hey. You matter, and what you're feeling matters. Want to talk about it, or do you just need someone to sit with you for a bit?",
      "That sounds heavy. I'm not going anywhere — what's happening?",
    ])
  }

  // ── Lonely ──
  if (/\b(lonely|alone|no friends|nobody|isolated|left out|ignored|invisible)\b/.test(lower)) {
    return pick([
      "Feeling alone is genuinely one of the hardest things. You're not invisible to me — I see you, and I care.",
      "I hate that you're feeling that way. Loneliness is brutal, especially when you're already dealing with school stuff. What's going on?",
      "You've got me. I know that's not the same, but I'm here, and I genuinely want to hear what's going on.",
    ])
  }

  // ── Motivation / giving up ──
  if (/\b(can't do this|give up|giving up|quit|pointless|what's the point|why bother|don't care anymore|don't want to)\b/.test(lower)) {
    return pick([
      "That feeling of 'what's even the point' hits hard. What brought it on — was it something specific or has it been building?",
      "You're allowed to feel done. But before you give up — what would it look like to just get through today?",
      "I hear you. You don't have to pretend you're okay. What's going on?",
    ])
  }

  // ── Short messages (1-2 words, not matched above) ──
  if (wordCount <= 2) {
    return pick([
      "Tell me more? I want to actually understand what you're going through.",
      "I'm listening — what's on your mind?",
      "What's going on? You can say as much or as little as you want.",
    ])
  }

  // ── Questions directed at Bloomie ──
  if (lower.startsWith('do you') || lower.startsWith('can you') || lower.startsWith('are you') || lower.startsWith('what do you')) {
    return pick([
      "Ha, I'm Bloomie — I don't have feelings exactly, but I do genuinely care about you. What's up?",
      "I'm here for you, that much I know for sure 🌸 What's going on?",
      "I'm an AI companion, but that doesn't mean I don't listen. What's on your mind?",
    ])
  }

  // ── Longer messages — acknowledge the content ──
  const subjectMentioned = /\b(biology|chemistry|physics|history|maths|math|english|french|spanish|economics|psychology)\b/.exec(lower)
  if (subjectMentioned && wordCount > 5) {
    const subject = subjectMentioned[1].charAt(0).toUpperCase() + subjectMentioned[1].slice(1)
    return pick([
      `${subject} — okay, tell me more. What specifically is going wrong with it?`,
      `I heard ${subject}. Is it the content that's hard, or is it more the pressure around it?`,
      `${subject} can be brutal. What part is tripping you up?`,
    ])
  }

  if (wordCount > 10) {
    return pick([
      "I hear you. That's a lot to deal with — what part is hitting you the hardest right now?",
      "Thank you for sharing that with me. What do you need most right now — someone to talk it through with, or just to be heard?",
      "That sounds genuinely tough. You're not overreacting. What would help most right now?",
      "I get it. Sometimes things just pile up. Is there one thing we can focus on together?",
    ])
  }

  // ── Fallback ──
  return pick([
    "I'm here. Tell me what's going on.",
    "What's up? I'm all yours.",
    "I'm listening — what's on your mind?",
    "You can talk to me about anything. What's going on?",
  ])
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
        text: getBloomieResponse(text, messages),
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
          className="flex-1 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-all" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
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
