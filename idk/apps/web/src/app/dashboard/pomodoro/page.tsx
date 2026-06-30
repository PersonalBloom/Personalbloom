'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { awardXP } from '@/lib/gamification'

type Mode = 'focus' | 'short' | 'long'
const MODES: Record<Mode, { label: string; mins: number; color: string }> = {
  focus: { label: 'Focus',       mins: 25, color: 'from-violet-500 to-pink-500' },
  short: { label: 'Short Break', mins:  5, color: 'from-green-500 to-teal-500' },
  long:  { label: 'Long Break',  mins: 15, color: 'from-blue-500 to-cyan-500' },
}

const ROOMS = [
  { id: 'rain',    icon: '🌧️', label: 'Rain',        src: null,                   premium: false },
  { id: 'lofi',    icon: '🎵', label: 'Lo-fi beats', src: '/sounds/lofi.mp3',     premium: true  },
  { id: 'forest',  icon: '🌲', label: 'Forest',      src: '/sounds/forest.mp3',   premium: true  },
  { id: 'cafe',    icon: '☕', label: 'Café',         src: '/sounds/cafe.mp3',     premium: true  },
  { id: 'space',   icon: '🚀', label: 'Deep Space',  src: '/sounds/space.mp3',    premium: true  },
  { id: 'binaural',icon: '🧠', label: 'Binaural',    src: '/sounds/binaural.mp3', premium: true  },
]

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>('focus')
  const [secsLeft, setSecsLeft] = useState(MODES.focus.mins * 60)
  const [running, setRunning] = useState(false)
  const [room, setRoom] = useState<string | null>(null)
  const [sessions, setSessions] = useState(0)
  const [isSoulPlus, setIsSoulPlus] = useState(false)

  useEffect(() => {
    setIsSoulPlus(localStorage.getItem('bloomSoulPlus') === 'true')
  }, [])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rainSourceRef = useRef<AudioNode | null>(null)
  const audioElemRef = useRef<HTMLAudioElement | null>(null)

  const totalSecs = MODES[mode].mins * 60
  const pct = ((totalSecs - secsLeft) / totalSecs) * 100
  const mins = String(Math.floor(secsLeft / 60)).padStart(2, '0')
  const secs = String(secsLeft % 60).padStart(2, '0')

  const stopAudio = useCallback(() => {
    try { (rainSourceRef.current as OscillatorNode | null)?.stop?.() } catch {}
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    rainSourceRef.current = null
    if (audioElemRef.current) {
      audioElemRef.current.pause()
      audioElemRef.current.currentTime = 0
      audioElemRef.current = null
    }
  }, [])

  const startRain = useCallback(() => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const bufSize = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf; src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 800
    const gain = ctx.createGain(); gain.gain.value = 0.08
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    src.start()
    rainSourceRef.current = src
  }, [])

  function playRoom(id: string) {
    const r = ROOMS.find(x => x.id === id)
    if (!r) return
    if (r.premium && !isSoulPlus) return // blocked
    stopAudio()
    if (room === id) { setRoom(null); return }
    setRoom(id)
    if (id === 'rain') {
      startRain()
    } else if (r.src) {
      const audio = new Audio(r.src)
      audio.loop = true
      audio.volume = 0.6
      audio.play().catch(() => {})
      audioElemRef.current = audio
    }
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'focus') { setSessions(n => n + 1); awardXP('session_complete') }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, mode])

  function switchMode(m: Mode) {
    setMode(m)
    setSecsLeft(MODES[m].mins * 60)
    setRunning(false)
  }

  function reset() {
    setSecsLeft(MODES[mode].mins * 60)
    setRunning(false)
  }

  useEffect(() => () => stopAudio(), [stopAudio])

  const circumference = 2 * Math.PI * 110
  const dashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black mb-1">🎧 Focus Room</h1>
        <p className="text-white/50 text-sm">{sessions} session{sessions !== 1 ? 's' : ''} completed today</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(Object.keys(MODES) as Mode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              mode === m ? 'bg-white/15 border-white/30 text-white' : 'border-white/10 text-white/40 hover:text-white'
            }`}
          >{MODES[m].label}</button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex justify-center">
        <div className="relative w-64 h-64">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <motion.circle cx="120" cy="120" r="110" fill="none"
              stroke="url(#timerGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: dashoffset }}
              transition={{ duration: 0.3 }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black tabular-nums">{mins}:{secs}</span>
            <span className="text-white/40 text-sm mt-1">{MODES[mode].label}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        <Button onClick={() => setRunning(r => !r)} size="lg">
          {running ? '⏸ Pause' : secsLeft < totalSecs ? '▶ Resume' : '▶ Start'}
        </Button>
        <Button variant="ghost" onClick={reset}>↺ Reset</Button>
      </div>

      {/* Ambient rooms */}
      <div>
        <h3 className="font-bold mb-4">🎵 Ambient Sounds</h3>
        <div className="grid grid-cols-3 gap-3">
          {ROOMS.map(r => (
            <button key={r.id}
              onClick={() => r.premium && !isSoulPlus ? window.location.href = '/pricing' : playRoom(r.id)}
              className={`card text-center py-5 relative transition-all ${
                r.premium && !isSoulPlus
                  ? 'opacity-50 cursor-pointer'
                  : 'cursor-pointer'
              } ${
                room === r.id
                  ? 'border-violet-400 bg-violet-500/20'
                  : 'hover:border-violet-400/30'
              }`}
            >
              {r.premium && !isSoulPlus && (
                <span className="absolute top-2 right-2 text-[10px] bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full border border-violet-500/40">Soul+</span>
              )}
              <span className="text-3xl block mb-2">{r.icon}</span>
              <span className="text-xs font-semibold">{r.label}</span>
              {room === r.id && <span className="block text-xs text-violet-400 mt-1">Playing ♪</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Session dots */}
      {sessions > 0 && (
        <div className="card">
          <p className="text-sm font-bold mb-3">Today&apos;s sessions</p>
          <div className="flex gap-2">
            {Array.from({ length: sessions }).map((_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
