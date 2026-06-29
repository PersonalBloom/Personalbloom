'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PROGRAMS, getProgramById } from '@/lib/subjects'
import { PlanSubject, assignColors, extractTopicsFromNotes } from '@/lib/planner'

const STEPS = ['Program', 'Subjects', 'Exam Dates', 'Schedule', 'Notes', 'Done']

const PRIORITIES = [
  { value: 'high', label: '🔥 High', desc: 'Struggling with this' },
  { value: 'medium', label: '⚡ Medium', desc: 'Fairly confident' },
  { value: 'low', label: '💚 Low', desc: 'Got this covered' },
]

const STUDY_MODES = [
  { value: 'standard', label: '📖 Standard', desc: 'Balanced daily sessions' },
  { value: 'pomodoro_25', label: '🍅 Pomodoro 25/5', desc: '25 min work, 5 min break' },
  { value: 'pomodoro_50', label: '🍅 Pomodoro 50/10', desc: '50 min work, 10 min break' },
  { value: 'custom', label: '⚙️ Custom', desc: 'Set your own intervals' },
]

const TIME_PRESETS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1h 30' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
]

type SubjectEntry = {
  name: string
  examDate: string
  priority: 'high' | 'medium' | 'low'
  isDaily: boolean // true = no exam, just daily revision
}

