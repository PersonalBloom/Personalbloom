'use client'

import { useState, useEffect, useCallback } from 'react'

interface ExamRescueProps {
  onClose: () => void
  subjects?: string[]
}

type Phase = 'set_code' | 'gather_info' | 'locked' | 'exit_code'

function generateRescuePlan(subject: string, topics: string, notes: string): string[] {
  const topicList = topics.split(/[,\n]/).map(t => t.trim()).filter(Boolean)
  const noteLines = notes.split('\n').map(l => l.trim()).filter(l => l.length > 10)

  const plan: string[] = []

  if (topicList.length > 0) {
    plan.push(`📌 Your exam covers: ${topicList.join(', ')}. Start with the one you know LEAST.`)
  }

  if (noteLines.length > 0) {
    plan.push(`📖 From your notes — key things to master right now:\n${noteLines.slice(0, 5).map(l => `• ${l}`).join('\n')}`)
  }

  plan.push(`⚡ For ${subject || 'this exam'}: do NOT re-read everything. Pick the 3 most important concepts and write them from memory.`)
  plan.push(`🎯 Make a quick list: what do you definitely know? What are you unsure about? Focus only on the unsure stuff.`)
  plan.push(`⏱️ Work in focused blocks. 25 minutes on one topic, then 5 minutes break. No phone during the 25 min.`)
  plan.push(`📝 Write out definitions, formulas, and key facts on paper. Writing helps you remember better than reading.`)
  plan.push(`🔄 After studying a topic, close your notes and try to recall everything. If you can't, study it again.`)

  if (topicList.length > 1) {
    plan.push(`📋 Divide your time: spend roughly ${Math.round(100 / topicList.length)}% on each topic. Don't get stuck on one.`)
  }

  plan.push(`💪 You have more time than you think. Stay calm, stay focused. Bloomie believes in you.`)

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
