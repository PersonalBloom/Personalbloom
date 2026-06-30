'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { BloomieChat } from '@/components/ui/Bloomie'
import { Button } from '@/components/ui/Button'
import ExamRescue from '@/components/ui/ExamRescue'
import StudyWrapped from '@/components/ui/StudyWrapped'
import StudyPlant from '@/components/ui/StudyPlant'
import { cn, getStreakEmoji } from '@/lib/utils'

interface Profile {
  name: string
  subjects: string[]
  plan: string
  streak: number
  growth_points: number
  total_sessions: number
}

const QUESTS = [
  { id: 'study_30', icon: '📖', label: 'Study 30 min today', xp: 20 },
  { id: 'quiz_5',   icon: '🧠', label: 'Answer 5 quiz questions', xp: 15 },
  { id: 'review',   icon: '✏️', label: 'Review yesterday\'s notes', xp: 10 },
]

function XPBar({ points }: { points: number }) {
  const level = Math.floor(points / 100)
  const pct   = (points % 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>Level {level}</span><span>{points % 100}/100 XP</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

type Textbook = { id: string; subject: string; title: string; pageCount: number; addedAt: string }

function TextbooksWidget() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('bloomTextbooks')
      if (saved) setTextbooks(JSON.parse(saved))
    } catch {}
  }, [])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-bold text-lg mb-0.5">📚 My Textbooks</div>
          <p className="text-xs text-white/40">Bloomie reads these for every study session &amp; revision prompt</p>
        </div>
        <a href="/dashboard/notes?tab=textbooks"
          className="text-sm px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 hover:text-white transition-all"
        >+ Upload</a>
      </div>
      {textbooks.length === 0 ? (
        <a href="/dashboard/notes?tab=textbooks"
          className="flex items-center gap-4 p-4 border-2 border-dashed border-white/10 rounded-2xl hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
        >
          <div className="text-4xl">📖</div>
          <div>
            <div className="font-medium text-white/70 group-hover:text-white transition-colors">Upload your MYP / IB textbooks</div>
            <div className="text-xs text-white/30 mt-0.5">Biology, Maths, Chemistry... Bloomie will read the whole thing</div>
          </div>
        </a>
      ) : (
        <div className="space-y-2">
          {textbooks.map(tb => (
            <div key={tb.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-2xl">📖</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{tb.title}</div>
                <div className="text-xs text-white/40">{tb.subject} · {tb.pageCount} pages</div>
              </div>
              <div className="text-xs text-green-400 flex-shrink-0">✓ Active</div>
            </div>
          ))}
          <a href="/dashboard/notes?tab=textbooks"
            className="block text-center text-xs text-white/30 hover:text-white/60 pt-1 transition-colors"
          >+ Add another textbook</a>
        </div>
      )}
    </div>
  )
}

