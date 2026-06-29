'use client'

import { useState, useEffect, useRef } from 'react'

interface ExamRescueProps {
  onClose: () => void
  subjects?: string[]
}

const BLOOMIE_TIPS = [
  "Make a list of every topic in your syllabus. Tick off what you know — attack what you don't.",
  "Past papers are your best friend right now. Do one timed, then review every wrong answer.",
  "Focus on high-yield topics first — the ones that come up every year.",
  "Don't re-read notes. Use active recall: close the book, write down everything you remember.",
  "Sleep is non-negotiable. Your brain consolidates memory while you sleep.",
  "Do spaced repetition: review material after 1 hour, then 1 day, then 3 days.",
  "Make a mind map of each topic. Connecting ideas helps you remember them.",
  "Explain each concept out loud as if teaching someone. If you can't explain it, you don't know it.",
  "Break your remaining time into focused blocks. 45 min study, 10 min break. No phone.",
  "Write key formulas and definitions on sticky notes. Put them everywhere.",
]

export default function ExamRescue({ onClose, subjects = [] }: ExamRescueProps) {
  const [phase, setPhase] = useState<'set_code' | 'locked' | 'exit_code'>('set_code')
  const [code, setCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [savedCode, setSavedCode] = useState('')
  const [exitAttempt, setExitAttempt] = useState('')
  const [flashActive, setFlashActive] = useState(false)
  const [countdown, setCountdown] = useState(20)
  const [tipIndex, setTipIndex] = useState(0)
  const [error, setError] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (phase === 'locked') {
      setFlashActive(true)
      setCountdown(20)

      // Rotate tips every 4 seconds
      const tipTimer = setInterval(() => {
        setTipIndex(i => (i + 1) % BLOOMIE_TIPS.length)
      }, 4000)

      // Count down
      const countTimer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            setFlashActive(false)
            clearInterval(countTimer)
            return 0
          }
          return c - 1
        })
      }, 1000)

      return () => {
        clearInterval(tipTimer)
        clearInterval(countTimer)
      }
    }
  }, [phase])

  function startRescue() {
    if (code.length < 4) { setError('Code must be at least 4 characters'); return }
    if (code !== confirmCode) { setError('Codes do not match'); return }
    setSavedCode(code)
    setPhase('locked')
  }

  function tryExit() {
    if (exitAttempt === savedCode) {
      onClose()
    } else {
      setError('Wrong code. Stay focused! 🔒')
      setExitAttempt('')
      setTimeout(() => setError(''), 2000)
    }
  }

  // SET CODE PHASE
  if (phase === 'set_code') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-[#1a0a0a] border border-red-500/50 rounded-3xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🚨</div>
            <h2 className="text-2xl font-bold text-red-400">Exam Rescue Mode</h2>
            <p className="text-white/50 text-sm mt-2">
              Set a code you&apos;ll need to exit. This keeps you locked in until you&apos;re done.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Set your exit code</label>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError('') }}
                placeholder="e.g. BLOOMIE2025"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center font-bold tracking-widest focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Confirm code</label>
              <input
                type="text"
                value={confirmCode}
                onChange={e => { setConfirmCode(e.target.value); setError('') }}
                placeholder="Type it again"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center font-bold tracking-widest focus:outline-none focus:border-red-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={startRescue}
              className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white transition-all"
            >
              🔒 Lock In & Start
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm text-white/30 hover:text-white/60 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // EXIT CODE PHASE
  if (phase === 'exit_code') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="bg-[#1a0a0a] border border-red-500/50 rounded-3xl p-8 max-w-sm w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-xl font-bold text-white">Enter exit code</h2>
            <p className="text-white/40 text-sm mt-1">The code you set at the start</p>
          </div>
          <input
            type="text"
            value={exitAttempt}
            onChange={e => { setExitAttempt(e.target.value); setError('') }}
            placeholder="Your code..."
            autoFocus
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center font-bold tracking-widest focus:outline-none focus:border-violet-500 mb-3"
          />
          {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setPhase('locked')}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white/70 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={tryExit}
              className="flex-1 py-2.5 bg-violet-500 hover:bg-violet-600 rounded-xl text-sm font-bold text-white transition-all"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    )
  }

  // LOCKED PHASE
  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-[#0d0000] transition-all duration-100 ${flashActive ? 'animate-pulse' : ''}`}>
      {/* Red flash overlay */}
      {flashActive && (
        <div className="absolute inset-0 bg-red-500/20 pointer-events-none animate-ping" style={{ animationDuration: '0.5s' }} />
      )}

      {/* Header */}
      <div className={`border-b px-6 py-4 flex items-center justify-between ${flashActive ? 'border-red-500 bg-red-950/50' : 'border-red-900/30 bg-black/30'}`}>
        <div className="flex items-center gap-3">
          <div className={`text-2xl ${flashActive ? 'animate-bounce' : ''}`}>🚨</div>
          <div>
            <div className="font-bold text-red-400 text-lg">EXAM RESCUE MODE</div>
            <div className="text-xs text-white/40">
              {flashActive ? `🔴 Locking in... ${countdown}s` : '🔒 You are locked in — focus!'}
            </div>
          </div>
        </div>
        {!flashActive && (
          <button
            onClick={() => setPhase('exit_code')}
            className="text-xs px-3 py-1.5 border border-white/20 rounded-lg text-white/40 hover:text-white/70 transition-all"
          >
            🔓 Exit
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Bloomie tip */}
        <div className={`p-6 rounded-2xl border mb-6 transition-all duration-500 ${
          flashActive ? 'border-red-500/50 bg-red-950/30' : 'border-white/10 bg-white/5'
        }`}>
          <div className="flex items-start gap-4">
            <div className="text-4xl shrink-0">🌸</div>
            <div>
              <div className="font-semibold text-white mb-2">Bloomie says:</div>
              <p className="text-white/70 leading-relaxed">{BLOOMIE_TIPS[tipIndex]}</p>
            </div>
          </div>
        </div>

        {/* Subjects to focus on */}
        {subjects.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-widest">Your subjects</div>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map(s => (
                <div key={s} className="p-3 bg-red-950/30 border border-red-900/30 rounded-xl text-center">
                  <div className="text-sm font-semibold text-white">{s}</div>
                  <div className="text-xs text-red-400 mt-1">Needs revision</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action steps */}
        <div>
          <div className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-widest">Right now, do this:</div>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Close all social media and put your phone face down', done: false },
              { step: '2', text: 'Open your notes or textbook for your hardest subject', done: false },
              { step: '3', text: 'Do one past paper question without looking at notes', done: false },
              { step: '4', text: 'Write down the 5 most important concepts for each subject', done: false },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-xs font-bold text-red-400 shrink-0 mt-0.5">
                  {item.step}
                </div>
                <p className="text-sm text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {!flashActive && (
          <div className="mt-8 text-center">
            <p className="text-white/30 text-sm">
              To exit, click the 🔓 Exit button above and enter your code.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
