'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Task { id: string; title: string; subject: string; due_date: string | null; done: boolean; priority: 'low'|'medium'|'high' }

const PRIORITY_COLORS = { low: 'text-green-400 bg-green-500/10 border-green-500/20', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', high: 'text-red-400 bg-red-500/10 border-red-500/20' }

export default function PlannerPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: prof }, { data: tks }] = await Promise.all([
      supabase.from('profiles').select('subjects').eq('id', user.id).single(),
      supabase.from('study_sessions').select('*').eq('user_id', user.id).order('due_date', { ascending: true }),
    ])
    if (prof) setSubjects((prof as { subjects: string[] }).subjects || [])
    if (tks) setTasks(tks as Task[])
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('study_sessions').insert({
      user_id: user.id, title, subject, due_date: due || null, done: false, priority,
    })
    setTitle(''); setSubject(''); setDue(''); setPriority('medium'); setShowForm(false)
    await load()
    setSaving(false)
  }

  async function toggleDone(task: Task) {
    await supabase.from('study_sessions').update({ done: !task.done }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
  }

  const pending  = tasks.filter(t => !t.done)
  const done     = tasks.filter(t => t.done)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">📅 Planner</h1>
          <p className="text-white/50 text-sm">{pending.length} task{pending.length !== 1 ? 's' : ''} to go</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)}>+ Add task</Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={addTask}
            className="glass-strong p-6 space-y-4"
          >
            <h3 className="font-bold">New task</h3>
            <Input label="Task title" placeholder="e.g. Review Chapter 5" value={title} onChange={e => setTitle(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-white/70 font-medium">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white outline-none focus:border-violet-400 transition-all"
                >
                  <option value="">— Select —</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input label="Due date" type="date" value={due} onChange={e => setDue(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-white/70 font-medium">Priority</label>
              <div className="flex gap-2">
                {(['low','medium','high'] as const).map(p => (
                  <button key={p} type="button" onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${priority === p ? PRIORITY_COLORS[p] : 'border-white/10 text-white/40 hover:text-white'}`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={saving}>Save task</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {pending.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-bold text-lg mb-2">All done!</p>
          <p className="text-white/40 text-sm">Add a new task to keep the momentum going.</p>
        </div>
      )}

      <div className="space-y-3">
        {pending.map((task, i) => (
          <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="card flex items-center gap-4 group"
          >
            <button onClick={() => toggleDone(task)}
              className="w-6 h-6 rounded-full border-2 border-white/30 hover:border-violet-400 transition-colors shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium">{task.title}</p>
              <div className="flex items-center gap-2 mt-1">
                {task.subject && <span className="text-xs text-violet-400">{task.subject}</span>}
                {task.due_date && <span className="text-xs text-white/40">Due {new Date(task.due_date).toLocaleDateString()}</span>}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full border font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
          </motion.div>
        ))}
      </div>

      {done.length > 0 && (
        <details className="glass p-4 rounded-2xl">
          <summary className="cursor-pointer text-sm text-white/40 font-medium">Completed ({done.length})</summary>
          <div className="mt-3 space-y-2">
            {done.map(task => (
              <div key={task.id} className="flex items-center gap-3 opacity-40">
                <span className="text-green-400 text-lg">✓</span>
                <span className="line-through text-sm">{task.title}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
