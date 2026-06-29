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

  useEffect(() => {
    const saved = localStorage.getItem('bloomPlan')
    const savedDone = localStorage.getItem('bloomDoneTasks')
    if (saved) {
      const p: SavedPlan = JSON.parse(saved)
      setPlan(p)
      // Re-extract topics from current notes (fixes stale topics from old plans)
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
    }
    if (savedDone) {
      setDoneTasks(new Set(JSON.parse(savedDone)))
    }
  }, [])

  function generateRevisionPrompt(task: StudyTask): string {
    const days = Math.ceil((new Date(task.date).getTime() - new Date().setHours(0,0,0,0)) / 86400000)
    const urgency = days <= 3 ? `exam in ${days} day(s) — high-yield only, no fluff`
      : days <= 7 ? `exam in ${days} days — consolidate and practise past-paper style`
      : `exam in ${days} days — build deep understanding`
    const numSessions = Math.max(1, Math.round(task.durationMinutes / 20))

    // Pull class notes for this subject
    const classNotes = (() => {
      try {
        const ns = JSON.parse(localStorage.getItem('bloomNotes') || '[]') as Array<{content:string}>
        const subjectLower = task.subjectName.toLowerCase().split(' ')[0]
        const matches = ns.filter(n => n.content.toLowerCase().includes(subjectLower))
        if (matches.length === 0) return ''
        return '\n\nMy class notes:\n' + matches.map(n => n.content).join('\n\n').slice(0, 800)
      } catch { return '' }
    })()

    // Pull relevant textbook excerpt for this specific topic
    const textbookExcerpt = (() => {
      try {
        const tbContent = loadTextbookForSubject(task.subjectName)
        if (!tbContent || !task.topic) return ''
        const excerpt = findTextbookExcerpt(tbContent, task.topic)
        return excerpt ? `\n\nFrom my textbook:\n${excerpt}` : ''
      } catch { return '' }
    })()

    const hasContext = classNotes || textbookExcerpt
    return `${task.subjectName} — ${numSessions}×20 min — ${task.sessionLabel}\n\n${urgency}${classNotes}${textbookExcerpt}\n\n${hasContext
      ? 'Based on my notes and textbook above, give me a precise structured revision session covering exactly this topic. Include: key definitions to memorise, 3–5 practice questions at exam difficulty, and a 5-question self-test at the end. Be specific — use the exact terms and concepts from my material.'
      : 'Give me a structured revision session for this topic. Include: key definitions, worked examples, 3–5 practice questions at exam difficulty, and a 5-question self-test at the end.'
    }`
  }

  function copyPrompt(task: StudyTask) {
    navigator.clipboard.writeText(generateRevisionPrompt(task))
    setCopiedId(task.id)
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
                        </div>
                        {/* Copy icon — small, right side */}
                        {!isDone && (
                          <button
                            onClick={(e) => { e.stopPropagation(); copyPrompt(task) }}
                            title="Copy revision prompt for ChatGPT"
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
                  <div className={`mt-2 text-xs inline-flex px-2 py-0.5 rounded-full ${
                    subject.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    subject.priority === 'low' ? 'bg-green-500/20 text-green-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {subject.priority === 'high' ? '🔥 High priority' :
                     subject.priority === 'low' ? '💚 Low priority' : '⚡ Medium priority'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
