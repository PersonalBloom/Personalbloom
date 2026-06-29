'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

const FREE_FEATURES = [
  { icon: '📅', label: 'Smart Study Planner', included: true },
  { icon: '📝', label: 'Notes (up to 3 subjects)', included: true },
  { icon: '🃏', label: 'Flashcards (basic)', included: true },
  { icon: '🚨', label: 'Exam Rescue mode', included: true },
  { icon: '💜', label: 'Bloomie chat', included: true },
  { icon: '🧠', label: 'Quizzes from notes', included: true },
  { icon: '📈', label: 'Grade Predictor', included: false },
  { icon: '🎧', label: 'Focus Rooms (lo-fi + sounds)', included: false },
  { icon: '📊', label: 'Weakness Analytics', included: false },
  { icon: '🎁', label: 'Study Wrapped', included: false },
  { icon: '🔮', label: 'Priority Bloomie AI', included: false },
  { icon: '👑', label: 'Exclusive achievements', included: false },
  { icon: '♾️', label: 'Unlimited notes & subjects', included: false },
  { icon: '🌙', label: 'Offline mode', included: false },
]

const SOUL_FEATURES = FREE_FEATURES.map(f => ({ ...f, included: true }))

const PRAISES = [
  { name: 'Sofia R.', school: 'IB Diploma · France', text: 'Bloomie helped me go from a 5 to a 7 in Math HL. I literally cried. This app is magic.' },
  { name: 'James K.', school: 'A-Levels · UK', text: 'The Exam Rescue feature saved me the night before my Chemistry exam. No joke.' },
  { name: 'Amara T.', school: 'AP · USA', text: 'Soul+ is so worth it. The analytics showed me exactly where I was losing marks.' },
]

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const loggedIn = !!data.user
      setIsLoggedIn(loggedIn)
      // Auto-trigger checkout if redirected back from signup with pending checkout
      const pending = localStorage.getItem('bloomPendingCheckout')
      if (loggedIn && pending) {
        localStorage.removeItem('bloomPendingCheckout')
        const pendingBilling = localStorage.getItem('bloomPendingBilling') || 'monthly'
        localStorage.removeItem('bloomPendingBilling')
        setBilling(pendingBilling as 'monthly' | 'yearly')
        setTimeout(() => triggerCheckout(pendingBilling as 'monthly' | 'yearly'), 300)
      }
    })
  }, [])

  const monthlyPrice = 9.99
  const yearlyPrice = 115
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2)
  const yearlySaving = ((monthlyPrice * 12) - yearlyPrice).toFixed(2)
  const yearlyDiscount = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100)

  async function triggerCheckout(bill: 'monthly' | 'yearly' = billing) {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing: bill, promoCode: promoCode.trim() || undefined }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  function startCheckout() {
    if (!isLoggedIn) {
      // Save intent and send to signup
      localStorage.setItem('bloomPendingCheckout', '1')
      localStorage.setItem('bloomPendingBilling', billing)
      router.push('/auth/signup?redirect=/pricing')
      return
    }
    triggerCheckout()
  }

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute top-1/2 -right-60 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="font-bold text-lg">PersonalBloom</span>
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="text-sm px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">← Dashboard</Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors">Already have an account</Link>
              <Link href="/auth/signup" className="text-sm px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">Sign up free</Link>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/25 text-amber-300 text-sm font-semibold mb-6">
          ✨ Simple, honest pricing
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-5 leading-tight">
          Invest in your<br />
          <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">grades.</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto mb-10">
          Start free. Upgrade when you are ready. Cancel any time — no questions asked.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${billing === 'yearly' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            Yearly
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/25 text-green-400 font-bold">
              -{yearlyDiscount}%
            </span>
          </button>
        </div>
      </motion.section>

      {/* Pricing cards */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* FREE */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
            <div className="mb-6">
              <div className="text-3xl mb-3">🌱</div>
              <h2 className="text-2xl font-bold mb-1">Free</h2>
              <p className="text-white/40 text-sm">For students just getting started</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-black">€0</span>
              <span className="text-white/40 ml-2">/ forever</span>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f.label} className={`flex items-center gap-3 text-sm ${f.included ? 'text-white/80' : 'text-white/20 line-through'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${f.included ? 'bg-green-500/20 text-green-400' : 'bg-white/5'}`}>
                    {f.included ? '✓' : '✕'}
                  </span>
                  <span>{f.icon} {f.label}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/signup"
              className="w-full py-3.5 rounded-2xl border border-white/20 text-white/70 hover:bg-white/10 transition-all text-center font-semibold">
              Get started free →
            </Link>
          </motion.div>

          {/* SOUL+ */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-b from-violet-950/60 to-amber-950/20 border border-amber-400/30 rounded-3xl p-8 flex flex-col overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="text-3xl mb-3">✨</div>
                  <h2 className="text-2xl font-bold mb-1">Soul+</h2>
                  <p className="text-white/50 text-sm">For students who mean business</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                  MOST POPULAR
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                {billing === 'monthly' ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">€9.99</span>
                    <span className="text-white/40">/ month</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black">€{yearlyMonthly}</span>
                      <span className="text-white/40">/ month</span>
                    </div>
                    <div className="text-white/40 text-sm mt-1">billed €{yearlyPrice} per year</div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 text-sm font-semibold">
                    🎉 3-day free trial
                  </div>
                  {billing === 'yearly' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/25 text-amber-300 text-sm font-semibold">
                      💰 Save €{yearlySaving}/year
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-3 flex-1 my-6">
                {SOUL_FEATURES.map(f => (
                  <li key={f.label} className="flex items-center gap-3 text-sm text-white/85">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 bg-amber-500/20 text-amber-400">✓</span>
                    <span>{f.icon} {f.label}</span>
                  </li>
                ))}
              </ul>

              {/* Promo code */}
              <div className="mb-4">
                <button onClick={() => setPromoOpen(p => !p)}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2">
                  {promoOpen ? 'Hide promo code' : 'Have a promo code?'}
                </button>
                {promoOpen && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BLOOM20"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-mono tracking-widest"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={startCheckout}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-amber-500 text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-violet-500/30"
              >
                {loading ? '⏳ Redirecting...' : !isLoggedIn ? '🌸 Sign up & start free trial' : billing === 'yearly' ? '✨ Start my free yearly trial' : '✨ Start my 3-day free trial'}
              </button>
              <p className="mt-3 text-center text-xs text-white/25">
                No charge for 3 days · Cancel anytime · Secured by Stripe
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8 text-white/80">Full comparison</h2>
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 bg-white/5 px-6 py-3 text-xs font-semibold text-white/40 uppercase tracking-widest">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center text-amber-400">Soul+</span>
          </div>
          {FREE_FEATURES.map((f, i) => (
            <div key={f.label} className={`grid grid-cols-3 px-6 py-4 text-sm border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
              <span className="text-white/70">{f.icon} {f.label}</span>
              <span className="text-center">{f.included ? <span className="text-green-400">✓</span> : <span className="text-white/20">—</span>}</span>
              <span className="text-center text-amber-400">✓</span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10 text-white/80">What students say</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PRAISES.map(p => (
            <motion.div key={p.name}
              initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-sm text-white/70 leading-relaxed mb-4">&ldquo;{p.text}&rdquo;</p>
              <div>
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-white/30">{p.school}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8 text-white/80">FAQ</h2>
        <div className="space-y-4">
          {[
            ['Can I cancel any time?', 'Yes — cancel with one click from your account settings. No fees, no drama.'],
            ['Will I be charged during the trial?', 'Nope. Your card is not charged until day 4. If you cancel before that, you pay nothing.'],
            ['What happens to my data if I cancel?', 'Your notes, flashcards, and plan stay in your account on the Free plan.'],
            ['Do promo codes work on top of the trial?', 'Yes — enter your code at checkout to get an additional discount on your first month.'],
            ['Is there a student discount?', 'Yes! Use code STUDENT15 for 15% off every month.'],
            ['What is the difference between monthly and yearly?', `With the yearly plan you pay €${yearlyPrice} once a year instead of €${(monthlyPrice * 12).toFixed(0)} — you save €${yearlySaving}.`],
          ].map(([q, a]) => (
            <details key={q} className="group bg-white/5 border border-white/10 rounded-2xl px-6 py-4 cursor-pointer">
              <summary className="font-semibold text-sm list-none flex items-center justify-between">
                {q}
                <span className="text-white/30 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-sm text-white/50 mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/20">
        <div className="flex flex-wrap justify-center gap-6 mb-3">
          <Link href="/" className="hover:text-white/50 transition-colors">Home</Link>
          <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
        </div>
        <p>© 2026 PersonalBloom · Payments secured by Stripe</p>
      </footer>
    </main>
  )
}