export default function SetupClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [programId, setProgramId] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [customSubject, setCustomSubject] = useState('')
  const [subjectDetails, setSubjectDetails] = useState<Record<string, SubjectEntry>>({})
  const [minutesPerDay, setMinutesPerDay] = useState(120)
  const [studyMode, setStudyMode] = useState('standard')
  const [customWork, setCustomWork] = useState(20)
  const [customBreak, setCustomBreak] = useState(5)
  const [saving, setSaving] = useState(false)
  const [importedNotes, setImportedNotes] = useState('')
  const [noteUploading, setNoteUploading] = useState(false)
  const noteFileRef = useRef<HTMLInputElement>(null)

  const program = getProgramById(programId)

  function toggleSubject(name: string) {
    if (selectedSubjects.includes(name)) {
      setSelectedSubjects(prev => prev.filter(s => s !== name))
    } else {
      setSelectedSubjects(prev => [...prev, name])
      if (!subjectDetails[name]) {
        setSubjectDetails(prev => ({ ...prev, [name]: { name, examDate: '', priority: 'medium', isDaily: false } }))
      }
    }
  }

  function addCustomSubject() {
    const trimmed = customSubject.trim()
    if (!trimmed || selectedSubjects.includes(trimmed)) return
    setSelectedSubjects(prev => [...prev, trimmed])
    setSubjectDetails(prev => ({ ...prev, [trimmed]: { name: trimmed, examDate: '', priority: 'medium', isDaily: false } }))
    setCustomSubject('')
  }

  function updateDetail<K extends keyof SubjectEntry>(name: string, field: K, value: SubjectEntry[K]) {
    setSubjectDetails(prev => ({ ...prev, [name]: { ...prev[name], [field]: value } }))
  }

  function canProceed() {
    if (step === 0) return !!programId
    if (step === 1) return selectedSubjects.length > 0
    if (step === 2) return selectedSubjects.every(s => {
      const d = subjectDetails[s]
      return d?.isDaily || !!d?.examDate
    })
    if (step === 3) return minutesPerDay >= 15
    if (step === 4) return true // notes are optional
    return true
  }

  function savePlan() {
    setSaving(true)
    const ids = selectedSubjects.map(s => s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
    const colorMap = assignColors(ids.map(id => ({ id })))
    // Pull in any previously saved notes too
    const allNotes = importedNotes + (() => {
      try {
        const saved = JSON.parse(localStorage.getItem('bloomNotes') || '[]') as Array<{content: string}>
        return saved.map(n => n.content).join('\n\n')
      } catch { return '' }
    })()

    const subjects: PlanSubject[] = selectedSubjects.map((name, i) => {
      const detail = subjectDetails[name]
      const examDate = detail?.isDaily
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : (detail?.examDate || '')
      const topics = extractTopicsFromNotes(allNotes, name)
      return {
        id: ids[i],
        name,
        examDate,
        color: colorMap[ids[i]],
        priority: detail?.priority || 'medium',
        isDaily: detail?.isDaily || false,
        topics: topics.length > 0 ? topics : undefined,
      }
    })
    if (importedNotes.trim()) {
      const existingNotes = JSON.parse(localStorage.getItem('bloomNotes') || '[]')
      const newNote = { id: Date.now().toString(), subject: 'General', title: 'Imported Notes', content: importedNotes.trim(), createdAt: new Date().toISOString() }
      localStorage.setItem('bloomNotes', JSON.stringify([newNote, ...existingNotes]))
    }
    localStorage.setItem('bloomPlan', JSON.stringify({
      programId,
      subjects,
      minutesPerDay,
      hoursPerDay: minutesPerDay / 60,
      studyMode,
      customWork,
      customBreak,
      createdAt: new Date().toISOString(),
    }))
    setSaving(false)
    router.push('/planner')
  }

  async function handleNoteFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setNoteUploading(true)
    try {
      if (file.type === 'application/pdf') {
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            script.onload = () => resolve()
            script.onerror = reject
            document.head.appendChild(script)
          })
          ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        }
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const tc = await page.getTextContent()
          text += tc.items.map((item: any) => item.str).join(' ') + '\n'
        }
        setImportedNotes(prev => prev ? prev + '\n\n' + text.trim() : text.trim())
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = ev => {
          setImportedNotes(prev => prev + (prev ? '\n\n' : '') + '[Image attached: ' + file.name + ']')
        }
        reader.readAsDataURL(file)
      } else {
        const text = await file.text()
        setImportedNotes(prev => prev ? prev + '\n\n' + text : text)
      }
    } catch { alert('Could not read file. Try pasting text instead.') }
    finally { setNoteUploading(false) }
  }

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  return (
    <div className="min-h-screen bg-[#0d0d18] text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <span className="text-2xl">🌸</span>
        <div>
          <h1 className="font-bold text-lg">Study Plan Setup</h1>
          <p className="text-white/50 text-sm">Let Bloomie build your perfect revision schedule</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-violet-500 text-white' :
                i === step ? 'bg-violet-500/30 border border-violet-500 text-violet-300' :
                'bg-white/10 text-white/30'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-violet-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
        <div className="sm:hidden text-sm text-white/40">Step {step + 1}/{STEPS.length}</div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* STEP 0: Program */}
        {step === 0 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{"What's your program? 🎓"}</h2>
              <p className="text-white/50">{"We'll show you the right subjects for your curriculum."}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {PROGRAMS.map(p => (
                <button key={p.id} onClick={() => setProgramId(p.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    programId === p.id ? 'border-violet-500 bg-violet-500/20' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="font-semibold">{p.label}</div>
                  <div className="text-sm text-white/50 mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Subjects */}
        {step === 1 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Which subjects? 📚</h2>
              <p className="text-white/50">Select yours, or add custom ones below.</p>
            </div>

            {program && (
              <div className="space-y-5 mb-8">
                {program.subjects.map(group => (
                  <div key={group.group}>
                    <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{group.group}</div>
                    <div className="flex flex-wrap gap-2">
                      {group.subjects.map(subj => (
                        <button key={subj} onClick={() => toggleSubject(subj)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                            selectedSubjects.includes(subj) ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >{subj}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom subject input */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">+ Add custom subject</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                  placeholder="e.g. Business, Latin, Art History..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={addCustomSubject}
                  className="px-4 py-2 bg-violet-500 rounded-xl text-sm font-semibold hover:bg-violet-600 transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            {selectedSubjects.length > 0 && (
              <div className="mt-4 p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl">
                <div className="text-sm font-medium text-violet-300 mb-2">{selectedSubjects.length} subjects selected</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubjects.map(s => (
                    <span key={s} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-violet-500/20 rounded-full text-violet-300">
                      {s}
                      <button onClick={() => toggleSubject(s)} className="hover:text-red-400 transition-colors ml-1">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Exam Dates */}
        {step === 2 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">When are your exams? 📅</h2>
              <p className="text-white/50">No exam? Toggle daily revision mode instead.</p>
            </div>
            <div className="space-y-4">
              {selectedSubjects.map(subj => {
                const detail = subjectDetails[subj] || { name: subj, examDate: '', priority: 'medium', isDaily: false }
                return (
                  <div key={subj} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold">{subj}</div>
                      <button
                        onClick={() => updateDetail(subj, 'isDaily', !detail.isDaily)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                          detail.isDaily ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }`}
                      >
                        {detail.isDaily ? '✓ Daily revision' : '📆 Daily revision (no exam)'}
                      </button>
                    </div>

                    {!detail.isDaily ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/50 mb-1 block">Exam date</label>
                          <input
                            type="date"
                            value={detail.examDate}
                            onChange={e => updateDetail(subj, 'examDate', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                            style={{ colorScheme: 'dark' }}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/50 mb-1 block">Priority</label>
                          <select
                            value={detail.priority}
                            onChange={e => updateDetail(subj, 'priority', e.target.value as 'high'|'medium'|'low')}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                          >
                            {PRIORITIES.map(p => (
                              <option key={p.value} value={p.value} style={{ background: '#1a1028' }}>{p.label} — {p.desc}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Priority</label>
                        <select
                          value={detail.priority}
                          onChange={e => updateDetail(subj, 'priority', e.target.value as 'high'|'medium'|'low')}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                        >
                          {PRIORITIES.map(p => (
                            <option key={p.value} value={p.value} style={{ background: '#1a1028' }}>{p.label} — {p.desc}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Schedule */}
        {step === 3 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Build your schedule ⏰</h2>
              <p className="text-white/50">How much time can you study, and how do you like to work?</p>
            </div>

            {/* Time per day */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-violet-400 mb-1">{formatTime(minutesPerDay)}</div>
                <div className="text-white/50 text-sm">per day</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TIME_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setMinutesPerDay(preset.value)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      minutesPerDay === preset.value ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs text-white/40 shrink-0">Custom:</label>
                <input
                  type="range" min={15} max={480} step={5} value={minutesPerDay}
                  onChange={e => setMinutesPerDay(Number(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-sm text-white/60 w-16 text-right">{formatTime(minutesPerDay)}</span>
              </div>
            </div>

            {/* Study mode */}
            <div>
              <div className="text-sm font-semibold text-white/60 mb-3">How do you like to study?</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {STUDY_MODES.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setStudyMode(mode.value)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      studyMode === mode.value ? 'border-violet-500 bg-violet-500/20' : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-sm">{mode.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
              {studyMode === 'custom' && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Work session (min)</label>
                    <input type="number" min={5} max={120} value={customWork}
                      onChange={e => setCustomWork(Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Break (min)</label>
                    <input type="number" min={1} max={60} value={customBreak}
                      onChange={e => setCustomBreak(Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Import Notes (optional) */}
        {step === 4 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Import your notes 📄</h2>
              <p className="text-white/50">Optional — paste or upload notes to help Bloomie personalise your plan.</p>
            </div>
            <div className="space-y-4">
              <div
                onClick={() => noteFileRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                {noteUploading ? (
                  <p className="text-white/50 text-sm">⏳ Reading file...</p>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📎</div>
                    <p className="text-sm text-white/60">Click to upload a <span className="text-violet-400 font-semibold">PDF</span> or <span className="text-pink-400 font-semibold">text file</span></p>
                    <p className="text-xs text-white/20 mt-1">Text will be extracted automatically</p>
                  </div>
                )}
              </div>
              <input ref={noteFileRef} type="file" accept=".pdf,.txt,.md,image/*" onChange={handleNoteFile} className="hidden" />
              <div>
                <label className="text-xs text-white/50 mb-1 block">Or paste your notes here</label>
                <textarea
                  value={importedNotes}
                  onChange={e => setImportedNotes(e.target.value)}
                  rows={8}
                  placeholder={"Paste any notes, summaries, or topics you want Bloomie to know about...\n\nYou can also use 'Term: Definition' format for automatic flashcard generation."}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500 resize-none font-mono leading-relaxed"
                />
                {importedNotes && <p className="text-xs text-violet-400 mt-1">✨ {importedNotes.split('\n').filter(Boolean).length} lines imported</p>}
              </div>
              <p className="text-xs text-white/20 text-center">This step is optional — you can always add notes later in the Notes section.</p>
            </div>
          </div>
        )}

        {/* STEP 5: Done */}
        {step === 5 && (
          <div className="py-10">
            <div className="text-center mb-8">
              <div className="text-7xl mb-4">🌸</div>
              <h2 className="text-2xl font-bold mb-2">Bloomie has your plan!</h2>
              <p className="text-white/50 text-sm">
                {selectedSubjects.length} subjects · {formatTime(minutesPerDay)}/day ·{' '}
                {studyMode === 'pomodoro_25' ? 'Pomodoro 25/5' : studyMode === 'pomodoro_50' ? 'Pomodoro 50/10' : studyMode === 'custom' ? `${customWork}/${customBreak} min` : 'Standard'}
              </p>
            </div>

            {/* Preview of what sessions will look like */}
            <div className="mb-6">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Your sessions will look like this</div>
              <div className="space-y-2">
                {selectedSubjects.slice(0, 3).map((subj, i) => {
                  const topics = extractTopicsFromNotes(importedNotes, subj)
                  const previews = topics.length > 0
                    ? [`Review: ${topics[0]}`, topics[1] ? `Flashcards: ${topics[1]}` : `Practice problems — ${subj}`, topics[2] ? `Deep dive: ${topics[2]}` : `Active recall — ${subj}`]
                    : [`Review ${subj} notes`, `Practice problems — ${subj}`, `Active recall — ${subj}`]
                  return (
                    <div key={subj} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="text-xs text-white/40 mb-2">{subj}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {previews.slice(0, 2).map((p, j) => (
                          <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">{p}</span>
                        ))}
                        {topics.length > 0 && <span className="text-xs px-2 py-1 text-white/30">+{Math.max(0, topics.length - 2)} more topics</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
              {importedNotes.trim()
                ? <p className="text-xs text-green-400/70 mt-3 text-center">✓ Bloomie read your notes and will build sessions around your topics</p>
                : <p className="text-xs text-white/20 mt-3 text-center">No notes imported — sessions will use standard revision formats. You can add notes anytime.</p>
              }
            </div>

            <div className="text-center">
              <button onClick={savePlan} disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Building your plan...' : '🚀 Open My Plan'}
              </button>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-10">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 transition-all"
            >← Back</button>
            <button onClick={() => setStep(s => s === 4 ? 5 : s + 1)} disabled={!canProceed()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 font-semibold text-white hover:opacity-90 disabled:opacity-30 transition-all"
            >
              {step === 4 ? '✨ Generate Plan' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
