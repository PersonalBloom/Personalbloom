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
const TOPIC_JUNK = new Set([
  'optional','mandatory','note','notes','example','examples','see','tip','tips',
  'important','remember','hint','also','source','sources','references','summary',
  'overview','intro','introduction','conclusion','definition','description',
  'explanation','instructions','instruction','task','tasks','objective','objectives',
  'goal','goals','activity','activities','homework','assignment','due','deadline',
  'week','chapter','section','page','pages','unit','topic','topics','subject',
  'visit','listen','read','write','review','practice','study','complete','check',
  'you','your','this','that','these','those','the','and','or','but','with',
  'extended','core','higher','standard','sl','hl','aa','ai','dp','myp','pyp',
])

function isUsefulTopic(term: string, subjectName?: string): boolean {
  if (term.length < 4 || term.length > 60) return false
  // Skip topics that are just the subject name (or subject name + junk)
  if (subjectName) {
    const subjectLower = subjectName.toLowerCase().split(/\s+/)[0]
    const termLower = term.toLowerCase()
    if (termLower.startsWith(subjectLower) && term.split(' ').length <= 3) return false
  }
  // Skip URLs or credential-looking things
  if (term.includes('http') || term.includes('www') || term.includes('@') || /password|user.?id/i.test(term)) return false
  // Skip if it's mostly numbers or symbols
  if (/^[\d\s\W]+$/.test(term)) return false
  // Skip if it starts with common instruction words
  if (/^(visit|listen|read|write|review|practice|study|draw|make|create|use|check|ensure|complete|learn|understand|watch|download|access)/i.test(term)) return false
  // Check the full lowercased+stripped version
  const stripped = term.toLowerCase().replace(/[^a-z]/g, '')
  if (TOPIC_JUNK.has(stripped)) return false
  // Also check each word individually — "Art Mandatory", "Holiday Homework" etc.
  const words = term.toLowerCase().split(/\s+/)
  if (words.every(w => TOPIC_JUNK.has(w.replace(/[^a-z]/g, '')))) return false
  // If more than half the words are junk, skip
  const junkCount = words.filter(w => TOPIC_JUNK.has(w.replace(/[^a-z]/g, ''))).length
  if (junkCount > 0 && junkCount >= Math.ceil(words.length / 2)) return false
  return true
}

// Extract the key noun phrase from a longer sentence
function extractKeyPhrase(text: string): string {
  const clean = text.replace(/^[-•*#\d.)]+\s*/, '').trim()
  // "X is/are/= Y" → take X
  const isMatch = clean.match(/^(.+?)\s+(is|are|=|refers to|means|involves|defined as)\s+/i)
  if (isMatch) return isMatch[1].trim()
  // First 4 words
  return clean.split(/\s+/).slice(0, 4).join(' ')
}

export function extractTopicsFromNotes(notes: string, subjectName: string): string[] {
  if (!notes || !notes.trim()) return []
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean)

  // Narrow to lines relevant to this subject
  let relevantLines: string[] = []
  let inSubjectSection = false
  let linesAfter = 0
  for (const line of lines) {
    if (line.toLowerCase().includes(subjectName.toLowerCase().split(' ')[0])) {
      inSubjectSection = true; linesAfter = 0; continue
    }
    if (inSubjectSection) {
      linesAfter++
      if (linesAfter > 60) inSubjectSection = false
      else relevantLines.push(line)
    }
  }
  const sourceLines = relevantLines.length > 3 ? relevantLines : lines

  // Build clusters: each heading + its subtopics from following bullets
  type Cluster = { heading: string; subtopics: string[] }
  const clusters: Cluster[] = []
  let current: Cluster | null = null

  for (const line of sourceLines) {
    const isBullet   = /^[-•*]\s+/.test(line)
    const isNumbered = /^\d+[.)]\s+/.test(line)

    // "Term: long definition..." → heading cluster + first key phrase as subtopic
    const colonDef = line.match(/^([^:\n]{3,45}):\s+(.{8,})$/)
    if (colonDef && !isBullet && !isNumbered) {
      const heading = colonDef[1].replace(/^[-•*#\d.]+\s*/, '').trim()
      if (isUsefulTopic(heading, subjectName)) {
        const phrase = extractKeyPhrase(colonDef[2])
        current = { heading, subtopics: phrase.length > 3 && isUsefulTopic(phrase, subjectName) ? [phrase] : [] }
        clusters.push(current)
      }
      continue
    }

    // Short standalone line → new cluster heading
    const cleanLine = line.replace(/^#+\s*/, '').trim()
    const wordCount = cleanLine.split(/\s+/).length
    if (!isBullet && !isNumbered && wordCount <= 6 && cleanLine.length >= 4 && cleanLine.length <= 55) {
      if (isUsefulTopic(cleanLine, subjectName)) {
        current = { heading: cleanLine, subtopics: [] }
        clusters.push(current)
      }
      continue
    }

    // Bullet/numbered → subtopic under current heading
    if ((isBullet || isNumbered) && current) {
      const raw = line.replace(/^[-•*\d.)]+\s*/, '').trim()
      // Try key phrase extraction from longer bullets
      const phrase = raw.split(/\s+/).length > 5 ? extractKeyPhrase(raw) : raw
      const pWords = phrase.split(/\s+/)
      if (pWords.length >= 1 && pWords.length <= 5 && isUsefulTopic(phrase, subjectName)) {
        if (!current.subtopics.includes(phrase) && current.subtopics.length < 4) {
          current.subtopics.push(phrase)
        }
      }
    }
  }

  // Build rich topic strings: "Photosynthesis: light reactions, Calvin cycle, ATP"
  const seen = new Set<string>()
  const result: string[] = []

  for (const cluster of clusters) {
    const key = cluster.heading.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    if (cluster.subtopics.length >= 2) {
      result.push(`${cluster.heading}: ${cluster.subtopics.slice(0, 3).join(', ')}`)
    } else if (cluster.subtopics.length === 1) {
      result.push(`${cluster.heading} — ${cluster.subtopics[0]}`)
    } else {
      result.push(cluster.heading)
    }
    if (result.length >= 15) break
  }

  return result
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
  // topic may already be a rich string like "Photosynthesis: light reactions, Calvin cycle"
  // In that case, use it directly without prepending another colon
  if (!topic) {
    switch (type) {
      case 'review':        return `Review ${subjectName} notes`
      case 'flashcards':    return `Flashcard drill — ${subjectName}`
      case 'practice':      return `Practice problems — ${subjectName}`
      case 'past_paper':    return `Past paper — ${subjectName}`
      case 'deep_dive':     return `Deep dive — ${subjectName}`
      case 'active_recall': return `Active recall — ${subjectName}`
      case 'summary':       return `Write summary — ${subjectName}`
      case 'timed':         return `Timed practice — ${subjectName}`
    }
  }
  // Rich topic already has context (e.g. "Photosynthesis: light reactions, Calvin cycle")
  switch (type) {
    case 'review':        return `Review: ${topic}`
    case 'flashcards':    return `Flashcards: ${topic}`
    case 'practice':      return `Practice: ${topic}`
    case 'past_paper':    return `Past paper on ${topic}`
    case 'deep_dive':     return `Deep dive: ${topic}`
    case 'active_recall': return `Active recall: ${topic}`
    case 'summary':       return `Summarise: ${topic}`
    case 'timed':         return `Timed: ${topic}`
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