export default function DashboardHome() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hour] = useState(new Date().getHours())
  const [rescueMode, setRescueMode] = useState(false)
  const [isSoulPlusLocal, setIsSoulPlusLocal] = useState(false)

  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const [bloomieMsg, setBloomieMsg] = useState('')

  function buildBloomieMsg(profileData: Profile | null) {
    // Read real context
    const plan = (() => { try { return JSON.parse(localStorage.getItem('bloomPlan') || 'null') } catch { return null } })()
    const doneTasks: string[] = (() => { try { return JSON.parse(localStorage.getItem('bloomDoneTasks') || '[]') } catch { return [] } })()
    const game = (() => { try { return JSON.parse(localStorage.getItem('bloomGame') || 'null') } catch { return null } })()
    const name = profileData?.name?.split(' ')[0] || ''

    // Nearest exam
    const subjects: Array<{name: string, examDate: string}> = plan?.subjects || []
    const upcoming = subjects
      .filter(s => s.examDate)
      .map(s => ({ name: s.name, days: Math.ceil((new Date(s.examDate).getTime() - Date.now()) / 86400000) }))
      .filter(s => s.days >= 0)
      .sort((a, b) => a.days - b.days)
    const nearest = upcoming[0]

    // Tasks done today
    const todayKey = new Date().toISOString().split('T')[0]
    const streak = profileData?.streak || game?.streak || 0

    if (nearest && nearest.days === 0) return `${nearest.name} exam is TODAY ${name}!! You've got this, go be amazing 🌸💪`
    if (nearest && nearest.days === 1) return `${nearest.name} exam is tomorrow!! Last push — you've done the work, now trust yourself 🌟`
    if (nearest && nearest.days <= 3) return `${nearest.name} in ${nearest.days} days. Focus on weak spots, not everything. You've got this 💜`
    if (nearest && nearest.days <= 7) return `${nearest.name} is in ${nearest.days} days — a solid week. Consistent sessions beat cramming every time 📚`
    if (streak >= 7) return `${streak}-day streak!! ${name} you're literally on fire right now 🔥 Keep it going!`
    if (streak >= 3) return `${streak} days in a row! 🌸 The consistency is showing — don't break the chain.`
    if (doneTasks.length > 0 && hour >= 18) return `You already got sessions done today${name ? ', ' + name : ''}! Enjoy your evening, you earned it 🌙`
    if (hour < 9) return `Early start! ✨ ${name ? name + ', ' : ''}morning sessions are literally the best for focus.`
    if (hour >= 22) return `It's late${name ? ' ' + name : ''} 🌙 Get some sleep — a rested brain learns way better than a tired one.`
    if (nearest) return `${nearest.name} in ${nearest.days} days — you've got time, just stay consistent 🌸`
    return `${greeting}${name ? ', ' + name : ''}! Ready to make today count? 🌸`
  }

  const loadProfile = useCallback(async () => {
    // 1. Render instantly from cache
    const cached = localStorage.getItem('bloomProfileCache')
    if (cached) setProfile(JSON.parse(cached))

    // 2. Refresh from Supabase in background
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('name, subjects, plan, streak, growth_points, total_sessions')
      .eq('id', user.id)
      .single()
    if (data) {
      setProfile(data as Profile)
      localStorage.setItem('bloomProfileCache', JSON.stringify(data))
    }
  }, [supabase])

  useEffect(() => { loadProfile() }, [loadProfile])

  useEffect(() => {
    // Check localStorage for Soul+ status
    const soulPlus = localStorage.getItem('bloomSoulPlus') === 'true'
    setIsSoulPlusLocal(soulPlus)
    // Handle redirect from Stripe checkout
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      localStorage.setItem('bloomSoulPlus', 'true')
      setIsSoulPlusLocal(true)
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  useEffect(() => { setBloomieMsg(buildBloomieMsg(profile)) }, [profile])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">
            {greeting}, <span className="glow-text">{profile?.name || '…'}</span> 🌸
          </h1>
          <p className="text-white/50 text-sm">Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        {profile?.plan === 'trial' && !isSoulPlusLocal && (
          <div className="glass px-4 py-2 rounded-xl text-sm">
            <span className="text-amber-400 font-semibold">✨ Soul+ Trial</span>
            <p className="text-white/40 text-xs mt-0.5">7 days remaining</p>
          </div>
        )}
      </div>

      {/* Bloomie chat */}
      <BloomieChat message={bloomieMsg || `${greeting}! Let's make today count 🌸`} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: getStreakEmoji(profile?.streak || 0), label: 'Day Streak', value: profile?.streak || 0, suffix: ' days' },
          { icon: '⚡', label: 'Growth Points', value: profile?.growth_points || 0, suffix: ' XP' },
          { icon: '📚', label: 'Sessions', value: profile?.total_sessions || 0, suffix: '' },
        ].map(stat => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-black">{stat.value}{stat.suffix}</div>
            <div className="text-xs text-white/40 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* XP bar */}
      <div className="card">
        <h3 className="font-bold mb-3">Your Growth</h3>
        <XPBar points={profile?.growth_points || 0} />
      </div>

      {/* Daily Quests */}
      <div>
        <h2 className="text-lg font-bold mb-4">🎯 Daily Quests</h2>
        <div className="flex flex-col gap-3">
          {QUESTS.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card flex items-center gap-4 cursor-pointer hover:border-violet-400/30"
            >
              <span className="text-2xl">{q.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{q.label}</p>
                <p className="text-xs text-violet-400 mt-0.5">+{q.xp} XP</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-white/20" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      {profile?.subjects && profile.subjects.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">📚 Your Subjects</h2>
          <div className="flex flex-wrap gap-2">
            {profile.subjects.map(s => (
              <span key={s} className="px-4 py-2 glass rounded-full text-sm font-medium text-violet-300 border border-violet-400/20">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Study Plan Banner */}
      <a href="/planner" className="block p-5 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/40 rounded-2xl hover:border-violet-400/60 transition-all group">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg mb-1">📅 My Study Plan</div>
            <p className="text-white/50 text-sm">Your daily revision schedule — tap to see today&apos;s sessions</p>
          </div>
          <div className="text-3xl group-hover:scale-110 transition-transform">🌸</div>
        </div>
      </a>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/quiz',     icon: '🧠', label: 'Start Quiz' },
            { href: '/planner/setup',      icon: '📝', label: 'Edit Plan' },
            { href: '/dashboard/pomodoro', icon: '🎧', label: 'Focus Room' },
            { href: '/dashboard/progress', icon: '📈', label: 'My Progress' },
          ].map(a => (
            <a key={a.href} href={a.href}
              className="card text-center hover:border-violet-400/30 hover:bg-violet-500/10 cursor-pointer transition-all"
            >
              <div className="text-3xl mb-2">{a.icon}</div>
              <p className="text-sm font-semibold">{a.label}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Bloomie chat card */}
      <a href="/dashboard/bloomie" className="block p-5 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 rounded-2xl hover:border-violet-400/40 transition-all group">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg mb-1">💜 Talk to Bloomie</div>
            <p className="text-white/50 text-sm">Need to vent? Feeling stressed? Bloomie is here for you.</p>
          </div>
          <div className="text-3xl group-hover:scale-110 transition-transform">🌸</div>
        </div>
      </a>

      {/* Study Wrapped */}
      {/* Soul+ upgrade banner for free users */}
      {!isSoulPlusLocal && (
        <a href="/pricing" className="block p-5 bg-gradient-to-r from-amber-950/50 to-violet-950/50 border border-amber-400/30 rounded-2xl hover:border-amber-400/50 transition-all group">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✨</span>
                <span className="font-bold">Upgrade to Soul+</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-semibold">€9.99/mo</span>
              </div>
              <p className="text-sm text-white/50">Unlock Study Wrapped, Grade Predictor, Weakness Analytics, Focus Rooms & more</p>
            </div>
            <div className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold group-hover:opacity-90 transition-all">
              See plans →
            </div>
          </div>
        </a>
      )}

      {/* Textbooks */}
      <TextbooksWidget />

      {/* Study Wrapped */}
      <StudyPlant />
      <StudyWrapped isSoulPlus={isSoulPlusLocal} />

      {/* Rescue banner */}
      <div className="card border-red-500/30 bg-red-500/5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-red-300">🚨 Exam coming up?</h3>
          <p className="text-sm text-white/50 mt-1">Lock in rescue mode — Bloomie tells you exactly what to revise.</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setRescueMode(true)}>Rescue me</Button>
      </div>

      {rescueMode && (
        <ExamRescue
          onClose={() => setRescueMode(false)}
          subjects={profile?.subjects || []}
        />
      )}
    </div>
  )
}
