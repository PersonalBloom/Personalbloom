'use client'

import { useState, useEffect, useCallback } from 'react'

interface ExamRescueProps {
  onClose: () => void
  subjects?: string[]
}

type Phase = 'set_code' | 'gather_info' | 'locked' | 'exit_code'

function generateRescuePlan(subject: string, topics: string, notes: string): string[] {
  const topicList = topics.split(/[,\n]/).map(t => t.trim()).filter(Boolean)
  const noteLines = notes.split('\n').map(l => l.trim()).filter(l => l.length > 8)
  const plan: string[] = []

  // ── 1. Topic-by-topic attack plan ──
  if (topicList.length > 0) {
    const topicPlan = topicList.map((t, i) => `${i + 1}. ${t}`).join('\n')
    plan.push(`🗺️ YOUR EXAM TOPICS — study in this order (start with what you know least):\n${topicPlan}\n\nFor each topic: close your notes → write everything you remember → check what you missed → repeat.`)
  }

  // ── 2. Extract key concepts from notes ──
  if (noteLines.length > 0) {
    // Find lines that look like definitions (contain "is", "are", "=", ":", "means", "defined as")
    const defLines = noteLines.filter(l =>
      /\b(is|are|=|means|defined as|refers to|called|formula|equation|law|rule|theorem|principle)\b/i.test(l)
    ).slice(0, 6)

    // Find lines that look like key terms (short, capitalised, or all-caps chunks)
    const keyTermLines = noteLines.filter(l => l.length < 80 && /[A-Z]{2,}|^[A-Z][a-z]+ [A-Z]/.test(l)).slice(0, 4)

    if (defLines.length > 0) {
      plan.push(`📖 KEY DEFINITIONS from your notes — test yourself on each one:\n${defLines.map(l => `• ${l}`).join('\n')}\n\nCan you explain each of these without looking? If not, that's your priority.`)
    }

    if (keyTermLines.length > 0) {
      plan.push(`🔑 KEY TERMS spotted in your notes:\n${keyTermLines.map(l => `• ${l}`).join('\n')}\n\nWrite the definition of each one from memory right now.`)
    }

    // Important lines you might have missed
    const otherLines = noteLines.filter(l => !defLines.includes(l) && !keyTermLines.includes(l)).slice(0, 5)
    if (otherLines.length > 0) {
      plan.push(`📝 MORE FROM YOUR NOTES — don't skip these:\n${otherLines.map(l => `• ${l}`).join('\n')}`)
    }
  }

  // ── 3. Topic-specific mini-strategies ──
  const subjectLower = (subject || '').toLowerCase()
  if (/math|maths|calculus|algebra|stats|statistics/.test(subjectLower)) {
    plan.push(`➗ MATH STRATEGY: Don't just read examples — redo them yourself on paper. For each formula, write it from memory, then do one practice problem. If you get it wrong, do it again.`)
  } else if (/biology|bio/.test(subjectLower)) {
    plan.push(`🧬 BIOLOGY STRATEGY: Draw and label diagrams from memory (cell structures, cycles, processes). Examiners love labelled diagrams. Cover your notes and redraw 3 key diagrams right now.`)
  } else if (/chemistry|chem/.test(subjectLower)) {
    plan.push(`⚗️ CHEMISTRY STRATEGY: Write out every equation and reaction type on one page. Then balance 3 equations from scratch without looking. Know your units and significant figures.`)
  } else if (/physics/.test(subjectLower)) {
    plan.push(`⚡ PHYSICS STRATEGY: List every formula you need on one page. For each one: write the formula, write what each letter means, then do one calculation. Don't move on until you can do it without looking.`)
  } else if (/history|hist/.test(subjectLower)) {
    plan.push(`📜 HISTORY STRATEGY: For each event/period — write: What happened? When? Why? What were the consequences? Practice writing one paragraph answers. Use specific dates and names.`)
  } else if (/english|lit|language/.test(subjectLower)) {
    plan.push(`📚 ENGLISH STRATEGY: Prepare 3-4 strong quotes per text/theme that you can use in any essay. Practice writing your opening paragraph and thesis in under 5 minutes.`)
  } else if (/french|spanish|german|language/.test(subjectLower)) {
    plan.push(`🗣️ LANGUAGE STRATEGY: Write out 10 key vocab words from each topic, then cover and recall. Practice one written response timed. Focus on tense accuracy — that's where marks are lost.`)
  } else if (/econ|economics/.test(subjectLower)) {
    plan.push(`📈 ECONOMICS STRATEGY: For every concept — draw the diagram, label it, explain what shifts what and why. Examiners want to see: definition → diagram → explanation → real example.`)
  } else {
    plan.push(`⚡ ${subject ? subject.toUpperCase() + ' STRATEGY' : 'STRATEGY'}: Pick the 3 most likely exam questions and write a full answer to each one from memory. Then compare with your notes and fill the gaps.`)
  }

  // ── 4. Time management ──
  if (topicList.length > 1) {
    const mins = Math.round(60 / topicList.length)
    plan.push(`⏱️ TIME SPLIT: You have ${topicList.length} topics. Spend roughly ${mins} minutes per topic right now for a first pass. Then go back to your weakest one for a second pass.`)
  } else {
    plan.push(`⏱️ TIMING: Work in 25-min focused blocks. No phone, no music with lyrics. After each block, write down 3 things you just learned — it forces your brain to consolidate.`)
  }

  // ── 5. Active recall tip ──
  plan.push(`🔄 ACTIVE RECALL — the most powerful thing you can do right now:\n1. Read one page/topic for 3 minutes\n2. Close the notes\n3. Write everything you remember\n4. Check what you missed\n5. Repeat step 3 until you get it all\n\nThis beats re-reading 10x. Do this for every topic.`)

  // ── 6. Final encouragement ──
  plan.push(`💜 You're not starting from zero — you know more than you think. Bloomie is right here with you. Close your phone apps, open your notes, and let's go. You've got this. 🌸`)

  return plan
}

