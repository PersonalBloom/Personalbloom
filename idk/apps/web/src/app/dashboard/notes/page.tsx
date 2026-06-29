'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Note = {
  id: string
  subject: string
  title: string
  content: string
  imageUrl?: string
  createdAt: string
}

export type Textbook = {
  id: string
  subject: string
  title: string
  filename: string
  content: string   // full extracted text (capped at 120k chars)
  pageCount: number
  addedAt: string
}

function parseFlashcards(content: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = []
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    const colonMatch = line.match(/^(.+?)\s*[:–-]\s*(.+)$/)
    if (colonMatch && colonMatch[1].length < 60 && colonMatch[2].length > 2) {
      cards.push({ front: colonMatch[1].trim(), back: colonMatch[2].trim() })
    }
  }
  return cards.slice(0, 50)
}

async function extractPdfText(file: File, onProgress?: (p: number) => void): Promise<{ text: string; pages: number }> {
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
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map((item: any) => item.str).join(' ')
    fullText += pageText + '\n'
    if (onProgress) onProgress(Math.round((i / pdf.numPages) * 100))
  }
  return { text: fullText.trim().slice(0, 120000), pages: pdf.numPages }
}

// ─── Notes Tab ─────────────────────────────────────────────────────────────

function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([])
  const [showForm, setShowForm] = useState(true)
  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [subjects, setSubjects] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('bloomNotes')
    if (saved) setNotes(JSON.parse(saved))
    const plan = localStorage.getItem('bloomPlan')
    if (plan) {
      const p = JSON.parse(plan)
      setSubjects(p.subjects?.map((s: { name: string }) => s.name) || [])
    }
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadedImage(null)
    try {
      if (file.type === 'application/pdf') {
        const { text } = await extractPdfText(file)
        setContent(prev => prev ? prev + '\n\n' + text : text)
        if (!title) setTitle(file.name.replace('.pdf', ''))
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          setUploadedImage(dataUrl)
          if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
        }
        reader.readAsDataURL(file)
      }
    } catch { alert('Could not read file. Try copying and pasting the text instead.') }
    finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function saveNote() {
    const sub = customSubject.trim() || subject
    if (!sub || !title.trim() || (!content.trim() && !uploadedImage)) return
    const note: Note = {
      id: Date.now().toString(),
      subject: sub,
      title: title.trim(),
      content: content.trim(),
      imageUrl: uploadedImage || undefined,
      createdAt: new Date().toISOString(),
    }
    const updated = [note, ...notes]
    setNotes(updated)
    localStorage.setItem('bloomNotes', JSON.stringify(updated))
    setSubject(''); setTitle(''); setContent(''); setCustomSubject('')
    setUploadedImage(null); setShowForm(false)
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem('bloomNotes', JSON.stringify(updated))
    if (selectedNote?.id === id) setSelectedNote(null)
  }

  const grouped = notes.reduce<Record<string, Note[]>>((acc, n) => {
    acc[n.subject] = [...(acc[n.subject] || []), n]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm">Paste notes, upload PDFs or photos — Bloomie turns them into flashcards</p>
        <button onClick={() => setShowForm(s => !s)}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-all text-sm"
        >{showForm ? '✕ Close' : '+ Add Notes'}</button>
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
            <input type="text" value={customSubject}
              onChange={e => { setCustomSubject(e.target.value); setSubject('') }}
              placeholder="Or type a custom subject..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 — Cell Division"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-2 block">Upload file (optional)</label>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
            >
              {uploading ? <div className="text-white/50 text-sm">⏳ Reading file...</div>
                : uploadedImage ? (
                  <div>
                    <img src={uploadedImage} alt="Uploaded" className="max-h-40 mx-auto rounded-lg mb-2 object-contain" />
                    <p className="text-xs text-green-400">✓ Image attached</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm text-white/50">Click to upload a <span className="text-violet-400">PDF</span> or <span className="text-pink-400">photo</span></p>
                  </div>
                )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Notes content</label>
            <p className="text-xs text-white/30 mb-2">💡 Format as "Term: Definition" for automatic flashcard generation</p>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={'Mitosis: Cell division producing 2 identical daughter cells\nMeiosis: Division producing 4 haploid cells\n\nOr just paste your notes freely...'}
              rows={8}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 font-mono leading-relaxed resize-none"
            />
            {content && <p className="text-xs text-violet-400 mt-1">✨ {parseFlashcards(content).length} flashcards will be generated</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={saveNote} className="px-5 py-2.5 bg-violet-500 hover:bg-violet-600 rounded-xl font-semibold text-white transition-all text-sm">Save Note</button>
            <button onClick={() => { setShowForm(false); setUploadedImage(null) }} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 transition-all text-sm">Cancel</button>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="p-6 bg-white/5 border border-violet-500/30 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-violet-400 font-semibold mb-1">{selectedNote.subject}</div>
              <h3 className="font-bold text-lg">{selectedNote.title}</h3>
            </div>
            <div className="flex gap-2">
              <a href="/dashboard/flashcards" className="text-sm px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-300 hover:bg-violet-500/30 transition-all">🃏 Study Flashcards</a>
              <button onClick={() => setSelectedNote(null)} className="text-white/30 hover:text-white text-lg leading-none px-2">×</button>
            </div>
          </div>
          {selectedNote.imageUrl && <img src={selectedNote.imageUrl} alt="Note" className="max-h-60 rounded-xl mb-4 object-contain" />}
          {selectedNote.content && <pre className="text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto mb-4">{selectedNote.content}</pre>}
        </div>
      )}

      {Object.keys(grouped).length === 0 && !showForm ? (
        <div className="text-center py-16 text-white/30">
          <div className="text-5xl mb-4">📝</div>
          <p className="font-medium">No notes yet</p>
        </div>
      ) : (
        Object.entries(grouped).map(([subj, subNotes]) => (
          <div key={subj}>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">{subj}</div>
            <div className="space-y-2">
              {subNotes.map(note => (
                <div key={note.id}
                  onClick={() => setSelectedNote(selectedNote?.id === note.id ? null : note)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedNote?.id === note.id ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {note.imageUrl && <span className="text-lg">🖼️</span>}
                      <div>
                        <div className="font-medium text-sm">{note.title}</div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {parseFlashcards(note.content).length > 0 && <span className="ml-2 text-violet-400">✨ {parseFlashcards(note.content).length} flashcards</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteNote(note.id) }} className="text-white/20 hover:text-red-400 transition-colors text-lg px-2">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Textbooks Tab ──────────────────────────────────────────────────────────

function TextbooksTab() {
  const [textbooks, setTextbooks] = useState<Textbook[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('bloomTextbooks')
    if (saved) setTextbooks(JSON.parse(saved))
    const plan = localStorage.getItem('bloomPlan')
    if (plan) {
      const p = JSON.parse(plan)
      setSubjects(p.subjects?.map((s: { name: string }) => s.name) || [])
    }
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return
    const subject = customSubject.trim() || selectedSubject
    if (!subject) { alert('Please select a subject first'); return }

    setUploading(true)
    setProgress(0)
    try {
      const { text, pages } = await extractPdfText(file, p => setProgress(p))
      const tb: Textbook = {
        id: Date.now().toString(),
        subject,
        title: file.name.replace('.pdf', '').replace(/_/g, ' '),
        filename: file.name,
        content: text,
        pageCount: pages,
        addedAt: new Date().toISOString(),
      }
      const updated = [tb, ...textbooks.filter(t => t.subject !== subject)]
      setTextbooks(updated)
      localStorage.setItem('bloomTextbooks', JSON.stringify(updated))
      setSelectedSubject(''); setCustomSubject('')
    } catch { alert('Could not read PDF. Make sure it\'s a text-based PDF (not scanned).') }
    finally { setUploading(false); setProgress(0); if (fileRef.current) fileRef.current.value = '' }
  }

  function deleteTextbook(id: string) {
    const updated = textbooks.filter(t => t.id !== id)
    setTextbooks(updated)
    localStorage.setItem('bloomTextbooks', JSON.stringify(updated))
  }

  const subject = customSubject.trim() || selectedSubject

  return (
    <div className="space-y-6">
      <p className="text-white/50 text-sm">Upload your textbooks once — Bloomie reads them so every study session and revision prompt is based on your exact syllabus content.</p>

      {/* Upload card */}
      <div className="p-6 bg-gradient-to-br from-blue-500/10 to-violet-500/5 border border-blue-500/20 rounded-2xl space-y-4">
        <h3 className="font-bold">📚 Upload a Textbook</h3>

        <div>
          <label className="text-xs text-white/50 mb-2 block">Which subject is this for?</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {subjects.map(s => (
              <button key={s} onClick={() => { setSelectedSubject(s); setCustomSubject('') }}
                className={`px-3 py-1.5 rounded-xl text-sm transition-all ${selectedSubject === s && !customSubject ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >{s}</button>
            ))}
          </div>
          <input type="text" value={customSubject}
            onChange={e => { setCustomSubject(e.target.value); setSelectedSubject('') }}
            placeholder="Or type a subject name..."
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div
          onClick={() => subject ? fileRef.current?.click() : alert('Select a subject first')}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            subject ? 'border-blue-500/40 hover:border-blue-500/80 hover:bg-blue-500/5 cursor-pointer' : 'border-white/10 cursor-not-allowed opacity-50'
          }`}
        >
          {uploading ? (
            <div>
              <div className="text-white/70 text-sm mb-3">⏳ Extracting text from PDF... {progress}%</div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div>
              <div className="text-5xl mb-3">📖</div>
              <p className="text-white/70 font-medium mb-1">Drop your textbook PDF here</p>
              <p className="text-xs text-white/30">Text-based PDFs only · Scanned pages won't extract · Up to ~600 pages recommended</p>
              {subject && <p className="text-xs text-blue-400 mt-2">Will be indexed as: <strong>{subject}</strong></p>}
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
      </div>

      {/* Textbook list */}
      {textbooks.length === 0 ? (
        <div className="text-center py-12 text-white/20">
          <div className="text-4xl mb-3">📚</div>
          <p>No textbooks uploaded yet</p>
          <p className="text-sm mt-1">Upload a textbook above and Bloomie will use it for all your study sessions</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-widest">Your Textbooks</div>
          {textbooks.map(tb => (
            <div key={tb.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl mt-0.5">📖</div>
                <div>
                  <div className="font-semibold text-sm">{tb.title}</div>
                  <div className="text-xs text-blue-400 mt-0.5 font-medium">{tb.subject}</div>
                  <div className="text-xs text-white/30 mt-1">
                    {tb.pageCount} pages · {Math.round(tb.content.length / 1000)}k chars extracted
                    {' · '}{new Date(tb.addedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-green-400 mt-1">✓ Active — used for study topics &amp; revision prompts</div>
                </div>
              </div>
              <button onClick={() => deleteTextbook(tb.id)} className="text-white/20 hover:text-red-400 transition-colors text-xl px-1 flex-shrink-0">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────

function NotesPageInner() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'notes' | 'textbooks'>(
    searchParams.get('tab') === 'textbooks' ? 'textbooks' : 'notes'
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">📝 My Notes</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {([
          { id: 'notes',     label: '📋 Class Notes' },
          { id: 'textbooks', label: '📚 Textbooks' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px ${
              tab === t.id ? 'text-white border-violet-500 bg-white/5' : 'text-white/40 border-transparent hover:text-white/70'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'notes' ? <NotesTab /> : <TextbooksTab />}
    </div>
  )
}

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesPageInner />
    </Suspense>
  )
}
