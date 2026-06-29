'use client'

import { useState, useEffect } from 'react'

type Card = { front: string; back: string; subject: string; noteTitle: string }
type Note = { id: string; subject: string; title: string; content: string }

// Words that are never useful as flashcard fronts
const JUNK_TERMS = new Set([
  'optional','mandatory','note','example','see','tip','important','remember',
  'hint','also','source','sources','references','summary','overview','intro',
  'introduction','conclusion','definition','description','explanation',
  'instructions','task','tasks','objective','objectives','goal','goals',
])

function isJunkTerm(term: string): boolean {
  const lower = term.toLowerCase().replace(/[^a-z]/g,'')
  return JUNK_TERMS.has(lower) || term.length < 3 || term.length > 70
}

function truncateBack(back: string): string {
  // Truncate long backs to first sentence or 120 chars
  const firstSentence = back.match(/^[^.!?]+[.!?]/)
  if (firstSentence && firstSentence[0].length < 150) return firstSentence[0].trim()
  if (back.length > 120) return back.slice(0, 120).trim() + '…'
  return back
}

function parseCards(note: Note): Card[] {
  const cards: Card[] = []
  const lines = note.content.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    // Pattern 1: "Term: Definition" or "Term — Definition"
    const colonMatch = line.match(/^(.+?)\s*[:–—]\s*(.+)$/)
    if (colonMatch) {
      const front = colonMatch[1].replace(/^[-•*#\d.]+\s*/,'').trim()
      const back = colonMatch[2].trim()
      if (!isJunkTerm(front) && back.length > 4) {
        cards.push({ front, back: truncateBack(back), subject: note.subject, noteTitle: note.title })
        continue
      }
    }

    // Pattern 2: "X is Y" / "X are Y" → "What is X?" / Y
    const isMatch = line.match(/^(.{4,50})\s+(?:is|are|refers to|means|=)\s+(.{5,120})$/i)
    if (isMatch) {
      const term = isMatch[1].trim()
      const def = isMatch[2].trim().replace(/\.$/, '')
      if (!isJunkTerm(term)) {
        const verb = line.match(/\bare\b/i) ? 'are' : 'is'
        cards.push({
          front: `What ${verb} ${term}?`,
          back: def,
          subject: note.subject,
          noteTitle: note.title,
        })
        continue
      }
    }

    // Pattern 3: Bullet with short term + explanation in brackets
    const bulletMatch = line.match(/^[-•*]\s+(.{3,50})\s+[\(\[](.{5,100})[\)\]]/)
    if (bulletMatch) {
      cards.push({
        front: bulletMatch[1].trim(),
        back: bulletMatch[2].trim(),
        subject: note.subject,
        noteTitle: note.title,
      })
    }
  }

  // Deduplicate by front
  const seen = new Set<string>()
  return cards.filter(c => {
    if (seen.has(c.front.toLowerCase())) return false
    seen.add(c.front.toLowerCase())
    return true
  })
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function FlashcardsPage() {
  const [allCards, setAllCards] = useState<Card[]>([])
  const [deck, setDeck] = useState<Card[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [unknown, setUnknown] = useState<Set<number>>(new Set())
  const [filterSubject, setFilterSubject] = useState('all')
  const [mode, setMode] = useState<'browse' | 'study' | 'done'>('browse')
  const [subjects, setSubjects] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('bloomNotes')
    if (saved) {
      const notes: Note[] = JSON.parse(saved)
      const cards = notes.flatMap(n => parseCards(n))
      setAllCards(cards)
      const subs = [...new Set(notes.map(n => n.subject))]
      setSubjects(subs)
    }
  }, [])

  function startStudy() {
    const filtered = filterSubject === 'all' ? allCards : allCards.filter(c => c.subject === filterSubject)
    setDeck(shuffle(filtered))
    setCurrentIdx(0)
    setFlipped(false)
    setKnown(new Set())
    setUnknown(new Set())
    setMode('study')
  }

  function next(knew: boolean) {
    if (knew) setKnown(prev => new Set([...prev, currentIdx]))
    else setUnknown(prev => new Set([...prev, currentIdx]))
    setFlipped(false)
    if (currentIdx + 1 >= deck.length) {
      setMode('done')
    } else {
      setTimeout(() => setCurrentIdx(i => i + 1), 150)
    }
  }

  const card = deck[currentIdx]
  const progress = deck.length > 0 ? ((currentIdx) / deck.length) * 100 : 0

  if (allCards.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🃏</div>
        <h2 className="text-2xl font-bold mb-2">No flashcards yet</h2>
        <p className="text-white/50 mb-6">Add notes first — Bloomie will generate flashcards automatically from your &quot;Term: Definition&quot; format notes.</p>
        <a href="/dashboard/notes"
          className="px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-2xl font-semibold text-white transition-all"
        >📝 Go add notes</a>
      </div>
    )
  }

  if (mode === 'done') {
    const total = deck.length
    const knownCount = known.size
    const pct = Math.round((knownCount / total) * 100)
    return (
      <div className="text-center py-10 max-w-md mx-auto">
        <div className="text-6xl mb-6">{pct >= 80 ? '🎉' : pct >= 50 ? '💪' : '📚'}</div>
        <h2 className="text-2xl font-bold mb-2">Session complete!</h2>
        <p className="text-white/50 mb-6">{knownCount}/{total} cards correct — {pct}%</p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
            <div className="text-2xl font-bold text-green-400">{knownCount}</div>
            <div className="text-xs text-white/40 mt-1">Got it ✓</div>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <div className="text-2xl font-bold text-red-400">{unknown.size}</div>
            <div className="text-xs text-white/40 mt-1">Need practice</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={startStudy}
            className="px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-2xl font-semibold text-white transition-all"
          >🔄 Restart</button>
          {unknown.size > 0 && (
            <button onClick={() => {
              setDeck(shuffle([...unknown].map(i => deck[i])))
              setCurrentIdx(0); setFlipped(false)
              setKnown(new Set()); setUnknown(new Set())
              setMode('study')
            }}
              className="px-6 py-3 bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 rounded-2xl font-semibold text-amber-300 transition-all"
            >⚡ Study weak cards</button>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'study' && card) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setMode('browse')} className="text-sm text-white/40 hover:text-white transition-all">← Back</button>
          <div className="text-sm text-white/50">{currentIdx + 1} / {deck.length}</div>
          <div className="text-xs text-white/30">{card.subject}</div>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setFlipped(f => !f)}
          className="cursor-pointer"
          style={{ perspective: '1000px' }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '260px',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>
            {/* Front */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px',
            }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>QUESTION</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', textAlign: 'center', color: 'white', lineHeight: 1.4 }}>{card.front}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '24px' }}>Tap to reveal answer</div>
            </div>
            {/* Back */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(96,165,250,0.1))',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px',
            }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>ANSWER</div>
              <div style={{ fontSize: '20px', fontWeight: '600', textAlign: 'center', color: 'white', lineHeight: 1.5 }}>{card.back}</div>
            </div>
          </div>
        </div>

        {flipped && (
          <div className="flex gap-4 mt-6 justify-center">
            <button onClick={() => next(false)}
              className="flex-1 max-w-[160px] py-3 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 rounded-2xl font-semibold text-red-300 transition-all"
            >✗ Still learning</button>
            <button onClick={() => next(true)}
              className="flex-1 max-w-[160px] py-3 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 rounded-2xl font-semibold text-green-300 transition-all"
            >✓ Got it!</button>
          </div>
        )}
        {!flipped && (
          <p className="text-center text-white/30 text-sm mt-6">Tap the card to flip it</p>
        )}
      </div>
    )
  }

  // BROWSE MODE
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-1">🃏 Flashcards</h1>
        <p className="text-white/50 text-sm">{allCards.length} cards from your notes</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', ...subjects].map(s => (
          <button key={s} onClick={() => setFilterSubject(s)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              filterSubject === s ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {s === 'all' ? '📚 All subjects' : s}
            <span className="ml-1.5 text-xs opacity-60">
              ({s === 'all' ? allCards.length : allCards.filter(c => c.subject === s).length})
            </span>
          </button>
        ))}
      </div>

      <button onClick={startStudy}
        className="w-full py-4 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl font-bold text-white hover:opacity-90 transition-all text-lg"
      >
        🚀 Start Study Session ({filterSubject === 'all' ? allCards.length : allCards.filter(c => c.subject === filterSubject).length} cards)
      </button>

      <div className="space-y-2">
        {(filterSubject === 'all' ? allCards : allCards.filter(c => c.subject === filterSubject)).slice(0, 20).map((card, i) => (
          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium text-sm">{card.front}</div>
                <div className="text-xs text-white/40 mt-1">{card.back}</div>
              </div>
              <span className="text-xs px-2 py-0.5 bg-white/5 rounded-full text-white/30 shrink-0">{card.subject}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
