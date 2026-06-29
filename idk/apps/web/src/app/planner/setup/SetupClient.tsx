'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROGRAMS, getProgramById } from '@/lib/subjects'
import { PlanSubject, assignColors } from '@/lib/planner'

const STEPS = ['Program', 'Subjects', 'Exam Dates', 'Schedule', 'Done']

const PRIORITIES = [
  { value: 'high', label: '🔥 High', desc: 'Struggling with this' },
  { value: 'medium', label: '⚡ Medium', desc: 'Fairly confident' },
  { value: 'low', label: '💚 Low', desc: 'Got this covered' },
]

export default function SetupClient() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [programId, setProgramId] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [subjectDetails, setSubjectDetails] = useState<Record<string, { examDate: string; priority: 'high' | 'medium' | 'low' }>>({})
  const [hoursPerDay, setHoursPerDay] = useState(3)
  const [saving, setSaving] = useState(false)

  const program = getProgramById(programId)

  function toggleSubject(name: string) {
    setSelectedSubjects(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    )
    if (!subjectDetails[name]) {
      setSubjectDetails(prev => ({ ...prev, [name]: { examDate: '', priority: 'medium' } }))
    }
  }

  function updateSubjectDetail(name: string, field: 'examDate' | 'priority', value: string) {
    setSubjectDetails(prev => ({ ...prev, [name]: { ...prev[name], [field]: value } }))
  }

  function canProceed() {
    if (step === 0) return !!programId
    if (step === 1) return selectedSubjects.length > 0
    if (step === 2) return selectedSubjects.every(s => subjectDetails[s]?.examDate)
    if (step === 3) return hoursPerDay >= 1
    return true
  }

  function savePlan() {
    setSaving(true)
    const ids = selectedSubjects.map(s => s.toLowerCase().replace(/\s+/g, '_'))
    const colorMap = assignColors(ids.map(id => ({ id })))
    const subjects: PlanSubject[] = selectedSubjects.map((name, i) => ({
      id: ids[i],
      name,
      examDate: subjectDetails[name].examDate,
      color: colorMap[ids[i]],
      priority: subjectDetails[name].priority,
    }))
    localStorage.setItem('bloomPlan', JSON.stringify({ programId, subjects, hoursPerDay, createdAt: new Date().toISOString() }))
    setSaving(false)
    router.push('/planner')
  }

  return (
    <div className="min-h-screen bg-[#0d0d18] text-white">
      <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <span className="text-2xl">🌸</span>
        <div>
          <h1 className="font-bold text-lg">Study Plan Setup</h1>
          <p className="text-white/50 text-sm">Let Bloomie build your perfect revision schedule</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-violet-500 text-white' :
                i === step ? 'bg-violet-500/30 border border-violet-500 text-violet-300' :
                'bg-white/10 text-white/30'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-violet-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {step === 0 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{"What's your program? 🎓"}</h2>
              <p className="text-white/50">{"We'll show you the right subjects for your curriculum."}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {PROGRAMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProgramId(p.id)}
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

        {step === 1 && program && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Which subjects? 📚</h2>
              <p className="text-white/50">Select all the subjects you have exams for.</p>
            </div>
            <div className="space-y-6">
              {program.subjects.map(group => (
                <div key={group.group}>
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{group.group}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.subjects.map(subj => (
                      <button
                        key={subj}
                        onClick={() => toggleSubject(subj)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          selectedSubjects.includes(subj) ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedSubjects.length > 0 && (
              <div className="mt-6 p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl">
                <div className="text-sm font-medium text-violet-300">{selectedSubjects.length} subjects selected</div>
                <div className="text-xs text-white/50 mt-1">{selectedSubjects.join(', ')}</div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">When are your exams? 📅</h2>
              <p className="text-white/50">Add the date and how confident you feel for each subject.</p>
            </div>
            <div className="space-y-4">
              {selectedSubjects.map(subj => (
                <div key={subj} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <div className="font-semibold mb-3">{subj}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Exam date</label>
                      <input
                        type="date"
                        value={subjectDetails[subj]?.examDate || ''}
                        onChange={e => updateSubjectDetail(subj, 'examDate', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">Priority</label>
                      <select
                        value={subjectDetails[subj]?.priority || 'medium'}
                        onChange={e => updateSubjectDetail(subj, 'priority', e.target.value as 'high' | 'medium' | 'low')}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                      >
                        {PRIORITIES.map(p => (
                          <option key={p.value} value={p.value} style={{ background: '#1a1028' }}>
                            {p.label} — {p.desc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">How much can you study? ⏰</h2>
              <p className="text-white/50">Be realistic — consistent daily sessions beat cramming.</p>
            </div>
            <div className="text-center py-8">
              <div className="text-7xl font-bold text-violet-400 mb-2">{hoursPerDay}</div>
              <div className="text-white/50 mb-8">hours per day</div>
              <input
                type="range" min={1} max={8} value={hoursPerDay}
                onChange={e => setHoursPerDay(Number(e.target.value))}
                className="w-full max-w-xs accent-violet-500"
              />
              <div className="flex justify-between max-w-xs mx-auto mt-2 text-xs text-white/30">
                <span>1h</span><span>4h</span><span>8h</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { hours: 1, label: '🌱 Light', desc: '~2 sessions/day' },
                { hours: 3, label: '⚡ Moderate', desc: '~4 sessions/day' },
                { hours: 5, label: '🔥 Intense', desc: '~7 sessions/day' },
              ].map(preset => (
                <button
                  key={preset.hours}
                  onClick={() => setHoursPerDay(preset.hours)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    hoursPerDay === preset.hours ? 'border-violet-500 bg-violet-500/20' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="font-semibold text-sm">{preset.label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10">
            <div className="text-7xl mb-6">🌸</div>
            <h2 className="text-2xl font-bold mb-3">Bloomie is on it!</h2>
            <p className="text-white/50 mb-2">Your personalised study plan is ready.</p>
            <p className="text-white/30 text-sm mb-8">{selectedSubjects.length} subjects · {hoursPerDay}h/day</p>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-8">
              {selectedSubjects.slice(0, 4).map(s => (
                <div key={s} className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-center">{s}</div>
              ))}
              {selectedSubjects.length > 4 && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-center text-white/40">
                  +{selectedSubjects.length - 4} more
                </div>
              )}
            </div>
            <button
              onClick={savePlan}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? 'Generating...' : '🚀 Open My Plan'}
            </button>
          </div>
        )}

        {step < 4 && (
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-5 py-2.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(s => s === 3 ? 4 : s + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 font-semibold text-white hover:opacity-90 disabled:opacity-30 transition-all"
            >
              {step === 3 ? '✨ Generate Plan' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
