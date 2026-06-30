'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { BloomieAvatar, BloomieChat } from '@/components/ui/Bloomie'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const SCHOOL_SYSTEMS = [
  { id: 'ib_dp', label: 'IB Diploma (DP)', emoji: '🎓' },
  { id: 'ib_myp', label: 'IB Middle Years (MYP)', emoji: '📚' },
  { id: 'gcse', label: 'GCSE / A-Levels', emoji: '🇬🇧' },
  { id: 'ap', label: 'AP / US High School', emoji: '🇺🇸' },
  { id: 'french_bac', label: 'Baccalauréat', emoji: '🇫🇷' },
  { id: 'university', label: 'University', emoji: '🏛️' },
  { id: 'other', label: 'Other', emoji: '🌍' },
]

const COMMON_SUBJECTS = ['Math', 'English', 'Science', 'History', 'Biology', 'Chemistry',
  'Physics', 'French', 'Spanish', 'Art', 'Music', 'Economics', 'Psychology', 'Computer Science']

const BLOOMIE_MSGS = [
  "Hi! I'm Bloomie 🌸 I'm going to be your personal study buddy! What should I call you?",
  "So nice to meet you! Which school system are you in? This helps me tailor everything for you~",
  "Awesome! Now pick the subjects you're studying. Add as many as you want!",
  "You're all set! Let's start blooming together 🌸✨",
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [system, setSystem] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleSubject(s: string) {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function addCustom() {
    const s = customSubject.trim()
    if (s && !subjects.includes(s)) { setSubjects(prev => [...prev, s]); setCustomSubject('') }
  }

  async function finish() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email!,
        name,
        school_system: system,
        subjects,
        plan: 'free',
        growth_points: 0,
        streak: 0,
        total_sessions: 0,
      })
    }
    router.push('/dashboard')
  }

  const canNext = [
    name.trim().length > 0,
    system.length > 0,
    subjects.length > 0,
    true,
  ][step]

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-3xl" />
      </div>

      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-violet-400' : i < step ? 'w-2 bg-violet-600' : 'w-2 bg-white/15'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="glass-strong p-8"
          >
            <BloomieChat message={BLOOMIE_MSGS[step]} className="mb-8" />

            {step === 0 && (
              <div className="flex flex-col gap-4">
                <Input
                  label="Your name"
                  placeholder="What do your friends call you?"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext && setStep(1)}
                  autoFocus
                />
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {SCHOOL_SYSTEMS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSystem(s.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      system === s.id
                        ? 'border-violet-400 bg-violet-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {COMMON_SUBJECTS.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        subjects.includes(s)
                          ? 'bg-violet-500/30 border-violet-400 text-white'
                          : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {subjects.includes(s) ? '✓ ' : '+ '}{s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom subject..."
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustom()}
                    className="flex-1"
                  />
                  <Button variant="ghost" onClick={addCustom} className="shrink-0">Add</Button>
                </div>
                {subjects.length > 0 && (
                  <p className="text-sm text-violet-400">{subjects.length} subject{subjects.length > 1 ? 's' : ''} selected ✓</p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="text-center">
                <BloomieAvatar size="xl" className="mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-3">You're ready to bloom! 🌸</h2>
                <p className="text-white/60 mb-6">
                  Welcome, <strong className="text-white">{name}</strong>! You are on the free plan. Upgrade to Soul+ anytime to unlock everything. 🌸
                </p>
                <div className="glass p-4 rounded-xl text-left mb-6 space-y-2">
                  <p className="text-sm text-white/50">📚 Subjects: <span className="text-white">{subjects.join(', ')}</span></p>
                  <p className="text-sm text-white/50">🎓 System: <span className="text-white">{SCHOOL_SYSTEMS.find(s => s.id === system)?.label}</span></p>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 0
                ? <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Button>
                : <div />
              }
              {step < 3
                ? <Button onClick={() => setStep(s => s + 1)} disabled={!canNext}>Next →</Button>
                : <Button onClick={finish} loading={saving} size="lg">Let's go! 🌸</Button>
              }
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
