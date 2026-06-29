'use client'

import { useState, useEffect } from 'react'

type Note = {
  id: string
  subject: string
  title: string
  content: string
  createdAt: string
}

function parseFlashcards(content: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = []
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  
  for (const line of lines) {
    // Pattern: "Term: Definition" or "Term - Definition" or "Q: ... A: ..."
    const colonMatch = line.match(/^(.+?)\s*[:–-]\s*(.+)$/)
    if (colonMatch && colonMatch[1].length < 60 && colonMatch[2].length > 2) {
      cards.push({ front: colonMatch[1].trim(), back: colonMatch[2].trim() })
    }
  }
  
  // Also try to extract bullet point definitions
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i]
    if ((line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) && line.length < 80) {
      const term = line.replace(/^[•\-*]\s*/, '').trim()
      const next = lines[i + 1]
      if (next && !next.startsWith('•') && !next.startsWith('-') && !next.startsWith('*')) {
        cards.push({ front: term, back: next })
      }
    }
  }
  
  return cards.slice(0, 50) // max 50 cards per note
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [subjects, setSubjects] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('bloomNotes')
    if (saved) setNotes(JSON.parse(saved))
    const plan = localStorage.getItem('bloomPlan')
    if (plan) {
      const p = JSON.parse(plan)
      setSubjects(p.subjects?.map((s: { name: string }) => s.name) || [])
    }
  }, [])

  function saveNote() {
    const sub = customSubject.trim() || subject
    if (!sub || !title.trim() || !content.trim()) return
    const note: Note = {
      id: Date.now().toString(),
      subject: sub,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }
    const updated = [note, ...notes]
    setNotes(updated)
    localStorage.setItem('bloomNotes', JSON.stringify(updated))
    setSubject(''); setTitle(''); setContent(''); setCustomSubject(''); setShowForm(false)
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem('bloomNotes', JSON.stringify(updated))
    if (selectedNote?.id === id) setSelectedNote(null)
  }

  const grouped = notes.reduce<Record<string, Note[]>>((acc, note) => {
    acc[note.subject] = [...(acc[note.subject] || []), note]
    return acc
  }, {})

  const cards = selectedNote ? parseFlashcards(selectedNote.content) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black mb-1">📝 My Notes</h1>
          <p className="text-white/50 text-sm">Add your notes — Bloomie will turn them into flashcards automatically</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-all text-sm"
        >
          + Add Notes
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
          <h3 className="font-bold text-lg">New Note</h3>
          
          <div>
            <label className="text-xs text-white/50 mb-1 block">Subject</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {subjects.map(s => (
                <button key={s} onClick={() => { setSubject(s); setCustomSubject('') }}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-all ${subject === s && !customSubject ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >{s}</button>
              ))}
            </div>
            <input
              type="text"
              value={customSubject}
              onChange={e => { setCustomSubject(e.target.value); setSubject('') }}
              placeholder="Or type a custom subject..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Cell Division"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Notes content</label>
            <p className="text-xs text-white/30 mb-2">
              💡 Tip: Format as &quot;Term: Definition&quot; on each line for automatic flashcard generation
            </p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={'Mitosis: Cell division producing 2 identical daughter cells\nMeiosis: Division producing 4 haploid cells\nDNA: Deoxyribonucleic acid — carries genetic info\n\nOr just paste your notes freely...'}
              rows={10}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 font-mono leading-relaxed resize-none"
            />
            {content && (
              <p className="text-xs text-violet-400 mt-1">
                ✨ {parseFlashcards(content).length} flashcards will be generated from this
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={saveNote}
              className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 rounded-xl font-semibold text-white transition-all text-sm"
            >Save Note</button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 transition-all text-sm"
            >Cancel</button>
          </div>
        </div>
      )}

      {/* Note detail panel */}
      {selectedNote && (
        <div className="p-6 bg-white/5 border border-violet-500/30 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-violet-400 font-semibold mb-1">{selectedNote.subject}</div>
              <h3 className="font-bold text-lg">{selectedNote.title}</h3>
            </div>
            <div className="flex gap-2">
              <a href="/dashboard/flashcards"
                className="text-sm px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-300 hover:bg-violet-500/30 transition-all"
              >🃏 Study Flashcards</a>
              <button onClick={() => setSelectedNote(null)} className="text-white/30 hover:text-white text-lg leading-none px-2">×</button>
            </div>
          </div>
          <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto mb-4">{selectedNote.content}</pre>
          {cards.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <div className="text-xs text-white/40 mb-2">✨ {cards.length} flashcards generated</div>
              <div className="flex flex-wrap gap-2">
                {cards.slice(0, 5).map((c, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-white/5 rounded-full text-white/50 border border-white/10">{c.front}</span>
                ))}
                {cards.length > 5 && <span className="text-xs px-2.5 py-1 text-white/30">+{cards.length - 5} more</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes list */}
      {Object.keys(grouped).length === 0 && !showForm ? (
        <div className="text-center py-16 text-white/30">
          <div className="text-5xl mb-4">📝</div>
          <p className="font-medium">No notes yet</p>
          <p className="text-sm mt-1">Add your first note to get started with flashcards</p>
        </div>
      ) : (
        Object.entries(grouped).map(([subj, subNotes]) => (
          <div key={subj}>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">{subj}</div>
            <div className="space-y-2">
              {subNotes.map(note => {
                const noteCards = parseFlashcards(note.content)
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedNote?.id === note.id ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{note.title}</div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {noteCards.length > 0 && <span className="ml-2 text-violet-400">✨ {noteCards.length} flashcards</span>}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                        className="text-white/20 hover:text-red-400 transition-colors text-lg px-2"
                      >×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
