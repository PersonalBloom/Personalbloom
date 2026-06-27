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

export default function ProgressPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [results, setResults] = useState<QuizResult[]>([])
  const [isPremium, setIsPremium] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: prof }, { data: res }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ])
    if (prof) {
      const p = prof as Profile & { plan: string; trial_started_at: string; trial_days: number }
      setProfile(p)
      const started = new Date(p.trial_started_at ?? 0).getTime()
      const daysUsed = (Date.now() - started) / 86400000
      setIsPremium(p.plan === 'soulplus' || (p.plan === 'trial' && daysUsed < p.trial_days))
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="🔥" label="Day Streak"    value={`${profile?.streak || 0}d`} />
        <StatCard icon="⚡" label="Growth Points" value={profile?.growth_points || 0} />
        <StatCard icon="📚" label="Sessions"      value={profile?.total_sessions || 0} />
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