export default function ExamRescue({ onClose, subjects = [] }: ExamRescueProps) {
  const [phase, setPhase] = useState<Phase>('set_code')
  const [code, setCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [savedCode, setSavedCode] = useState('')
  const [exitAttempt, setExitAttempt] = useState('')
  const [flashActive, setFlashActive] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const [error, setError] = useState('')

  // Info gathering
  const [examSubject, setExamSubject] = useState('')
  const [examTopics, setExamTopics] = useState('')
  const [pastedNotes, setPastedNotes] = useState('')

  const rescuePlan = generateRescuePlan(examSubject, examTopics, pastedNotes)

  // Block ALL exit attempts when locked
  const blockExit = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = ''
  }, [])

  const blockKeys = useCallback((e: KeyboardEvent) => {
    if (phase !== 'locked' && phase !== 'exit_code') return
    // Block F5, Ctrl+R, Ctrl+W, Ctrl+T, Alt+F4, Escape, Backspace (browser back)
    const blocked = [
      e.key === 'F5',
      e.key === 'Escape',
      (e.ctrlKey || e.metaKey) && ['r', 'w', 't', 'F4'].includes(e.key),
      e.altKey && e.key === 'F4',
    ]
    if (blocked.some(Boolean)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'locked' || phase === 'exit_code') {
      window.addEventListener('beforeunload', blockExit)
      window.addEventListener('keydown', blockKeys, true)
    }
    return () => {
      window.removeEventListener('beforeunload', blockExit)
      window.removeEventListener('keydown', blockKeys, true)
    }
  }, [phase, blockExit, blockKeys])

  useEffect(() => {
    if (phase === 'locked') {
      setFlashActive(true)
      // Only flash for 4 seconds
      const stopFlash = setTimeout(() => setFlashActive(false), 4000)

      // Rotate tips every 5 seconds
      const tipTimer = setInterval(() => {
        setTipIndex(i => (i + 1) % rescuePlan.length)
      }, 5000)

      return () => {
        clearTimeout(stopFlash)
        clearInterval(tipTimer)
      }
    }
  }, [phase, rescuePlan.length])

  function startRescue() {
    if (code.length < 4) { setError('Code must be at least 4 characters'); return }
    if (code !== confirmCode) { setError('Codes do not match'); return }
    setSavedCode(code)
    setPhase('gather_info')
  }

  function goLocked() {
    if (!examSubject.trim() && !examTopics.trim()) {
      setError('Tell Bloomie at least what subject or topic this is about')
      return
    }
    setError('')
    setPhase('locked')
  }

  function tryExit() {
    if (exitAttempt === savedCode) {
      window.removeEventListener('beforeunload', blockExit)
      onClose()
    } else {
      setError('Wrong code. Stay focused! 🔒')
      setExitAttempt('')
      setTimeout(() => setError(''), 2000)
    }
  }

  // SET CODE
  if (phase === 'set_code') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-[#1a0a0a] border border-red-500/50 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🚨</div>
            <h2 className="text-2xl font-bold text-red-400">Exam Rescue Mode</h2>
            <p className="text-white/50 text-sm mt-2">Set a code first. You will need it to exit — no exceptions.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Set your exit code (min 4 characters)</label>
              <input type="text" value={code} onChange={e => { setCode(e.target.value); setError('') }}
                placeholder="e.g. BLOOMIE2025"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center font-bold tracking-widest focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Confirm code</label>
              <input type="text" value={confirmCode} onChange={e => { setConfirmCode(e.target.value); setError('') }}
                placeholder="Type it again"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center font-bold tracking-widest focus:outline-none focus:border-red-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={startRescue} className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white transition-all">
              Next →
            </button>
            <button onClick={onClose} className="w-full py-2 text-sm text-white/30 hover:text-white/60 transition-all">Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // GATHER INFO
  if (phase === 'gather_info') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm">
        <div className="bg-[#0d0d18] border border-red-500/30 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🌸</div>
            <h2 className="text-xl font-bold text-white">Tell Bloomie about your exam</h2>
            <p className="text-white/40 text-sm mt-1">The more detail you give, the better your rescue plan</p>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-xs text-white/50 mb-2 block font-semibold uppercase tracking-widest">What subject is the exam?</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {subjects.map(s => (
                  <button key={s} onClick={() => setExamSubject(s)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-all ${examSubject === s ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                  >{s}</button>
                ))}
              </div>
              <input type="text" value={examSubject} onChange={e => { setExamSubject(e.target.value); setError('') }}
                placeholder="Or type the subject name..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block font-semibold uppercase tracking-widest">What topics / chapters will be tested?</label>
              <textarea value={examTopics} onChange={e => setExamTopics(e.target.value)} rows={3}
                placeholder={'e.g. Chapter 3, Cell division, Photosynthesis, The French Revolution...'}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block font-semibold uppercase tracking-widest">Paste your notes (optional but helps a lot)</label>
              <textarea value={pastedNotes} onChange={e => setPastedNotes(e.target.value)} rows={5}
                placeholder={'Paste anything — class notes, textbook summaries, your own notes...\n\nBloomie will use this to tell you exactly what to focus on.'}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500 resize-none font-mono"
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button onClick={goLocked}
              className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white transition-all"
            >
              🔒 Lock In & Start Rescue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // EXIT CODE
  if (phase === 'exit_code') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
        <div className="bg-[#1a0a0a] border border-red-500/50 rounded-3xl p-8 max-w-sm w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-xl font-bold text-white">Enter your exit code</h2>
            <p className="text-white/40 text-sm mt-1">The code you set at the beginning</p>
          </div>
          <input type="text" value={exitAttempt} onChange={e => { setExitAttempt(e.target.value); setError('') }}
            placeholder="Your code..." autoFocus
            onKeyDown={e => e.key === 'Enter' && tryExit()}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center font-bold tracking-widest focus:outline-none focus:border-violet-500 mb-3"
          />
          {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => { setPhase('locked'); setExitAttempt(''); setError('') }}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white/70 transition-all"
            >← Back to studying</button>
            <button onClick={tryExit}
              className="flex-1 py-2.5 bg-violet-500 hover:bg-violet-600 rounded-xl text-sm font-bold text-white transition-all"
            >Unlock</button>
          </div>
        </div>
      </div>
    )
  }

  // LOCKED
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#080008] overflow-hidden">
      {/* 4-second red flash only */}
      {flashActive && (
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ animation: 'rescue-flash 0.6s ease-in-out infinite', background: 'rgba(220,38,38,0.25)' }}
        />
      )}

      <style>{`
        @keyframes rescue-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.1; }
        }
      `}</style>

      {/* Header */}
      <div className={`shrink-0 px-6 py-4 flex items-center justify-between border-b ${flashActive ? 'bg-red-950/60 border-red-600' : 'bg-black/40 border-red-900/30'}`}>
        <div className="flex items-center gap-3">
          <div className={`text-xl ${flashActive ? 'animate-bounce' : ''}`}>🚨</div>
          <div>
            <div className="font-bold text-red-400">EXAM RESCUE — {examSubject || 'LOCKED IN'}</div>
            <div className="text-xs text-white/40">{flashActive ? '🔴 Locking in...' : '🔒 Focused. You can do this.'}</div>
          </div>
        </div>
        {!flashActive && (
          <button onClick={() => setPhase('exit_code')}
            className="text-xs px-3 py-1.5 border border-white/10 rounded-lg text-white/30 hover:text-white/60 hover:border-white/30 transition-all"
          >🔓 Exit (need code)</button>
        )}
      </div>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl mx-auto w-full">

        {/* Current tip */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl mb-5">
          <div className="flex items-start gap-4">
            <div className="text-3xl shrink-0">🌸</div>
            <div>
              <div className="font-semibold text-sm text-violet-300 mb-1">Bloomie&apos;s focus tip:</div>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{rescuePlan[tipIndex]}</p>
            </div>
          </div>
        </div>

        {/* All rescue tips */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Your full rescue plan</div>
          <div className="space-y-3">
            {rescuePlan.map((tip, i) => (
              <div key={i} className={`p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-line transition-all ${
                i === tipIndex ? 'border-violet-500/40 bg-violet-500/10 text-white/90' : 'border-white/5 bg-white/3 text-white/50'
              }`}>
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        {examTopics && (
          <div className="mb-5">
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Topics on this exam</div>
            <div className="flex flex-wrap gap-2">
              {examTopics.split(/[,\n]/).map(t => t.trim()).filter(Boolean).map((topic, i) => (
                <span key={i} className="px-3 py-1.5 bg-red-950/40 border border-red-900/40 rounded-xl text-sm text-red-300">{topic}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes preview */}
        {pastedNotes && (
          <div className="mb-5">
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Your notes (keep referring back)</div>
            <pre className="p-4 bg-white/3 border border-white/10 rounded-xl text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">{pastedNotes}</pre>
          </div>
        )}

        {!flashActive && (
          <p className="text-center text-white/20 text-xs mt-4">To exit, tap &quot;🔓 Exit&quot; and enter your code. Stay focused — you&apos;ve got this.</p>
        )}
      </div>
    </div>
  )
}
