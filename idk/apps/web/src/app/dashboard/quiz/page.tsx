'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { BloomieChat } from '@/components/ui/Bloomie'
import { Button } from '@/components/ui/Button'

// Expandable built-in question bank per subject
const QUESTION_BANK: Record<string, { q: string; options: string[]; correct: number }[]> = {
  Math: [
    { q: 'What is the derivative of x²?', options: ['x', '2x', 'x²', '2'], correct: 1 },
    { q: 'Solve: 3x + 6 = 21', options: ['x = 3', 'x = 5', 'x = 7', 'x = 9'], correct: 1 },
    { q: 'What is √144?', options: ['11', '12', '13', '14'], correct: 1 },
  ],
  Biology: [
    { q: 'What organelle is the "powerhouse of the cell"?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi apparatus'], correct: 2 },
    { q: 'What is the process by which plants make food?', options: ['Respiration', 'Photosynthesis', 'Transpiration', 'Osmosis'], correct: 1 },
  ],
  Chemistry: [
    { q: 'What is the chemical symbol for Gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correct: 2 },
    { q: 'How many electrons does Carbon have?', options: ['4', '6', '8', '12'], correct: 1 },
  ],
  History: [
    { q: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], correct: 2 },
    { q: 'Who was the first US president?', options: ['John Adams', 'Thomas Jefferson', 'Abraham Lincoln', 'George Washington'], correct: 3 },
  ],
}

export default function QuizPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [questions, setQuestions] = useState<typeof QUESTION_BANK[string]>([])
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const loadSubjects = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('subjects').eq('id', user.id).single()
    if (data) setSubjects((data as { subjects: string[] }).subjects || [])
  }, [supabase])

  useEffect(() => { loadSubjects() }, [loadSubjects])

  function startQuiz(subject: string) {
    const bank = QUESTION_BANK[subject] || QUESTION_BANK['Math']
    const shuffled = [...bank].sort(() => Math.random() - 0.5).slice(0, 5)
    setSelected(subject)
    setQuestions(shuffled)
    setIdx(0); setScore(0); setChosen(null); setDone(false)
  }

  async function handleAnswer(i: number) {
    if (chosen !== null) return
    setChosen(i)
    const correct = questions[idx].correct === i
    if (correct) setScore(s => s + 1)

    // Save result
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('quiz_results').insert({
        user_id: user.id, subject: selected,
        correct: correct ? 1 : 0, total: 1,
      })
    }

    setTimeout(() => {
      if (idx + 1 >= questions.length) setDone(true)
      else { setIdx(i => i + 1); setChosen(null) }
    }, 1200)
  }

  if (!selected) return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-1">🧠 Quiz</h1>
        <p className="text-white/50 text-sm">Test yourself and find your weak spots</p>
      </div>
      <BloomieChat message="Pick a subject and let's see what you know! I'll track your weak spots 👀" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {(subjects.length > 0 ? subjects : Object.keys(QUESTION_BANK)).map(s => (
          <button key={s} onClick={() => startQuiz(s)}
            className="card text-center hover:border-violet-400/30 hover:bg-violet-500/10 cursor-pointer transition-all py-8"
          >
            <div className="text-3xl mb-3">📚</div>
            <p className="font-bold">{s}</p>
            <p className="text-xs text-white/40 mt-1">{QUESTION_BANK[s]?.length || 3} questions</p>
          </button>
        ))}
      </div>
    </div>
  )

  if (done) return (
    <div className="space-y-8 max-w-lg mx-auto text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong p-10">
        <div className="text-6xl mb-4">{score >= questions.length * 0.8 ? '🏆' : score >= questions.length * 0.5 ? '⭐' : '💪'}</div>
        <h2 className="text-3xl font-black mb-3">
          {score}/{questions.length} correct
        </h2>
        <p className="text-white/60 mb-2">{selected}</p>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(score / questions.length) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <BloomieChat message={
          score === questions.length ? "PERFECT SCORE! You're literally a genius bestie! 🌟" :
          score >= questions.length * 0.7 ? "Amazing work! A couple more sessions and you'll nail it! 💪" :
          "Don't worry, that's what practice is for! Let's review those together~ 📖"
        } className="text-left mb-6" />
        <div className="flex gap-3 justify-center">
          <Button onClick={() => startQuiz(selected)}>Retry</Button>
          <Button variant="ghost" onClick={() => setSelected('')}>New subject</Button>
        </div>
      </motion.div>
    </div>
  )

  const q = questions[idx]

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">🧠 {selected}</h1>
        <span className="glass px-4 py-2 text-sm">{idx + 1} / {questions.length}</span>
      </div>

      {/* Progress */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
          animate={{ width: `${((idx) / questions.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          className="glass-strong p-8 space-y-6"
        >
          <p className="text-xl font-bold leading-relaxed">{q.q}</p>
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((opt, i) => {
              const isChosen  = chosen === i
              const isCorrect = q.correct === i
              const revealed  = chosen !== null
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={revealed}
                  className={`p-4 rounded-xl border text-left font-medium transition-all ${
                    revealed
                      ? isCorrect ? 'border-green-400 bg-green-500/20 text-green-300'
                        : isChosen ? 'border-red-400 bg-red-500/20 text-red-300'
                        : 'border-white/10 text-white/30'
                      : 'border-white/15 hover:border-violet-400 hover:bg-violet-500/10'
                  }`}
                >
                  <span className="mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span>{opt}
                  {revealed && isCorrect && <span className="float-right">✓</span>}
                  {revealed && isChosen && !isCorrect && <span className="float-right">✗</span>}
                </button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
