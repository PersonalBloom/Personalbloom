'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StudyWrappedProps {
  isSoulPlus?: boolean
}

type WrappedStats = {
  totalSessions: number
  totalMinutes: number
  topSubject: string
  completionRate: number
  bestDay: string
  totalSubjects: number
  streak: number
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function computeStats(): WrappedStats {
  const plan = JSON.parse(localStorage.getItem('bloomPlan') || 'null')
  const doneTasks: string[] = JSON.parse(localStorage.getItem('bloomDoneTasks') || '[]')
  const doneSet = new Set(doneTasks)

  if (!plan || !plan.subjects) {
    return { totalSessions: 0, totalMinutes: 0, topSubject: '—', completionRate: 0, bestDay: '—', totalSubjects: 0, streak: 0 }
  }

  // Count done tasks per subject and per day
  const subjectCounts: Record<string, number> = {}
  const dayCounts: Record<string, number> = {}
  let totalMinutes = 0

  // Try to get tasks from localStorage (generated tasks are re-computed, so we use done task IDs)
  doneTasks.forEach(id => {
    // id format: subjectId-dateStr-index
    const parts = id.split('-')
    if (parts.length >= 3) {
      const subjectId = parts[0]
      const dateStr = parts.slice(1, 4).join('-') // YYYY-MM-DD
      const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
      subjectCounts[subjectId] = (subjectCounts[subjectId] || 0) + 1
      dayCounts[DAYS[dayOfWeek]] = (dayCounts[DAYS[dayOfWeek]] || 0) + 1
      totalMinutes += 45 // estimate 45 min per session
    }
  })

  const topSubjectId = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topSubject = plan.subjects.find((s: any) => s.id === topSubjectId)?.name || plan.subjects[0]?.name || '—'
  const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  // Rough completion rate using total done vs total possible (estimate 5 sessions/day * subjects)
  const completionRate = doneTasks.length > 0
    ? Math.min(100, Math.round((doneTasks.length / Math.max(1, doneTasks.length * 1.4)) * 100))
    : 0

  return {
    totalSessions: doneTasks.length,
    totalMinutes,
    topSubject,
    completionRate,
    bestDay,
    totalSubjects: plan.subjects.length,
    streak: 0,
  }
}

function getLastWrappedDate(): Date | null {
  const stored = localStorage.getItem('bloomWrappedLastViewed')
  return stored ? new Date(stored) : null
}

function isWrappedAvailable(): boolean {
  const last = getLastWrappedDate()
  if (!last) return true
  const now = new Date()
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 30
}

const WRAPPED_SLIDES = (stats: WrappedStats) => [
  {
    bg: 'from-violet-900 via-purple-900 to-black',
    emoji: '🌸',
    title: 'Your Monthly Wrapped',
    subtitle: 'Here\'s how you studied this month',
    stat: null,
  },
  {
    bg: 'from-pink-900 via-rose-900 to-black',
    emoji: '📚',
    title: `${stats.totalSessions} sessions`,
    subtitle: 'completed this month',
    stat: `That\'s ${Math.round(stats.totalMinutes / 60)} hours of focused study`,
  },
  {
    bg: 'from-blue-900 via-indigo-900 to-black',
    emoji: '🏆',
    title: stats.topSubject,
    subtitle: 'was your top subject',
    stat: 'You\'re clearly putting in the work here',
  },
  {
    bg: 'from-amber-900 via-orange-900 to-black',
    emoji: '📅',
    title: stats.bestDay || 'No data yet',
    subtitle: 'was your most productive day',
    stat: 'You really get things done on this day',
  },
  {
    bg: 'from-green-900 via-emerald-900 to-black',
    emoji: '✅',
    title: `${stats.completionRate}%`,
    subtitle: 'completion rate',
    stat: stats.completionRate >= 70 ? 'Incredible consistency! 🔥' : stats.completionRate >= 40 ? 'Good progress — keep going! 💪' : 'Next month will be even better 🌱',
  },
  {
    bg: 'from-violet-900 via-pink-900 to-black',
    emoji: '🌸',
    title: 'Keep blooming!',
    subtitle: 'See you next month',
    stat: 'Bloomie is proud of you 💜',
  },
]

export default function StudyWrapped({ isSoulPlus = false }: StudyWrappedProps) {
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState(0)
  const [available, setAvailable] = useState(false)
  const [stats, setStats] = useState<WrappedStats | null>(null)

  useEffect(() => {
    setAvailable(isWrappedAvailable())
  }, [])

  function openWrapped() {
    const s = computeStats()
    setStats(s)
    setSlide(0)
    setOpen(true)
    localStorage.setItem('bloomWrappedLastViewed', new Date().toISOString())
    setAvailable(false)
  }

  const slides = stats ? WRAPPED_SLIDES(stats) : []
  const currentSlide = slides[slide]

  return (
    <>
      {/* Dashboard card */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 ${
        isSoulPlus
          ? available
            ? 'border-amber-400/40 bg-gradient-to-r from-amber-950/40 to-violet-950/40 cursor-pointer hover:border-amber-400/60 transition-all'
            : 'border-white/10 bg-white/5'
          : 'border-white/10 bg-white/5'
      }`}
        onClick={isSoulPlus && available ? openWrapped : undefined}
      >
        {/* Background glow for available state */}
        {isSoulPlus && available && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-violet-500/5 pointer-events-none" />
        )}

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`text-4xl ${isSoulPlus && available ? 'animate-bounce' : ''}`}>🎁</div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold">Study Wrapped</h3>
                {!isSoulPlus && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-semibold">✨ Soul+</span>
                )}
              </div>
              {!isSoulPlus ? (
                <p className="text-sm text-white/40">Your monthly study recap — upgrade to Soul+ to unlock</p>
              ) : available ? (
                <p className="text-sm text-amber-300">🎉 Your monthly Wrapped is ready! Tap to see it →</p>
              ) : (
                <p className="text-sm text-white/40">Next Wrapped available in ~{30 - Math.floor((new Date().getTime() - (getLastWrappedDate()?.getTime() || 0)) / (1000 * 60 * 60 * 24))} days</p>
              )}
            </div>
          </div>

          {!isSoulPlus ? (
            <a href="/pricing"
              onClick={e => e.stopPropagation()}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-all"
            >
              Upgrade →
            </a>
          ) : available ? (
            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-lg">
              →
            </div>
          ) : (
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 text-lg">
              🔒
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Wrapped modal */}
      <AnimatePresence>
        {open && currentSlide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col"
          >
            <motion.div
              key={slide}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className={`flex-1 bg-gradient-to-br ${currentSlide.bg} flex flex-col items-center justify-center text-center p-10 relative overflow-hidden`}
            >
              {/* Decorative blobs */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>

              {/* Slide counter */}
              <div className="absolute top-6 left-0 right-0 flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                ))}
              </div>

              {/* Close */}
              <button onClick={() => setOpen(false)}
                className="absolute top-5 right-5 text-white/40 hover:text-white text-2xl font-light">×</button>

              {/* Content */}
              <motion.div
                key={`content-${slide}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="relative z-10 max-w-sm"
              >
                <div className="text-8xl mb-6">{currentSlide.emoji}</div>
                <h2 className="text-5xl font-black mb-3 leading-tight text-white">{currentSlide.title}</h2>
                <p className="text-xl text-white/70 mb-4">{currentSlide.subtitle}</p>
                {currentSlide.stat && (
                  <p className="text-sm text-white/40 mt-2">{currentSlide.stat}</p>
                )}
              </motion.div>

              {/* Navigation */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
                {slide > 0 && (
                  <button onClick={() => setSlide(s => s - 1)}
                    className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all">
                    ← Back
                  </button>
                )}
                {slide < slides.length - 1 ? (
                  <button onClick={() => setSlide(s => s + 1)}
                    className="px-8 py-3 rounded-2xl bg-white text-black font-bold hover:bg-white/90 transition-all">
                    Next →
                  </button>
                ) : (
                  <button onClick={() => setOpen(false)}
                    className="px-8 py-3 rounded-2xl bg-white text-black font-bold hover:bg-white/90 transition-all">
                    Done 🌸
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
