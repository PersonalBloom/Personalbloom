'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { BloomieChat } from '@/components/ui/Bloomie'
import { Button } from '@/components/ui/Button'

interface QuizResult { subject: string; correct: number; total: number; created_at: string }
interface Profile { name: string; plan: string; streak: number; growth_points: number; total_sessions: number; subjects: string[] }

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-white/40 mt-1">{label}</div>
    </div>
  )
}


// ── Study Heatmap ─────────────────────────────────────────────────────────
function StudyHeatmap({ studyDates }: { studyDates: string[] }) {
  const counts: Record<string, number> = {}
  studyDates.forEach(d => { counts[d] = (counts[d] || 0) + 1 })

  // Build last 15 weeks of days
  const today = new Date()
  today.setHours(0,0,0,0)
  const days: Date[] = []
  for (let i = 104; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d)
  }
  // Pad to start on Monday
  const firstDow = days[0].getDay() || 7 // 1=Mon
  const padded: (Date | null)[] = Array(firstDow - 1).fill(null).concat(days)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="card">
      <h2 className="font-bold text-lg mb-4">📅 Study Activity</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="w-3 h-3" />
                const key = day.toISOString().split('T')[0]
                const n = counts[key] || 0
                const isToday = key === today.toISOString().split('T')[0]
                const color = n === 0 ? 'bg-white/5' : n === 1 ? 'bg-violet-500/40' : n <= 3 ? 'bg-violet-500/70' : 'bg-violet-400'
                return (
                  <div key={di} title={`${key}: ${n} session${n!==1?'s':''}`}
                    className={`w-3 h-3 rounded-sm ${color} ${isToday ? 'ring-1 ring-violet-400' : ''}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-white/30 mt-2 min-w-max px-0.5">
          {[...new Set(days.map(d => MONTHS[d.getMonth()]))].map(m => <span key={m}>{m}</span>)}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
        <span>Less</span>
        {['bg-white/5','bg-violet-500/40','bg-violet-500/70','bg-violet-400'].map((cl,i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cl}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [results, setResults] = useState<QuizResult[]>([])
  const [isPremium, setIsPremium] = useState(false)

  const [gameState, setGameState] = useState<{xp:number;totalSessions:number;studyDates:string[]}>({xp:0,totalSessions:0,studyDates:[]})

  const load = useCallback(async () => {
    // Read local game state immediately (no network)
    try {
      const gs = JSON.parse(localStorage.getItem('bloomGame') || '{}')
      setGameState({ xp: gs.xp||0, totalSessions: gs.totalSessions||0, studyDates: gs.studyDates||[] })
    } catch {}

    // Then load Supabase data in background
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: prof }, { data: res }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ])
    if (prof) {
      const p = prof as Profile & { plan: string }
      setProfile(p)
      setIsPremium(localStorage.getItem('bloomSoulPlus') === 'true' || p.plan === 'soul_plus')
    }
    if (res) setResults(res as QuizResult[])
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Weakness analytics: subjects with <70% accuracy
  const subjectStats = Object.entries(
    results.reduce((acc, r) => {
      if (!acc[r.subject]) acc[r.subject] = { correct: 0, total: 0 }
      acc[r.subject].correct += r.correct
      acc[r.subject].total  += r.total
      return acc
    }, {} as Record<string, { correct: number; total: number }>)
  ).map(([s, { correct, total }]) => ({ subject: s, pct: Math.round((correct / total) * 100), correct, total }))
    .sort((a, b) => a.pct - b.pct)

  const weakSubjects = subjectStats.filter(s => s.pct < 70)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-1">📊 My Progress</h1>
        <p className="text-white/50 text-sm">Track your growth and find what to improve</p>
      </div>

      <StudyHeatmap studyDates={gameState.studyDates} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="🔥" label="Day Streak"    value={`${profile?.streak || gameState.studyDates.length > 0 ? Math.min(profile?.streak||0, 999) : 0}d`} />
        <StatCard icon="⚡" label="Growth Points" value={profile?.growth_points || gameState.xp} />
        <StatCard icon="📚" label="Sessions"      value={profile?.total_sessions || gameState.totalSessions} />
        <StatCard icon="🧠" label="Quiz answers"  value={results.length} />
      </div>

      {/* Quiz accuracy per subject */}
      {subjectStats.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-bold text-lg">🎯 Quiz Accuracy by Subject</h2>
          {subjectStats.map(s => (
            <div key={s.subject}>
              <div className="flex justify-between text-sm mb-1">
                <span>{s.subject}</span>
                <span className={s.pct >= 70 ? 'text-green-400' : 'text-red-400'}>{s.pct}%</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${s.pct >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weakness Analytics — Soul+ */}
      <div className="card relative overflow-hidden">
        <h2 className="font-bold text-lg mb-4">📉 Weakness Analytics</h2>
        {isPremium ? (
          weakSubjects.length > 0 ? (
            <div className="space-y-3">
              <BloomieChat message={`I've spotted your weak spots! Focus on these to level up fast 🎯`} />
              {weakSubjects.map(s => (
                <div key={s.subject} className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold">{s.subject}</p>
                    <p className="text-xs text-red-400">{s.pct}% accuracy — needs work</p>
                  </div>
                  <span className="text-sm text-white/40">{s.correct}/{s.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/50 text-sm">Complete some quizzes and I'll find your weak spots! 🌱</p>
          )
        ) : (
          <div className="relative">
            {/* Blurred preview */}
            <div className="filter blur-sm pointer-events-none select-none space-y-3">
              {['Math', 'Biology', 'History'].map(s => (
                <div key={s} className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold">{s}</p>
                    <p className="text-xs text-red-400">XX% accuracy — needs work</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bloom-card/80 backdrop-blur-sm rounded-xl">
              <span className="text-4xl mb-3">🔒</span>
              <p className="font-bold text-lg mb-2">Soul+ Feature</p>
              <p className="text-white/50 text-sm text-center mb-4 px-4">
                Unlock Weakness Analytics to see exactly what to study
              </p>
              <Button variant="soul" size="sm">Upgrade to Soul+</Button>
            </div>
          </div>
        )}
      </div>

      {/* Recent quiz history */}
      {results.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4">📋 Recent Quiz History</h2>
          <div className="space-y-2">
            {results.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <span className="text-sm font-medium">{r.subject}</span>
                  <span className="text-xs text-white/40 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <span className={`text-sm font-bold ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
