'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isSoulPlus, setIsSoulPlus] = useState(false)
  const [activeTab, setActiveTab] = useState<'account' | 'subscription' | 'data'>('account')

  // Account form
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  // Subscription
  const [cancelling, setCancelling] = useState(false)
  const [cancelDone, setCancelDone] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Data
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      setDisplayName(user.user_metadata?.name || user.email?.split('@')[0] || '')
    })
    setIsSoulPlus(localStorage.getItem('bloomSoulPlus') === 'true')
  }, [])

  async function saveName() {
    if (!displayName.trim()) return
    setSavingName(true)
    await supabase.auth.updateUser({ data: { name: displayName.trim() } })
    setSavingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2500)
  }

  async function cancelSubscription() {
    setCancelling(true)
    setCancelError('')
    try {
      // Get subscription ID from Stripe customer portal or stored value
      const subId = localStorage.getItem('bloomSubscriptionId')
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: subId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCancelDone(true)
      setShowCancelConfirm(false)
    } catch (err: any) {
      // If no subscription ID stored, show the Stripe portal fallback
      setCancelError("We couldn't find your subscription automatically. Please email us at support@personalbloom.app and we'll cancel and refund you within 24 hours.")
    } finally {
      setCancelling(false)
    }
  }

  function clearAllData() {
    const keysToKeep = ['bloomSoulPlus'] // keep Soul+ status
    const keys = Object.keys(localStorage).filter(k => k.startsWith('bloom'))
    keys.forEach(k => { if (!keysToKeep.includes(k)) localStorage.removeItem(k) })
    setCleared(true)
  }

  async function deleteAccount() {
    if (!confirm('Are you sure? This will sign you out and delete all your local data. Your account will be flagged for deletion.')) return
    clearAllData()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-1">⚙️ Settings</h1>
        <p className="text-white/40 text-sm">Manage your account, subscription, and data</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
        {([
          { id: 'account',      label: '👤 Account' },
          { id: 'subscription', label: '✨ Subscription' },
          { id: 'data',         label: '🗂️ Data' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-violet-500 text-white' : 'text-white/50 hover:text-white'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Account ── */}
      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <h2 className="font-bold">Profile</h2>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Email</label>
              <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 select-all">
                {user?.email}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Display name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                />
                <button onClick={saveName} disabled={savingName}
                  className="px-4 py-2.5 bg-violet-500 hover:bg-violet-600 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  {nameSaved ? '✓ Saved' : savingName ? '...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="font-bold mb-1">Password</h2>
            <p className="text-sm text-white/40 mb-4">We'll send a password reset link to your email.</p>
            <button
              onClick={() => supabase.auth.resetPasswordForEmail(user?.email || '')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-all"
            >
              Send reset link
            </button>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="font-bold mb-1">Sign out</h2>
            <p className="text-sm text-white/40 mb-4">Your data stays saved on this device.</p>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white/70 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Subscription ── */}
      {activeTab === 'subscription' && (
        <div className="space-y-4">
          {/* Current plan */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="font-bold mb-3">Current Plan</h2>
            {isSoulPlus ? (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 rounded-xl">
                <span className="text-3xl">✨</span>
                <div>
                  <div className="font-bold text-violet-300">Soul+ Active</div>
                  <div className="text-xs text-white/50 mt-0.5">Full access to all features</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-3xl">🌱</span>
                <div>
                  <div className="font-bold">Free Plan</div>
                  <div className="text-xs text-white/50 mt-0.5">Upgrade to Soul+ for unlimited access</div>
                </div>
                <a href="/pricing" className="ml-auto px-3 py-1.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl text-xs font-bold text-white">Upgrade</a>
              </div>
            )}
          </div>

          {/* Cancel */}
          {isSoulPlus && (
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="font-bold mb-1">Cancel Subscription</h2>
              <p className="text-sm text-white/40 mb-4">
                You'll keep Soul+ access until the end of your current billing period. No charges after that.
              </p>

              {cancelDone ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-400">
                  ✓ Subscription cancelled. You'll keep access until your billing period ends.
                </div>
              ) : cancelError ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300">
                  {cancelError}
                </div>
              ) : !showCancelConfirm ? (
                <button onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 transition-all"
                >
                  Cancel subscription
                </button>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
                  <p className="text-sm text-white/70 font-medium">Are you sure you want to cancel?</p>
                  <div className="flex gap-2">
                    <button onClick={cancelSubscription} disabled={cancelling}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                    >{cancelling ? 'Cancelling...' : 'Yes, cancel'}</button>
                    <button onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white/70 transition-all"
                    >Keep Soul+</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Refund */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="font-bold mb-1">Refund Request</h2>
            <p className="text-sm text-white/40 mb-4">
              If you were charged and want a refund, email us within 7 days of your charge and we'll process it immediately.
            </p>
            <a
              href={`mailto:support@personalbloom.app?subject=Refund Request&body=Hi, I'd like to request a refund for my Soul+ subscription. My account email is: ${user?.email || ''}`}
              className="inline-block px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-all"
            >
              📧 Email us for a refund
            </a>
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="font-bold mb-1">Your Data</h2>
            <p className="text-sm text-white/40 mb-4">
              All your notes, plans, flashcards, and progress are stored locally on this device. Nothing is uploaded to our servers except your account email.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Study plan', key: 'bloomPlan' },
                { label: 'Notes', key: 'bloomNotes' },
                { label: 'Textbooks', key: 'bloomTextbooks' },
                { label: 'Game progress', key: 'bloomGame' },
              ].map(({ label, key }) => {
                const has = typeof window !== 'undefined' && !!localStorage.getItem(key)
                return (
                  <div key={key} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className={has ? 'text-green-400' : 'text-white/20'}>●</span>
                    <span className={has ? 'text-white/70' : 'text-white/30'}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="font-bold mb-1">Clear All Data</h2>
            <p className="text-sm text-white/40 mb-4">
              Removes your study plan, notes, flashcards, and progress from this device. Your account stays active.
            </p>
            {cleared ? (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-sm text-green-400">✓ Data cleared</div>
            ) : (
              <button onClick={clearAllData}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 transition-all"
              >
                Clear all local data
              </button>
            )}
          </div>

          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
            <h2 className="font-bold text-red-400 mb-1">Delete Account</h2>
            <p className="text-sm text-white/40 mb-4">
              Signs you out and clears all local data. Your account will be permanently deleted within 30 days. This cannot be undone.
            </p>
            <button onClick={deleteAccount}
              className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-sm font-medium text-red-400 transition-all"
            >
              Delete my account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
