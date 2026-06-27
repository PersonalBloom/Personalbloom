'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { BloomieChat } from '@/components/ui/Bloomie'
import { Button } from '@/components/ui/Button'
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

export default function DashboardHome() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hour] = useState(new Date().getHours())

  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const bloomieMsgs = [
    `${greeting}! Ready to learn something amazing today? 🌸`,
    "Your streak is on fire! Keep it going bestie! 🔥",
    "You've got this! One session at a time 💪✨",
    "Let's make today count! Bloomie believes in you 🌟",
  ]

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('name, subjects, plan, streak, growth_points, total_sessions')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data as Profile)
  }, [supabase])

  useEffect(() => { loadProfile() }, [loadProfile])

  const msg = bloomieMsgs[Math.floor(Math.random() * bloomieMsgs.length)]

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
        {profile?.plan === 'trial' && (
          <div className="glass px-4 py-2 rounded-xl text-sm">
            <span className="text-amber-400 font-semibold">✨ Soul+ Trial</span>
            <p className="text-white/40 text-xs mt-0.5">7 days remaining</p>
          </div>
        )}
      </div>

      {/* Bloomie chat */}
      <BloomieChat message={msg} />

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

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-bold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/quiz',     icon: '🧠', label: 'Start Quiz' },
            { href: '/dashboard/planner',  icon: '📅', label: 'Add Task' },
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

      {/* Rescue banner */}
      <div className="card border-red-500/30 bg-red-500/5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-red-300">🚨 Exam coming up?</h3>
          <p className="text-sm text-white/50 mt-1">Drop your date and Bloomie builds your rescue plan.</p>
        </div>
        <Button variant="danger" size="sm">Rescue me</Button>
      </div>
    </div>
  )
}
