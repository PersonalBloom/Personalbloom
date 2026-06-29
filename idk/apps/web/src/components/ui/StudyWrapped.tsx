'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StudyWrappedProps {
  isSoulPlus: boolean
}

type WrappedStats = {
  totalSessions: number
  totalMinutes: number
  topSubject: string
  completionRate: number
  bestDay: string
  totalSubjects: number
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function computeStats(): WrappedStats {
  const plan = JSON.parse(localStorage.getItem('bloomPlan') || 'null')
  const doneTasks: string[] = JSON.parse(localStorage.getItem('bloomDoneTasks') || '[]')

  if (!plan || !plan.subjects) {
    return { totalSessions: doneTasks.length, totalMinutes: doneTasks.length * 45, topSubject: '—', completionRate: 0, bestDay: '—', totalSubjects: 0 }
  }

  const subjectCounts: Record<string, number> = {}
  const dayCounts: Record<string, number> = {}

  doneTasks.forEach(id => {
    const parts = id.split('-')
    if (parts.length >= 3) {
      const subjectId = parts[0]
      const dateStr = parts.slice(1, 4).join('-')
      const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
      subjectCounts[subjectId] = (subjectCounts[subjectId] || 0) + 1
      dayCounts[DAYS[dayOfWeek]] = (dayCounts[DAYS[dayOfWeek]] || 0) + 1
    }
  })

  const topSubjectId = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topSubject = plan.subjects.find((s: any) => s.id === topSubjectId)?.name || plan.subjects[0]?.name || '—'
  const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  const completionRate = doneTasks.length > 0 ? Math.min(100, Math.round((doneTasks.length / Math.max(1, doneTasks.length * 1.4)) * 100)) : 0

  return { totalSessions: doneTasks.length, totalMinutes: doneTasks.length * 45, topSubject, completionRate, bestDay, totalSubjects: plan.subjects.length }
}

function isWrappedAvailable(): boolean {
  const stored = localStorage.getItem('bloomWrappedLastViewed')
  if (!stored) return true
  const last = new Date(stored)
  return (new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24) >= 30
}

function daysUntilNext(): number {
  const stored = localStorage.getItem('bloomWrappedLastViewed')
  if (!stored) return 0
  const last = new Date(stored)
  return Math.max(0, 30 - Math.floor((new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function StudyWrapped({ isSoulPlus }: StudyWrappedProps) {
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState(0)
  const [available, setAvailable] = useState(false)
  const [stats, setStats] = useState<WrappedStats | null>(null)
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    setAvailable(isWrappedAvailable())
    setDaysLeft(daysUntilNext())
  }, [])

  function openWrapped() {
    if (!isSoulPlus || !available) return
    const s = computeStats()
    setStats(s)
    setSlide(0)
    setOpen(true)
    localStorage.setItem('bloomWrappedLastViewed', new Date().toISOString())
    setAvailable(false)
    setDaysLeft(30)
  }

  const slides = stats ? [
    { bg: 'from-violet-900 via-purple-900 to-black', emoji: '🌸', title: 'Your Monthly Wrapped', sub: 'Here\'s how you studied this month', note: null },
    { bg: 'from-pink-900 via-rose-900 to-black', emoji: '📚', title: `${stats.totalSessions} sessions`, sub: 'completed this month', note: `That's ${Math.round(stats.totalMinutes / 60)} hours of focused study` },
    { bg: 'from-blue-900 via-indigo-900 to-black', emoji: '🏆', title: stats.topSubject, sub: 'was your top subject', note: 'You\'re clearly putting in the work here' },
    { bg: 'from-amber-900 via-orange-900 to-black', emoji: '📅', title: stats.bestDay, sub: 'was your most productive day', note: 'You really get things done on this day' },
    { bg: 'from-green-900 via-emerald-900 to-black', emoji: '✅', title: `${stats.completionRate}%`, sub: 'completion rate', note: stats.completionRate >= 70 ? 'Incredible consistency! 🔥' : stats.completionRate >= 40 ? 'Good progress — keep going! 💪' : 'Next month will be even better 🌱' },
    { bg: 'from-violet-900 via-pink-900 to-black', emoji: '🌸', title: 'Keep blooming!', sub: 'See you next month', note: 'Bloomie is proud of you 💜' },
  ] : []

  return (
    <>
      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {/* Locked overlay for free users */}
        {!isSoulPlus && (
          <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-black/40 flex flex-col items-center justify-center rounded-2xl gap-3">
            <div className="text-4xl">🔒</div>
            <p className="text-sm font-semibold text-white/80">Soul+ only</p>
            <a href="/pricing"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-all">
              Upgrade to Soul+ →
            </a>
          </div>
        )}

        <div className={`p-5 ${!isSoulPlus ? 'pointer-events-none select-none' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl ${isSoulPlus && available ? 'animate-bounce' : ''}`}>🎁</div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold">Study Wrapped</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-semibold">✨ Soul+</span>
                </div>
                {isSoulPlus && available ? (
                  <p className="text-sm text-amber-300">🎉 Your monthly Wrapped is ready!</p>
                ) : isSoulPlus ? (
                  <p className="text-sm text-white/40">Next Wrapped in ~{daysLeft} days</p>
                ) : (
                  <p className="text-sm text-white/40">Your monthly study recap — upgrade to unlock</p>
                )}
              </div>
            </div>
            {isSoulPlus && available && (
              <button onClick={openWrapped}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold hover:opacity-90 transition-all">
                View →
              </button>
            )}
            {isSoulPlus && !available && (
              <div className="shrink-0 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">🔒</div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen slideshow */}
      <AnimatePresence>
        {open && slides[slide] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col">
            <motion.div key={slide} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className={`flex-1 bg-gradient-to-br ${slides[slide].bg} flex flex-col items-center justify-center text-center p-10 relative overflow-hidden`}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl translate-x-1/2 translate-y-1/2" />
              </div>
              <div className="absolute top-6 left-0 right-0 flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                ))}
              </div>
              <button onClick={() => setOpen(false)} className="absolute top-5 right-5 text-white/40 hover:text-white text-2xl">×</button>
              <motion.div key={`c-${slide}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 max-w-sm">
                <div className="text-8xl mb-6">{slides[slide].emoji}</div>
                <h2 className="text-5xl font-black mb-3 leading-tight text-white">{slides[slide].title}</h2>
                <p className="text-xl text-white/70 mb-4">{slides[slide].sub}</p>
                {slides[slide].note && <p className="text-sm text-white/40">{slides[slide].note}</p>}
              </motion.div>
              <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4">
                {slide > 0 && (
                  <button onClick={() => setSlide(s => s - 1)} className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold">← Back</button>
                )}
                {slide < slides.length - 1 ? (
                  <button onClick={() => setSlide(s => s + 1)} className="px-8 py-3 rounded-2xl bg-white text-black font-bold hover:bg-white/90">Next →</button>
                ) : (
                  <button onClick={() => setOpen(false)} className="px-8 py-3 rounded-2xl bg-white text-black font-bold hover:bg-white/90">Done 🌸</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
