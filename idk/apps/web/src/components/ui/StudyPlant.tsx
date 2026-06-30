'use client'

import { useState, useEffect } from 'react'
import { loadGameState, getPlantStage, getStageProgress, getXPToNextStage, getCurrentStreak, ACHIEVEMENTS, GameState, Achievement } from '@/lib/gamification'

export default function StudyPlant() {
  const [state, setState] = useState<GameState | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null)

  useEffect(() => {
    setState(loadGameState())

    // Listen for XP updates from other parts of the app
    const handler = (e: CustomEvent) => {
      setState(loadGameState())
      if (e.detail?.newAchievements?.length > 0) {
        setNewUnlock(e.detail.newAchievements[0])
        setTimeout(() => setNewUnlock(null), 4000)
      }
    }
    window.addEventListener('bloomXP' as any, handler as any)
    return () => window.removeEventListener('bloomXP' as any, handler as any)
  }, [])

  if (!state) return null

  const plant = getPlantStage(state.xp)
  const progress = getStageProgress(state.xp)
  const toNext = getXPToNextStage(state.xp)
  const streak = getCurrentStreak(state.studyDates)
  const unlockedAchs = ACHIEVEMENTS.filter(a => state.achievements.includes(a.id))
  const totalAchs = ACHIEVEMENTS.filter(a => !a.secret).length

  return (
    <>
      {/* Achievement unlock toast */}
      {newUnlock && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl shadow-2xl animate-bounce">
          <span className="text-2xl">{newUnlock.emoji}</span>
          <div>
            <div className="text-xs text-white/70 font-medium">Achievement unlocked!</div>
            <div className="text-sm font-bold text-white">{newUnlock.title}</div>
          </div>
        </div>
      )}

      <div className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-sm text-white">Your Study Plant</div>
            <div className="text-xs text-white/40">{plant.name} · {state.xp} XP total</div>
          </div>
          <button
            onClick={() => setShowAchievements(true)}
            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white/60"
          >
            🏆 {unlockedAchs.length}/{totalAchs}
          </button>
        </div>

        {/* Plant display */}
        <div className="flex items-end gap-4 mb-4">
          <div className="relative flex flex-col items-center">
            {/* Plant emoji with size scaling */}
            <div
              className="transition-all duration-1000 select-none"
              style={{ fontSize: `${2.5 + plant.level * 0.5}rem`, filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.4))' }}
            >
              {plant.emoji}
            </div>
            {/* Soil base */}
            <div className="w-16 h-2 bg-gradient-to-r from-amber-800/40 to-amber-700/40 rounded-full mt-1" />
          </div>

          <div className="flex-1">
            {/* XP bar to next stage */}
            {toNext > 0 ? (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>Next: {getPlantStage(state.xp + toNext)?.emoji}</span>
                  <span>{toNext} XP to go</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-emerald-400 mb-2 font-semibold">🌳 Max level reached!</div>
            )}

            {/* Stats row */}
            <div className="flex gap-4 text-xs text-white/50">
              <span>🔥 {streak} day streak</span>
              <span>📚 {state.totalSessions} sessions</span>
            </div>
          </div>
        </div>


      </div>

      {/* Achievements modal */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAchievements(false)}>
          <div className="bg-[#12101f] border border-white/10 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">🏆 Achievements</h2>
              <button onClick={() => setShowAchievements(false)} className="text-white/40 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {ACHIEVEMENTS.filter(a => !a.secret || state.achievements.includes(a.id)).map(ach => {
                const unlocked = state.achievements.includes(ach.id)
                return (
                  <div key={ach.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    unlocked ? 'border-violet-500/30 bg-violet-500/10' : 'border-white/5 bg-white/3 opacity-50'
                  }`}>
                    <span className="text-2xl">{unlocked ? ach.emoji : '🔒'}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-white/40'}`}>{ach.title}</div>
                      <div className="text-xs text-white/40">{ach.desc}</div>
                    </div>
                    <div className="text-xs text-violet-400 font-bold">+{ach.xpReward} XP</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-center text-sm text-white/40">
              {unlockedAchs.length}/{totalAchs} unlocked · {state.xp} XP total
            </div>
          </div>
        </div>
      )}
    </>
  )
}
