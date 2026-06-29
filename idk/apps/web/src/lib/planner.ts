export type PlanSubject = {
  id: string
  name: string
  examDate: string
  color: string
  priority: 'high' | 'medium' | 'low'
  isDaily?: boolean
  topics?: string[] // extracted from notes
}

export type StudyTask = {
  id: string
  subjectId: string
  subjectName: string
  subjectColor: string
  date: string
  durationMinutes: number
  sessionLabel: string
  sessionType: 'review' | 'flashcards' | 'practice' | 'past_paper' | 'deep_dive' | 'active_recall' | 'summary' | 'timed'
  topic?: string // specific topic from notes
  done: boolean
}

const SUBJECT_COLORS = [
  '#A78BFA', '#F472B6', '#34D399', '#60A5FA', '#FBBF24',
  '#F87171', '#A3E635', '#38BDF8', '#C084FC', '#FB923C',
]

export function assignColors(subjects: { id: string }[]): Record<string, string> {
  const map: Record<string, string> = {}
  subjects.forEach((s, i) => { map[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length] })
  return map
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)))
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ─── Topic extraction from raw notes ───────────────────────────────────────
export function extractTopicsFromNotes(notes: string, subjectName: string): string[] {
  if (!notes || !notes.trim()) return []
  const topics: string[] = []
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean)

  // Find section relevant to this subject (look 10 lines after subject name mention)
  let relevantLines: string[] = []
  let inSubjectSection = false
  let linesAfter = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const subjectMatch = line.toLowerCase().includes(subjectName.toLowerCase())
    if (subjectMatch) {
      inSubjectSection = true
      linesAfter = 0
      continue
    }
    if (inSubjectSection) {
      linesAfter++
      // Stop if we hit another subject header or after 20 lines
      if (linesAfter > 20) { inSubjectSection = false }
      else relevantLines.push(line)
    }
  }

  // If no subject section found, use all lines
  const sourceLines = relevantLines.length > 3 ? relevantLines : lines

  for (const line of sourceLines) {
    // "Term: definition" → extract term
    const colonMatch = line.match(/^(.+?):\s*.{5,}/)
    if (colonMatch) {
      const term = colonMatch[1].replace(/^[-•*#\d.]+\s*/, '').trim()
      if (term.length > 2 && term.length < 60) topics.push(term)
      continue
    }
    // Bullet / numbered list items
    const bulletMatch = line.match(/^[-•*\d.]+\s+(.+)/)
    if (bulletMatch) {
      const item = bulletMatch[1].trim()
      if (item.length > 3 && item.length < 80) topics.push(item)
      continue
    }
    // Short lines that look like headings (all caps, title case, or very short)
    if (line.length < 50 && line.length > 3 && !line.includes('  ')) {
      const wordCount = line.split(' ').length
      if (wordCount <= 6) topics.push(line.replace(/^#+\s*/, ''))
    }
  }

  // Deduplicate and limit
  const seen = new Set<string>()
  return topics.filter(t => {
    const key = t.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 20)
}

// ─── Smart session label based on urgency + topic ──────────────────────────
type SessionType = StudyTask['sessionType']

function getSessionType(daysLeft: number, sessionIndex: number, totalSessions: number): SessionType {
  // Near exam: heavy on testing yourself
  if (daysLeft <= 3) {
    const types: SessionType[] = ['past_paper', 'timed', 'active_recall', 'past_paper']
    return types[sessionIndex % types.length]
  }
  // 4-10 days: mix of review and practice
  if (daysLeft <= 10) {
    const types: SessionType[] = ['review', 'practice', 'flashcards', 'active_recall', 'past_paper']
    return types[sessionIndex % types.length]
  }
  // 10-21 days: build understanding
  if (daysLeft <= 21) {
    const types: SessionType[] = ['deep_dive', 'review', 'flashcards', 'practice', 'summary']
    return types[sessionIndex % types.length]
  }
  // Far out: explore and understand
  const types: SessionType[] = ['deep_dive', 'summary', 'review', 'flashcards', 'active_recall']
  return types[sessionIndex % types.length]
}

function buildLabel(type: SessionType, topic: string | undefined, subjectName: string): string {
  const t = topic || subjectName
  switch (type) {
    case 'review':       return topic ? `Review: ${t}` : `Review ${subjectName} notes`
    case 'flashcards':   return topic ? `Flashcards: ${t}` : `Flashcard drill — ${subjectName}`
    case 'practice':     return topic ? `Practice problems: ${t}` : `Practice problems — ${subjectName}`
    case 'past_paper':   return topic ? `Past paper Q's on ${t}` : `Past paper — ${subjectName}`
    case 'deep_dive':    return topic ? `Deep dive: ${t}` : `Deep dive — ${subjectName}`
    case 'active_recall':return topic ? `Active recall: ${t}` : `Active recall — ${subjectName}`
    case 'summary':      return topic ? `Summarise: ${t}` : `Write summary — ${subjectName}`
    case 'timed':        return topic ? `Timed: ${t}` : `Timed practice — ${subjectName}`
  }
}

// ─── Main generator ────────────────────────────────────────────────────────
export function generateStudyPlan(subjects: PlanSubject[], hoursPerDay: number, startDate: Date = new Date()): StudyTask[] {
  if (subjects.length === 0) return []
  const tasks: StudyTask[] = []
  const minutesPerDay = hoursPerDay * 60
  const sessionLength = 45

  const sorted = [...subjects].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
  const lastExam = new Date(sorted[sorted.length - 1].examDate)
  const totalDays = daysBetween(startDate, lastExam)
  if (totalDays === 0) return []

  // Topic cursors per subject — we cycle through topics across days
  const topicCursors: Record<string, number> = {}
  subjects.forEach(s => { topicCursors[s.id] = 0 })

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset)
    const dateStr = toDateStr(currentDate)
    const activeSubjects = sorted.filter(s => currentDate <= new Date(s.examDate))
    if (activeSubjects.length === 0) continue

    const scores = activeSubjects.map(s => {
      const daysLeft = Math.max(1, daysBetween(currentDate, new Date(s.examDate)))
      let base = 1 / daysLeft
      if (s.priority === 'high') base *= 2.5
      if (s.priority === 'low')  base *= 0.4
      return { subject: s, score: base, daysLeft }
    })
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0)

    scores.forEach(({ subject, score, daysLeft }) => {
      const minutes = Math.round((score / totalScore) * minutesPerDay)
      if (minutes < 15) return

      const numSessions = Math.max(1, Math.round(minutes / sessionLength))
      const sessionDuration = Math.round(minutes / numSessions)
      const topics = subject.topics || []

      for (let s = 0; s < numSessions; s++) {
        const sessionIndex = dayOffset * 10 + s
        const type = getSessionType(daysLeft, sessionIndex, numSessions)

        // Pick next topic (cycle through)
        let topic: string | undefined
        if (topics.length > 0) {
          topic = topics[topicCursors[subject.id] % topics.length]
          // Advance cursor every other session so we don't repeat too fast
          if (s % 2 === 1 || numSessions === 1) {
            topicCursors[subject.id]++
          }
        }

        tasks.push({
          id: `${subject.id}-${dateStr}-${s}`,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectColor: subject.color,
          date: dateStr,
          durationMinutes: sessionDuration,
          sessionLabel: buildLabel(type, topic, subject.name),
          sessionType: type,
          topic,
          done: false,
        })
      }
    })
  }
  return tasks
}

export function getTasksForDate(tasks: StudyTask[], dateStr: string): StudyTask[] {
  return tasks.filter(t => t.date === dateStr)
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}
