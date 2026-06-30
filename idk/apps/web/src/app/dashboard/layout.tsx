'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { BloomieAvatar } from '@/components/ui/Bloomie'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const NAV = [
  { href: '/dashboard',              icon: '🏠', label: 'Home' },
  { href: '/planner',                icon: '📅', label: 'Planner' },
  { href: '/dashboard/notes',        icon: '📝', label: 'Notes' },
  { href: '/dashboard/flashcards',   icon: '🃏', label: 'Flashcards' },
  { href: '/dashboard/quiz',         icon: '🧠', label: 'Quiz' },
  { href: '/dashboard/bloomie',      icon: '💜', label: 'Bloomie' },
  { href: '/dashboard/pomodoro',     icon: '🎧', label: 'Focus' },
  { href: '/dashboard/progress',     icon: '📊', label: 'Progress' },
  { href: '/dashboard/grade-predictor', icon: '📈', label: 'Grades' },
  { href: '/pricing',                icon: '✨', label: 'Soul+' },
  { href: '/dashboard/settings',    icon: '⚙️', label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUser(user)
    // Only the creator gets Soul+ free
    if (user.email === 'augustinduha67@gmail.com') {
      localStorage.setItem('bloomSoulPlus', 'true')
    } else {
      // Check Supabase plan — clear stale Soul+ for anyone who hasn't paid
      const { data: profile } = await supabase.from('profiles').select('plan, stripe_subscription_id').eq('id', user.id).single()
      if (profile?.plan === 'soul_plus') {
        localStorage.setItem('bloomSoulPlus', 'true')
        if (profile?.stripe_subscription_id) {
          localStorage.setItem('bloomSubscriptionId', profile.stripe_subscription_id)
        }
      } else {
        // Also honour XP-earned Soul+ (20,900 XP milestone)
        const game = (() => { try { return JSON.parse(localStorage.getItem('bloomGame') || '{}') } catch { return {} } })()
        const earnedByXP = (game.xp || 0) >= 20900
        if (earnedByXP) {
          localStorage.setItem('bloomSoulPlus', 'true')
        } else {
          localStorage.removeItem('bloomSoulPlus')
          localStorage.removeItem('bloomSubscriptionId')
        }
        // Downgrade any lingering trial accounts to free
        if (profile?.plan === 'trial') {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', user.id)
        }
      }
    }
  }, [supabase, router])

  useEffect(() => { checkUser() }, [checkUser])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/8 p-6 gap-2 fixed h-full">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <span className="text-2xl">🌸</span>
          <span className="font-bold text-lg glow-text">PersonalBloom</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all',
                pathname === item.href
                  ? 'bg-violet-500/20 text-white border border-violet-400/30'
                  : item.href === '/pricing'
                  ? 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10'
                  : 'text-white/50 hover:text-white hover:bg-white/8',
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="border-t border-white/8 pt-4 mt-4">
            <div className="flex items-center gap-3 px-4 py-3">
              <BloomieAvatar size="sm" animate={false} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.user_metadata?.name || 'You'}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-2 text-sm text-white/40 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
            >
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-8">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="p-6 max-w-5xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile bottom nav — show most important only */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-white/10 bg-bloom-dark/95 backdrop-blur-xl flex overflow-x-auto">
        {NAV.slice(0, 6).map(item => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors min-w-[60px]',
              pathname === item.href ? 'text-violet-400' : 'text-white/40',
            )}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
