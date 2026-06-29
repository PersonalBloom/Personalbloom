// Study plan generation algorithm

export type PlanSubject = {
  id: string
  name: string
  examDate: string // ISO date string YYYY-MM-DD
  color: string
  priority: 'high' | 'medium' | 'low'
}

export type StudyTask = {
  id: string
  subjectId: string
  subjectName: string
  subjectColor: string
  date: string // ISO date string YYYY-MM-DD
  durationMinutes: number
  sessionLabel: string
  done: boolean
}

const SUBJECT_COLORS = [
  '#A78BFA', // violet
  '#F472B6', // pink
  '#34D399', // emerald
  '#60A5FA', // blue
  '#FBBF24', // amber
  '#F87171', // red
  '#A3E635', // lime
  '#38BDF8', // sky
  '#C084FC', // purple
  '#FB923C', // orange
]

export function assignColors(subjects: { id: string }[]): Record<string, string> {
  const map: Record<string, string> = {}
  subjects.forEach((s, i) => {
    map[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]
  })
  return map
}

function daysBetween(from: Date, to: Date): number {
  const diff = to.getTime() - from.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

const SESSION_LABELS = [
  'Review concepts',
  'Practice problems',
  'Past paper questions',
  'Summarise notes',
  'Flashcard review',
  'Deep dive',
  'Quick revision',
  'Active recall',
  'Mind map',
  'Timed practice',
]

export function generateStudyPlan(
  subjects: PlanSubject[],
  hoursPerDay: number,
  startDate: Date = new Date()
): StudyTask[] {
  if (subjects.length === 0) return []

  const tasks: StudyTask[] = []
  const minutesPerDay = hoursPerDay * 60
  const sessionLength = 45

  const sorted = [...subjects].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  )

  const lastExam = new Date(sorted[sorted.length - 1].examDate)
  const totalDays = daysBetween(startDate, lastExam)
  if (totalDays === 0) return []

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset)
    const dateStr = toDateStr(currentDate)

    const activeSubjects = sorted.filter(s => {
      const examDate = new Date(s.examDate)
      return currentDate <= examDate
    })

    if (activeSubjects.length === 0) continue

    const scores = activeSubjects.map(s => {
      const daysLeft = Math.max(1, daysBetween(currentDate, new Date(s.examDate)))
      let base = 1 / daysLeft
      if (s.priority === 'high') base *= 2
      if (s.priority === 'low') base *= 0.5
      return { subject: s, score: base }
    })

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0)

    const dayAllocations: { subject: PlanSubject; minutes: number }[] = []
    scores.forEach(({ subject, score }) => {
      const proportion = score / totalScore
      const minutes = Math.round(proportion * minutesPerDay)
      dayAllocations.push({ subject, minutes })
    })

    dayAllocations.forEach(({ subject, minutes }) => {
      if (minutes < 20) return

      const numSessions = Math.max(1, Math.round(minutes / sessionLength))
      const sessionDuration = Math.round(minutes / numSessions)

      for (let s = 0; s < numSessions; s++) {
        const labelIndex = (dayOffset + s) % SESSION_LABELS.length
        tasks.push({
          id: `${subject.id}-${dateStr}-${s}`,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectColor: subject.color,
          date: dateStr,
          durationMinutes: sessionDuration,
          sessionLabel: SESSION_LABELS[labelIndex],
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
