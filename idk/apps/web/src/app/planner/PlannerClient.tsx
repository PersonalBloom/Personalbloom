'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { generateStudyPlan, getTasksForDate, getTodayStr, StudyTask, PlanSubject, extractTopicsFromNotes, loadTextbookForSubject, findTextbookExcerpt } from '@/lib/planner'
import { awardXP } from '@/lib/gamification'

type SavedPlan = {
  programId: string
  subjects: PlanSubject[]
  hoursPerDay: number
  createdAt: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function PlannerClient() {
  const [plan, setPlan] = useState<SavedPlan | null>(null)
  const [tasks, setTasks] = useState<StudyTask[]>([])
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [view, setView] = useState<'today' | 'week' | 'subjects'>('today')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editPromptTask, setEditPromptTask] = useState<StudyTask | null>(null)
  const [editPromptText, setEditPromptText] = useState('')
  const [weaknesses, setWeaknesses] = useState<Record<string, string>>({}) // subjectId -> note
  const [editingWeakness, setEditingWeakness] = useState<string | null>(null)
  const [weaknessInput, setWeaknessInput] = useState('')
  const [bloomieInsight, setBloomieInsight] = useState('')

  useEffect(() => {
    // Load weaknesses
    try {
      const w = JSON.parse(localStorage.getItem('bloomWeaknesses') || '{}')
      setWeaknesses(w)
    } catch {}

    const saved = localStorage.getItem('bloomPlan')
    const savedDone = localStorage.getItem('bloomDoneTasks')
    if (saved) {
      const p: SavedPlan = JSON.parse(saved)
      setPlan(p)

      // Use cached tasks for instant render
      const cachedTasks = localStorage.getItem('bloomTasksCache')
      if (cachedTasks) {
        setTasks(JSON.parse(cachedTasks))
      }

      // Recalculate in background (topic extraction can be slow on big notes)
      setTimeout(() => {
        const currentNotes = (() => {
          try {
            const ns = JSON.parse(localStorage.getItem('bloomNotes') || '[]') as Array<{content:string}>
            return ns.map(n => n.content).join('\n\n')
          } catch { return '' }
        })()
        // Always call extractTopicsFromNotes — it falls back to curriculum topics when notes are empty
        const freshSubjects = p.subjects.map((s: PlanSubject) => ({
          ...s,
          topics: extractTopicsFromNotes(currentNotes, s.name),
        }))
        const generated = generateStudyPlan(freshSubjects, p.hoursPerDay)
        setTasks(generated)
        localStorage.setItem('bloomTasksCache', JSON.stringify(generated))

        // Build Bloomie personalised insight
        const todayStr2 = new Date().toISOString().split('T')[0]
        const todayTasks2 = generated.filter((t: StudyTask) => t.date === todayStr2)
        const nearestSubject = p.subjects
          .map((s: PlanSubject) => ({ ...s, days: Math.ceil((new Date(s.examDate).getTime() - Date.now()) / 86400000) }))
          .filter((s: PlanSubject & {days:number}) => s.days >= 0)
          .sort((a: PlanSubject & {days:number}, b: PlanSubject & {days:number}) => a.days - b.days)[0]
        const ws: Record<string,string> = JSON.parse(localStorage.getItem('bloomWeaknesses') || '{}')
        const weakSubjects = Object.entries(ws).filter(([,v]) => v?.trim()).map(([k]) => k)
        const weakSubjectNames = p.subjects.filter((s: PlanSubject) => weakSubjects.includes(s.id)).map((s: PlanSubject) => s.name)

        let msg = ''
        if (nearestSubject && nearestSubject.days <= 3) {
          msg = `${nearestSubject.name} exam in ${nearestSubject.days} day${nearestSubject.days !== 1 ? 's' : ''}!! Focus on your weakest points first — no time to cover everything, make every minute count 🔥`
        } else if (weakSubjectNames.length > 0 && todayTasks2.length > 0) {
          msg = `You flagged ${weakSubjectNames[0]} as a weak spot — make sure you give it extra attention today. Don't rush through it, actually understand it 💜`
        } else if (todayTasks2.length === 0) {
          msg = `No sessions scheduled today! Enjoy the rest, or use it to review flashcards if you want to stay sharp 🌸`
        } else {
          const subjects = [...new Set(todayTasks2.map((t: StudyTask) => t.subjectName))]
          msg = `Today you have ${todayTasks2.length} session${todayTasks2.length !== 1 ? 's' : ''} across ${subjects.join(' and ')}. ${nearestSubject ? `Your nearest exam is ${nearestSubject.name} in ${nearestSubject.days} days.` : 'You got this!'} 🌸`
        }
        setBloomieInsight(msg)
      }, 0)
    }
    if (savedDone) {
      setDoneTasks(new Set(JSON.parse(savedDone)))
    }
  }, [])

  function generateRevisionPrompt(task: StudyTask): string {
    const days = Math.ceil((new Date(task.date).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
    const numSessions = Math.max(1, Math.round(task.durationMinutes / 20))
    const totalMinutes = numSessions * 20

    const urgencyLine = days <= 0  ? `⚠️ EXAM TODAY — focus only on highest-yield points, no new concepts`
      : days === 1 ? `⚠️ EXAM TOMORROW — consolidate everything, prioritise weak spots, quick practice questions only`
      : days <= 3  ? `Exam in ${days} days — high-yield revision, past-paper style questions, no fluff`
      : days <= 7  ? `Exam in ${days} days — consolidate understanding, mix of explanation and practice`
      : `Exam in ${days} days — build deep understanding, connect concepts, push difficulty`

    // Pull ALL notes for this subject (not just first match, not capped at 800 chars)
    const classNotes = (() => {
      try {
        const ns = JSON.parse(localStorage.getItem('bloomNotes') || '[]') as Array<{id:string; subject:string; title:string; content:string}>
        const subjectWord = task.subjectName.toLowerCase().split(' ')[0]
        // Match by subject field first, then by content keyword
        const bySubject = ns.filter(n => n.subject?.toLowerCase().includes(subjectWord))
        const byContent = ns.filter(n => !bySubject.includes(n) && n.content.toLowerCase().includes(subjectWord))
        const matches = [...bySubject, ...byContent]
        if (matches.length === 0) return { text: '', count: 0 }
        const combined = matches.map(n => `[Note: ${n.title || n.subject}]\n${n.content}`).join('\n\n---\n\n')
        // Use up to 3000 chars — enough to be specific
        return { text: combined.slice(0, 3000) + (combined.length > 3000 ? '\n...[notes truncated]' : ''), count: matches.length }
      } catch { return { text: '', count: 0 } }
    })()

    // Pull MULTIPLE textbook excerpts — topic + subtopics from the session label
    const textbookContent = (() => {
      try {
        const tbContent = loadTextbookForSubject(task.subjectName)
        if (!tbContent) return ''
        // Extract keywords from topic + session label
        const keywords = [task.topic, task.sessionLabel]
          .filter(Boolean)
          .flatMap(s => s!.split(/[:\-,]+/).map(p => p.trim()))
          .filter(k => k.length > 3)
        const excerpts = keywords
          .map(k => findTextbookExcerpt(tbContent, k))
          .filter(Boolean)
          .filter((e, i, arr) => arr.indexOf(e) === i) // deduplicate
          .slice(0, 3)
        if (excerpts.length === 0) return ''
        return excerpts.join('\n\n---\n\n').slice(0, 2500)
      } catch { return '' }
    })()

    // Pull weakness note for this subject
    const weaknessNote = (() => {
      try {
        const ws: Record<string,string> = JSON.parse(localStorage.getItem('bloomWeaknesses') || '{}')
        const sub = plan?.subjects?.find((s: PlanSubject) => s.name === task.subjectName)
        return sub ? ws[sub.id] || '' : ''
      } catch { return '' }
    })()

    const hasNotes = classNotes.text.length > 0
    const hasTextbook = textbookContent.length > 0
    const hasContext = hasNotes || hasTextbook

    let prompt = `You are a precise, exam-focused study tutor. I have ${totalMinutes} minutes (${numSessions} × 20 min sessions) to revise the following topic.\n\n`
    prompt += `SUBJECT: ${task.subjectName}\n`
    prompt += `TOPIC: ${task.sessionLabel}\n`
    prompt += `URGENCY: ${urgencyLine}\n`
    if (weaknessNote) {
      prompt += `MY WEAK SPOTS IN THIS SUBJECT: ${weaknessNote}\n`
      prompt += `→ Pay extra attention to these areas. Weight your questions and examples toward these weaknesses.\n`
    }

    if (hasNotes) {
      prompt += `\n${'='.repeat(50)}\nMY CLASS NOTES (${classNotes.count} note${classNotes.count !== 1 ? 's' : ''}):\n${'='.repeat(50)}\n${classNotes.text}\n`
    }
    if (hasTextbook) {
      prompt += `\n${'='.repeat(50)}\nMY TEXTBOOK (relevant sections):\n${'='.repeat(50)}\n${textbookContent}\n`
    }

    prompt += `\n${'='.repeat(50)}\nINSTRUCTIONS:\n${'='.repeat(50)}\n`

    if (hasContext) {
      prompt += `Using ONLY the notes and textbook content above (do not add outside information unless I have nothing), create a structured ${totalMinutes}-minute revision session. Everything must be grounded in my actual material.\n\n`
    } else {
      prompt += `Create a structured ${totalMinutes}-minute revision session on this topic.\n\n`
    }

    prompt += `Structure it exactly like this:\n\n`
    prompt += `1. CORE CONCEPTS (5 min) — bullet-point the 5–8 most important ideas from ${hasContext ? 'my notes/textbook' : 'this topic'}, using the exact terminology I need to know\n\n`
    prompt += `2. KEY DEFINITIONS (5 min) — list every term I must be able to define precisely, with the definition\n\n`
    prompt += `3. WORKED EXAMPLES (${Math.max(5, totalMinutes - 25)} min) — walk me through ${Math.max(2, numSessions)} exam-style problems step by step, at the difficulty level of ${task.subjectName} exams\n\n`
    prompt += `4. SELF-TEST (10 min) — give me 5 questions at increasing difficulty, then reveal the answers below. Do NOT show answers before I scroll down.\n\n`
    if (days <= 7) {
      prompt += `5. EXAM TIPS — 3 specific things students commonly get wrong on this topic, and how to avoid them`
    } else {
      prompt += `5. GO DEEPER — 2–3 harder extension questions to push my understanding beyond the basics`
    }

    return prompt
  }

  function saveWeakness(subjectId: string, note: string) {
    const updated = { ...weaknesses, [subjectId]: note }
    setWeaknesses(updated)
    localStorage.setItem('bloomWeaknesses', JSON.stringify(updated))
    setEditingWeakness(null)
    setWeaknessInput('')
  }

  function openEditPrompt(task: StudyTask) {
    setEditPromptText(generateRevisionPrompt(task))
    setEditPromptTask(task)
  }

  function copyAndClose() {
    navigator.clipboard.writeText(editPromptText)
    setCopiedId(editPromptTask?.id || null)
    setEditPromptTask(null)
    setTimeout(() => setCopiedId(null), 2500)
  }

  function toggleDone(taskId: string) {
    setDoneTasks(prev => {
      const next = new Set(prev)
      const wasAlreadyDone = next.has(taskId)
      if (wasAlreadyDone) next.delete(taskId)
      else {
        next.add(taskId)
        // Award XP for completing a session
        const result = awardXP('session_complete')
        // Check if all today's tasks are now done
        const todayTaskIds = tasks.filter(t => t.date === getTodayStr()).map(t => t.id)
        const allDone = todayTaskIds.every(id => id === taskId || next.has(id))
        if (allDone && todayTaskIds.length > 0) awardXP('all_day_complete')
        // Dispatch event so the plant widget updates
        window.dispatchEvent(new CustomEvent('bloomXP', { detail: result }))
      }
      localStorage.setItem('bloomDoneTasks', JSON.stringify([...next]))
      return next
    })
  }

  const todayTasks = useMemo(() => getTasksForDate(tasks, selectedDate), [tasks, selectedDate])

  const weekDates = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }, [])

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#0d0d18] text-white flex flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl mb-6">🌸</div>
        <h1 className="text-3xl font-bold mb-3">No study plan yet!</h1>
        <p className="text-white/50 mb-8 max-w-sm">
          Let Bloomie build your personalised revision schedule based on your exams and subjects.
        </p>
        <Link
          href="/planner/setup"
          className="px-8 py-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl font-semibold text-white hover:opacity-90 transition-all"
        >
          ✨ Create My Study Plan
        </Link>
      </div>
    )
  }

  const todayStr = getTodayStr()
  const totalToday = todayTasks.length
  const doneToday = todayTasks.filter(t => doneTasks.has(t.id)).length
  const progressPercent = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0

  return (
    <div className="min-h-screen bg-[#0d0d18] text-white">
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌸</span>
            <div>
              <h1 className="font-bold text-lg">My Study Plan</h1>
              <p className="text-white/40 text-xs">{plan.subjects.length} subjects · {plan.hoursPerDay}h/day</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/planner/setup" className="text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white/70">
              ✏️ Edit Plan
            </Link>
            <Link href="/dashboard" className="text-sm text-white/40 hover:text-white transition-all">
              Dashboard →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {selectedDate === todayStr && (
          <div className="mb-6 p-5 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-lg">
                  {doneToday === totalToday && totalToday > 0 ? '🎉 All done today!' : "Today's sessions"}
                </div>
                <div className="text-sm text-white/50">{formatDate(selectedDate)}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-violet-300">{doneToday}/{totalToday}</div>
                <div className="text-xs text-white/40">sessions</div>
              </div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Bloomie insight — personalised to their plan */}
        {bloomieInsight && selectedDate === todayStr && (
          <div className="flex items-start gap-3 mb-6 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xl shrink-0">🌸</div>
            <div>
              <div className="text-xs font-semibold text-violet-300 mb-1">Bloomie</div>
              <p className="text-sm text-white/80 leading-relaxed">{bloomieInsight}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {(['today', 'week', 'subjects'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                view === v ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {v === 'today' ? '📅 Today' : v === 'week' ? '📆 This Week' : '📊 Subjects'}
            </button>
          ))}
        </div>

        {view === 'today' && (
          <div>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {weekDates.map(date => {
                const d = new Date(date + 'T00:00:00')
                const dayTasks = getTasksForDate(tasks, date)
                const dayDone = dayTasks.filter(t => doneTasks.has(t.id)).length
                const isToday = date === todayStr
                const isSelected = date === selectedDate
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-14 py-2 rounded-xl text-center transition-all ${
                      isSelected ? 'bg-violet-500 text-white' :
                      isToday ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300' :
                      'bg-white/5 hover:bg-white/10 text-white/60'
                    }`}
                  >
                    <div className="text-xs opacity-70">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                    <div className="text-lg font-bold">{d.getDate()}</div>
                    {dayTasks.length > 0 && (
                      <div className={`text-xs ${dayDone === dayTasks.length ? 'text-green-400' : 'text-white/40'}`}>
                        {dayDone}/{dayTasks.length}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <div className="text-4xl mb-3">🎉</div>
                <div>No sessions scheduled for this day</div>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(task => {
                  const isDone = doneTasks.has(task.id)
                  const sessionEmoji = task.sessionType === 'flashcards' ? '🃏'
                    : task.sessionType === 'past_paper'    ? '📝'
                    : task.sessionType === 'timed'         ? '⏱️'
                    : task.sessionType === 'deep_dive'     ? '🔬'
                    : task.sessionType === 'active_recall' ? '🧠'
                    : task.sessionType === 'summary'       ? '✍️'
                    : task.sessionType === 'practice'      ? '💪' : '📖'
                  const numSessions = Math.max(1, Math.round(task.durationMinutes / 20))
                  const daysLeft = Math.ceil((new Date(task.date).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleDone(task.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                        isDone ? 'border-white/5 bg-white/3 opacity-60' : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            isDone ? 'border-green-500 bg-green-500' : 'border-white/30'
                          }`}
                          style={!isDone ? { borderColor: task.subjectColor } : {}}
                        >
                          {isDone && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Title line — like MyStudyLife */}
                          <div className={`font-semibold text-sm ${isDone ? 'line-through text-white/40' : 'text-white'}`}>
                            {sessionEmoji} {task.sessionLabel}
                          </div>
                          {/* Subtitle — subject · duration · days left */}
                          <div className="text-xs text-white/40 mt-0.5">
                            <span style={{ color: task.subjectColor + 'cc' }}>{task.subjectName}</span>
                            {' · '}
                            {numSessions}×20 min
                            {daysLeft > 0 && ` · ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                          </div>
                          {/* Weakness indicator */}
                          {(() => {
                            const sub = plan.subjects.find((s: PlanSubject) => s.name === task.subjectName)
                            const w = sub ? weaknesses[sub.id] : null
                            return w ? <div className="text-xs text-red-400/70 mt-0.5">⚠️ {w}</div> : null
                          })()}
                        </div>
                        {/* Copy icon — small, right side */}
                        {!isDone && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditPrompt(task) }}
                            title="Edit & copy revision prompt"
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/40 text-white/30 hover:text-violet-300 transition-all text-sm"
                          >
                            {copiedId === task.id ? '✓' : '📋'}
                          </button>
                        )}
                      </div>
                      {copiedId === task.id && (
                        <div className="mt-2 ml-9 text-xs text-violet-400">Copied! Paste into ChatGPT ✨</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {view === 'week' && (
          <div className="space-y-4">
            {weekDates.map(date => {
              const dayTasks = getTasksForDate(tasks, date)
              if (dayTasks.length === 0) return null
              const d = new Date(date + 'T00:00:00')
              const isToday = date === todayStr
              const dayDone = dayTasks.filter(t => doneTasks.has(t.id)).length
              return (
                <div key={date} className={`p-4 rounded-2xl border ${isToday ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">
                      {isToday ? '📅 Today — ' : ''}
                      {d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-xs text-white/40">{dayDone}/{dayTasks.length} done</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: task.subjectColor + '25', color: task.subjectColor }}
                      >
                        {task.subjectName} · {task.durationMinutes}m
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {view === 'subjects' && (
          <div className="space-y-4">
            {plan.subjects.map(subject => {
              const subjectTasks = tasks.filter(t => t.subjectId === subject.id)
              const doneSub = subjectTasks.filter(t => doneTasks.has(t.id)).length
              const pct = subjectTasks.length > 0 ? Math.round((doneSub / subjectTasks.length) * 100) : 0
              const days = daysUntil(subject.examDate)
              return (
                <div key={subject.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{subject.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">
                        Exam: {new Date(subject.examDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        <span className={days <= 7 ? 'text-red-400' : days <= 14 ? 'text-amber-400' : 'text-white/40'}>
                          {days > 0 ? `${days} days left` : 'Exam today!'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: subject.color }}>{pct}%</div>
                      <div className="text-xs text-white/40">{doneSub}/{subjectTasks.length} sessions</div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: subject.color }} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <div className={`text-xs inline-flex px-2 py-0.5 rounded-full ${
                      subject.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      subject.priority === 'low' ? 'bg-green-500/20 text-green-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {subject.priority === 'high' ? '🔥 High priority' :
                       subject.priority === 'low' ? '💚 Low priority' : '⚡ Medium priority'}
                    </div>
                    {/* Weakness tag */}
                    {editingWeakness === subject.id ? (
                      <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={weaknessInput}
                          onChange={e => setWeaknessInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveWeakness(subject.id, weaknessInput); if (e.key === 'Escape') setEditingWeakness(null) }}
                          placeholder="e.g. integration, cell respiration, WW2 causes..."
                          className="flex-1 text-xs px-3 py-1.5 bg-white/10 border border-violet-500/40 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-400"
                        />
                        <button onClick={() => saveWeakness(subject.id, weaknessInput)}
                          className="text-xs px-3 py-1.5 bg-violet-500 rounded-xl text-white font-medium">Save</button>
                        <button onClick={() => setEditingWeakness(null)}
                          className="text-xs text-white/30 hover:text-white">✕</button>
                      </div>
                    ) : weaknesses[subject.id] ? (
                      <button onClick={() => { setEditingWeakness(subject.id); setWeaknessInput(weaknesses[subject.id]) }}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition-all">
                        ⚠️ Struggling with: {weaknesses[subject.id]}
                      </button>
                    ) : (
                      <button onClick={() => { setEditingWeakness(subject.id); setWeaknessInput('') }}
                        className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 transition-all">
                        + flag weak spots
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Prompt edit modal */}
      {editPromptTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setEditPromptTask(null)}>
          <div className="w-full max-w-2xl bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h2 className="font-bold text-base">✏️ Edit Revision Prompt</h2>
                <p className="text-xs text-white/40 mt-0.5">{editPromptTask.subjectName} · {editPromptTask.sessionLabel}</p>
              </div>
              <button onClick={() => setEditPromptTask(null)} className="text-white/30 hover:text-white text-xl leading-none">✕</button>
            </div>
            {/* Editable textarea */}
            <textarea
              value={editPromptText}
              onChange={e => setEditPromptText(e.target.value)}
              className="flex-1 w-full bg-transparent text-white/80 text-sm leading-relaxed px-5 py-4 resize-none focus:outline-none font-mono overflow-y-auto"
              style={{ minHeight: '300px', maxHeight: '60vh' }}
            />
            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/10 gap-3">
              <span className="text-xs text-white/30">{editPromptText.length} chars — edit anything before copying</span>
              <div className="flex gap-2">
                <button onClick={() => setEditPromptText(generateRevisionPrompt(editPromptTask))}
                  className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/50 transition-all">
                  ↺ Reset
                </button>
                <button onClick={copyAndClose}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 rounded-xl font-semibold text-white transition-all">
                  📋 Copy & paste into ChatGPT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
