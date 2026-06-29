// ─── XP & Plant growth system ─────────────────────────────────────────────

export type PlantStage = {
  level: number
  emoji: string
  name: string
  minXP: number
}

export const PLANT_STAGES: PlantStage[] = [
  { level: 0, emoji: '🌰', name: 'Seed',        minXP: 0   },
  { level: 1, emoji: '🌱', name: 'Sprout',      minXP: 30  },
  { level: 2, emoji: '🪴', name: 'Seedling',    minXP: 80  },
  { level: 3, emoji: '🌿', name: 'Young plant', minXP: 180 },
  { level: 4, emoji: '🌸', name: 'Flowering',   minXP: 320 },
  { level: 5, emoji: '🌺', name: 'Blooming',    minXP: 500 },
  { level: 6, emoji: '🌳', name: 'Full tree',   minXP: 750 },
]

export type Achievement = {
  id: string
  emoji: string
  title: string
  desc: string
  xpReward: number
  secret?: boolean
  unlocksSoulPlus?: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_session',   emoji: '🌱', title: 'First Bloom',      desc: 'Complete your first study session',            xpReward: 10  },
  { id: 'first_note',      emoji: '📝', title: 'Note Taker',        desc: 'Add your first note',                          xpReward: 5   },
  { id: 'first_flashcard', emoji: '🃏', title: 'Flash!',            desc: 'Complete your first flashcard session',        xpReward: 15  },
  { id: 'streak_3',        emoji: '🔥', title: 'Three Day Streak',  desc: 'Study 3 days in a row',                        xpReward: 30  },
  { id: 'streak_7',        emoji: '⚡', title: 'Week Warrior',      desc: 'Study 7 days in a row',                        xpReward: 75  },
  { id: 'sessions_5',      emoji: '💪', title: 'Getting Serious',   desc: 'Complete 5 study sessions',                    xpReward: 25  },
  { id: 'sessions_25',     emoji: '🏃', title: 'Study Machine',     desc: 'Complete 25 study sessions',                   xpReward: 60  },
  { id: 'sessions_100',    emoji: '🏆', title: 'Legend',            desc: 'Complete 100 study sessions',                  xpReward: 200 },
  { id: 'flashcards_50',   emoji: '🧠', title: 'Card Master',       desc: 'Review 50 flashcards',                         xpReward: 40  },
  { id: 'notes_10',        emoji: '📚', title: 'Bookworm',          desc: 'Add 10 notes',                                 xpReward: 30  },
  { id: 'all_today',       emoji: '✅', title: 'Perfect Day',       desc: 'Complete all study sessions in one day',       xpReward: 35  },
  { id: 'night_owl',       emoji: '🦉', title: 'Night Owl',         desc: 'Study after 10 PM',                            xpReward: 20, secret: true },
  { id: 'early_bird',      emoji: '🐦', title: 'Early Bird',        desc: 'Study before 7 AM',                            xpReward: 20, secret: true },
  { id: 'exam_survivor',   emoji: '🎓', title: 'Exam Survivor',     desc: 'Mark a subject as done on exam day',           xpReward: 50  },
  { id: 'soul_seeker',     emoji: '✨', title: 'Soul Seeker',       desc: 'Reach 500 XP — Soul+ unlocked for free!',      xpReward: 0,  unlocksSoulPlus: true },
]

// ─── Persistence ──────────────────────────────────────────────────────────

export type GameState = {
  xp: number
  totalSessions: number
  totalFlashcards: number
  totalNotes: number
  studyDates: string[]         // ISO date strings of days with any session
  achievements: string[]       // unlocked achievement IDs
  lastUpdated: string
}

const DEFAULT_STATE: GameState = {
  xp: 0,
  totalSessions: 0,
  totalFlashcards: 0,
  totalNotes: 0,
  studyDates: [],
  achievements: [],
  lastUpdated: new Date().toISOString(),
}

export function loadGameState(): GameState {
  if (typeof window === 'undefined') return DEFAULT_STATE
  try {
    const saved = localStorage.getItem('bloomGame')
    if (!saved) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...JSON.parse(saved) }
  } catch { return DEFAULT_STATE }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return
  state.lastUpdated = new Date().toISOString()
  localStorage.setItem('bloomGame', JSON.stringify(state))
}

