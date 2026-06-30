'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface QuizResult { subject: string; correct: number; total: number; created_at: string }
interface SubjectStats { subject: string; accuracy: number; sessions: number; trend: 'up'|'down'|'stable'; predictedGrade: string; gradeColor: string }

function predictGrade(acc: number): { grade: string; color: string } {
  if (acc >= 90) return { grade: '7 / A*', color: 'text-emerald-400' }
  if (acc >= 80) return { grade: '6 / A',  color: 'text-green-400'   }
  if (acc >= 70) return { grade: '5 / B',  color: 'text-lime-400'    }
  if (acc >= 60) return { grade: '4 / C',  color: 'text-yellow-400'  }
  if (acc >= 50) return { grade: '3 / D',  color: 'text-amber-400'   }
  if (acc >= 40) return { grade: '2 / E',  color: 'text-orange-400'  }
  return { grade: '1 / U', color: 'text-red-400' }
}

function getTrend(results: QuizResult[]): 'up'|'down'|'stable' {
  if (results.length < 2) return 'stable'
  const sorted = [...results].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const recent = sorted.slice(-3).reduce((s,r) => s + r.correct/r.total, 0) / Math.min(3, sorted.length)
  const older  = sorted.slice(0,-3).reduce((s,r) => s + r.correct/r.total, 0) / Math.max(1, sorted.length-3)
  return recent - older > 0.05 ? 'up' : older - recent > 0.05 ? 'down' : 'stable'
}

export default function GradePredictorPage() {
  const supabase = createClient()
  const [stats, setStats]           = useState<SubjectStats[]>([])
  const [loading, setLoading]       = useState(true)
  const [isSoulPlus, setIsSoulPlus] = useState(false)

  const load = useCallback(async () => {
    setIsSoulPlus(localStorage.getItem('bloomSoulPlus') === 'true')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (!data || data.length === 0) { setLoading(false); return }
    const bySubject: Record<string, QuizResult[]> = {}
    for (const r of data as QuizResult[]) {
      if (!bySubject[r.subject]) bySubject[r.subject] = []
      bySubject[r.subject].push(r)
    }
    const result = Object.entries(bySubject).map(([subject, results]) => {
      const accuracy = Math.round((results.reduce((s,r) => s + r.correct/r.total, 0) / results.length) * 100)
      const { grade, color } = predictGrade(accuracy)
      return { subject, accuracy, sessions: results.length, trend: getTrend(results), predictedGrade: grade, gradeColor: color }
    }).sort((a,b) => b.accuracy - a.accuracy)
    setStats(result)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  if (!isSoulPlus) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-5xl mb-4">📈</div>
      <h1 className="text-2xl font-black mb-2">Grade Predictor</h1>
      <p className="text-white/50 mb-6">See your predicted grade per subject based on quiz performance.</p>
      <Link href="/pricing" className="px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-xl font-bold transition-all">Upgrade to Soul+ →</Link>
    </div>
  )

  if (loading) return <div className="p-6 space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}</div>

  if (stats.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-5xl mb-4">🧠</div>
      <h1 className="text-2xl font-black mb-2">No quiz data yet</h1>
      <p className="text-white/50 mb-6">Take some quizzes and Bloomie will predict your grades!</p>
      <Link href="/dashboard/quiz" className="px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-xl font-bold transition-all">Go to Quiz →</Link>
    </div>
  )

  const avg = Math.round(stats.reduce((s,x) => s + x.accuracy, 0) / stats.length)
  const { grade: overallGrade, color: overallColor } = predictGrade(avg)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black mb-1">📈 Grade Predictor</h1>
        <p className="text-white/50 text-sm">Based on your quiz accuracy across all sessions</p>
      </div>
      <div className="glass-strong p-6 rounded-2xl flex items-center gap-6">
        <div className="text-center shrink-0">
          <div className={`text-4xl font-black ${overallColor}`}>{overallGrade}</div>
          <div className="text-xs text-white/40 mt-1">Overall</div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-white/40 mb-1"><span>Average accuracy</span><span>{avg}%</span></div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${avg}%` }} transition={{ duration: 0.8 }} />
          </div>
          <p className="text-xs text-white/40 mt-2">{stats.reduce((s,x) => s + x.sessions, 0)} quiz sessions across {stats.length} subject{stats.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="space-y-3">
        {stats.map((s, i) => (
          <motion.div key={s.subject} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold">{s.subject}</div>
                <div className="text-xs text-white/40">{s.sessions} session{s.sessions !== 1 ? 's' : ''} · {s.trend === 'up' ? '📈 Improving' : s.trend === 'down' ? '📉 Declining' : '➡️ Stable'}</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-black ${s.gradeColor}`}>{s.predictedGrade}</div>
                <div className="text-xs text-white/40">{s.accuracy}% accuracy</div>
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: s.accuracy >= 70 ? 'linear-gradient(to right,#22c55e,#10b981)' : s.accuracy >= 50 ? 'linear-gradient(to right,#f59e0b,#f97316)' : 'linear-gradient(to right,#ef4444,#dc2626)' }}
                initial={{ width: 0 }} animate={{ width: `${s.accuracy}%` }} transition={{ duration: 0.6, delay: i * 0.06 }} />
            </div>
            {s.accuracy < 60 && <p className="text-xs text-amber-400 mt-2">Needs work — take more {s.subject} quizzes and do revision sessions</p>}
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-white/25 text-center">Predictions are based on quiz accuracy. More sessions = more accurate.</p>
    </div>
  )
}
