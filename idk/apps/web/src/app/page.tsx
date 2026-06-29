'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BloomieAvatar } from '@/components/ui/Bloomie'
import { Button } from '@/components/ui/Button'

const features = [
  { icon: '📅', title: 'Smart Planner', desc: 'AI builds your perfect study schedule around your subjects and exams.' },
  { icon: '🧠', title: 'Quiz & Flashcards', desc: 'Test yourself with spaced repetition. Bloomie tracks your weak spots.' },
  { icon: '🏆', title: 'Growth System', desc: 'Earn XP, unlock achievements, and keep your streak alive.' },
  { icon: '🚨', title: 'Exam Rescue', desc: 'Panic mode: drop your date and get an emergency study plan instantly.' },
  { icon: '🎧', title: 'Focus Rooms', desc: 'Lo-fi beats, rain sounds, and binaural tones to get in the zone.' },
  { icon: '📊', title: 'Grade Predictor', desc: 'Enter your grades and see exactly what you need to hit your target.' },
]

const souls = [
  '📈 Grade Predictor',
  '🎁 Study Wrapped',
  '🎧 Focus Rooms',
  '📊 Weakness Analytics',
  '👑 Exclusive achievements',
  '🔮 Priority Bloomie AI',
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-pink-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-violet-800/15 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="font-bold text-lg glow-text">PersonalBloom</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-8">
            <BloomieAvatar size="xl" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Study smarter.<br />
            <span className="glow-text">Bloom every day.</span>
          </h1>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Meet Bloomie — your AI study companion. She tracks your progress,
            rescues you before exams, and makes studying actually fun.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                🌸 Start blooming — it&apos;s free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                I already have an account
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/30">
            No credit card needed · 3-day Soul+ trial included
          </p>
        </motion.div>
      </section>

      {/* Social proof */}
      <section className="py-10 border-y border-white/8">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-center">
          {[
            ['🌍', '150+ countries', 'Students from everywhere'],
            ['⭐', '4.9 / 5', 'Average rating'],
            ['📚', '2M+ sessions', 'Study sessions logged'],
          ].map(([icon, stat, label]) => (
            <div key={stat}>
              <div className="text-3xl mb-1">{icon}</div>
              <div className="text-2xl font-black glow-text">{stat}</div>
              <div className="text-sm text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-black text-center mb-4">
          Everything you need to <span className="glow-text">ace it</span>
        </h2>
        <p className="text-center text-white/50 mb-16 max-w-xl mx-auto">
          Built for students who are serious about results but tired of boring tools.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card hover:border-violet-400/30 cursor-default"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Soul+ section */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong p-10 text-center relative overflow-hidden"
        >
          {/* Gold glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 -z-0" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-sm font-semibold mb-6">
              ✨ Soul+ — Premium
            </div>
            <h2 className="text-4xl font-black mb-4">
              Unlock the full <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Bloom</span>
            </h2>
            <p className="text-white/60 mb-10 max-w-xl mx-auto">
              Soul+ gives you the power tools that top students use. One small upgrade, massive results.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10 text-left">
              {souls.map(s => (
                <div key={s} className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-xl px-4 py-3 text-sm">
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <Link href="/auth/signup">
              <Button variant="soul" size="lg">
                ✨ Try Soul+ free for 3 days
              </Button>
            </Link>
            <p className="mt-3 text-xs text-white/30">Then just $9.99/month. Cancel anytime.</p>
          </div>
        </motion.div>
      </section>

      {/* Bloomie CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-32 text-center">
        <BloomieAvatar size="lg" className="mx-auto mb-6" />
        <h2 className="text-4xl font-black mb-4">Bloomie is waiting for you 🌸</h2>
        <p className="text-white/50 mb-8">Join thousands of students who study smarter every day.</p>
        <Link href="/auth/signup">
          <Button size="lg">Create your free account →</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 text-center text-sm text-white/30">
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <a href="mailto:hello@personalbloom.app" className="hover:text-white/60 transition-colors">Contact</a>
        </div>
        <p>© 2026 PersonalBloom · Made with 🌸 for students</p>
      </footer>
    </main>
  )
}