// ─── Plant stage helpers ───────────────────────────────────────────────────

export function getPlantStage(xp: number): PlantStage {
  let stage = PLANT_STAGES[0]
  for (const s of PLANT_STAGES) {
    if (xp >= s.minXP) stage = s
    else break
  }
  return stage
}

export function getNextStage(xp: number): PlantStage | null {
  const current = getPlantStage(xp)
  const next = PLANT_STAGES.find(s => s.minXP > xp)
  return next || null
}

export function getXPToNextStage(xp: number): number {
  const next = getNextStage(xp)
  return next ? next.minXP - xp : 0
}

export function getStageProgress(xp: number): number {
  const current = getPlantStage(xp)
  const next = getNextStage(xp)
  if (!next) return 100
  const range = next.minXP - current.minXP
  const progress = xp - current.minXP
  return Math.round((progress / range) * 100)
}

// ─── Streak helpers ────────────────────────────────────────────────────────

export function getCurrentStreak(studyDates: string[]): number {
  if (studyDates.length === 0) return 0
  const sorted = [...new Set(studyDates)].sort().reverse()
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diff === 1) streak++
    else break
  }
  return streak
}

// ─── Award XP + check achievements ────────────────────────────────────────

export type XPEvent = 'session_complete' | 'all_day_complete' | 'flashcard_session' | 'note_added' | 'exam_survived'

export type AwardResult = {
  xpGained: number
  newAchievements: Achievement[]
  soulPlusUnlocked: boolean
  newState: GameState
}

const XP_FOR_EVENT: Record<XPEvent, number> = {
  session_complete:   10,
  all_day_complete:   20,
  flashcard_session:  15,
  note_added:         5,
  exam_survived:      50,
}

export function awardXP(event: XPEvent, extra?: { flashcardsReviewed?: number }): AwardResult {
  const state = loadGameState()
  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const newAchievements: Achievement[] = []

  // Add XP
  const xpGained = XP_FOR_EVENT[event]
  state.xp += xpGained

  // Update counters
  if (event === 'session_complete') {
    state.totalSessions++
    if (!state.studyDates.includes(today)) state.studyDates.push(today)
  }
  if (event === 'flashcard_session') {
    state.totalFlashcards += (extra?.flashcardsReviewed || 10)
  }
  if (event === 'note_added') {
    state.totalNotes++
  }

  // Check achievements
  const unlock = (id: string) => {
    if (!state.achievements.includes(id)) {
      const ach = ACHIEVEMENTS.find(a => a.id === id)
      if (ach) {
        state.achievements.push(id)
        state.xp += ach.xpReward
        newAchievements.push(ach)
      }
    }
  }

  if (event === 'session_complete' && state.totalSessions === 1) unlock('first_session')
  if (event === 'session_complete' && state.totalSessions >= 5)  unlock('sessions_5')
  if (event === 'session_complete' && state.totalSessions >= 25) unlock('sessions_25')
  if (event === 'session_complete' && state.totalSessions >= 100) unlock('sessions_100')
  if (event === 'all_day_complete') unlock('all_today')
  if (event === 'flashcard_session' && !state.achievements.includes('first_flashcard')) unlock('first_flashcard')
  if (event === 'flashcard_session' && state.totalFlashcards >= 50) unlock('flashcards_50')
  if (event === 'note_added' && state.totalNotes === 1) unlock('first_note')
  if (event === 'note_added' && state.totalNotes >= 10) unlock('notes_10')
  if (event === 'exam_survived') unlock('exam_survivor')
  if (event === 'session_complete' && hour >= 22) unlock('night_owl')
  if (event === 'session_complete' && hour < 7)  unlock('early_bird')

  // Streak achievements
  const streak = getCurrentStreak(state.studyDates)
  if (streak >= 3) unlock('streak_3')
  if (streak >= 7) unlock('streak_7')

  // Soul+ at 500 XP
  let soulPlusUnlocked = false
  if (state.xp >= 500 && !state.achievements.includes('soul_seeker')) {
    unlock('soul_seeker')
    soulPlusUnlocked = true
    // Actually set Soul+ in localStorage
    localStorage.setItem('bloomSoulPlus', 'true')
  }

  saveGameState(state)
  return { xpGained, newAchievements, soulPlusUnlocked, newState: state }
}
