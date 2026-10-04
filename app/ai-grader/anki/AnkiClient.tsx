'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { UploadCloud, Loader2, PlayCircle, BookOpen, ChevronLeft, ChevronRight, RotateCcw, Tag, Layers } from 'lucide-react'

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then(m => m.ActivityCalendar),
  { ssr: false, loading: () => <div className="h-32" /> }
)

interface AnkiCard {
  id: string
  modelId: string
  tags: string
  front: string
  back: string
  extra: string[]
}

interface AnkiDeck {
  id: string
  name: string
}

// Clean Anki HTML: strip [sound:...] tags and clean up
function cleanAnkiHtml(html: string): string {
  return html
    .replace(/\[sound:[^\]]+\]/g, '')
    .replace(/<img[^>]+src="([^"]+)"[^>]*>/gi, '<span class="anki-img-placeholder">🖼️ [Hình ảnh]</span>')
    .trim()
}

// Generate 366 days of empty activity data (from a year ago to today)
function generateEmptyActivity() {
  const data = []
  const today = new Date()
  for (let i = 365; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    data.push({ date: d.toISOString().split('T')[0], count: 0, level: 0 as 0 | 1 | 2 | 3 | 4 })
  }
  return data
}

function loadActivityFromStorage(): { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] {
  const base = generateEmptyActivity()
  try {
    const stored = JSON.parse(localStorage.getItem('anki_activity') || '{}')
    return base.map(d => {
      const count = stored[d.date] || 0
      const level = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4
      return { ...d, count, level: level as 0 | 1 | 2 | 3 | 4 }
    })
  } catch {
    return base
  }
}

function recordActivity() {
  try {
    const stored = JSON.parse(localStorage.getItem('anki_activity') || '{}')
    const today = new Date().toISOString().split('T')[0]
    stored[today] = (stored[today] || 0) + 1
    localStorage.setItem('anki_activity', JSON.stringify(stored))
  } catch {}
}

export default function AnkiClient() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [cards, setCards] = useState<AnkiCard[]>([])
  const [decks, setDecks] = useState<AnkiDeck[]>([])
  const [activityData, setActivityData] = useState(generateEmptyActivity())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isStudying, setIsStudying] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActivityData(loadActivityFromStorage())
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''

    setIsUploading(true)
    setError('')
    setCards([])
    setDecks([])

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/anki-parse', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi không xác định')
      }

      setCards(data.notes)
      setDecks(data.decks)
    } catch (err: any) {
      setError(err.message || 'Có lỗi khi đọc file Anki.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    const synth = { target: { files: e.dataTransfer.files, value: '' } } as any
    handleFileUpload(synth)
  }

  const startStudying = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsStudying(true)
  }

  const flipCard = () => {
    if (!isFlipped) recordActivity()
    setIsFlipped(!isFlipped)
    setActivityData(loadActivityFromStorage())
  }

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentIndex(i => Math.min(i + 1, cards.length - 1))
  }

  const prevCard = () => {
    setIsFlipped(false)
    setCurrentIndex(i => Math.max(i - 1, 0))
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="min-h-screen bg-page py-10">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-ink mb-3 tracking-tight flex items-center justify-center gap-3">
            <BookOpen className="w-10 h-10 text-primary" />
            VNDocs Anki
          </h1>
          <p className="text-ink-muted text-lg max-w-xl mx-auto">
            Nhập file <span className="font-semibold text-ink">.apkg</span> của bạn và học từ vựng thông minh hơn với Spaced Repetition.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Upload zone */}
        {!isStudying && (
          <div
            className="bg-surface rounded-3xl border-2 border-dashed border-line hover:border-primary transition-all p-10 text-center relative mb-6"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".apkg,.colpkg"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <div className="flex flex-col items-center gap-4 pointer-events-none">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                {isUploading ? <Loader2 className="w-9 h-9 animate-spin" /> : <UploadCloud className="w-9 h-9" />}
              </div>
              <div>
                <p className="text-lg font-bold text-ink mb-1">
                  {isUploading ? 'Đang xử lý file...' : 'Kéo thả hoặc click để chọn file .apkg'}
                </p>
                <p className="text-sm text-ink-muted">Hỗ trợ: .apkg, .colpkg — Tất cả các loại deck của Anki</p>
              </div>
            </div>
          </div>
        )}

        {/* Deck info + Start button */}
        {cards.length > 0 && !isStudying && (
          <div className="bg-surface rounded-3xl border border-line p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-primary" />
                <span className="font-bold text-ink text-lg">Đã tải xong!</span>
              </div>
              <p className="text-ink-muted text-sm">
                <strong className="text-ink">{cards.length}</strong> thẻ từ vựng
                {decks.length > 0 && <> • {decks.length} deck: <span className="font-medium text-ink">{decks.map(d => d.name).join(', ')}</span></>}
              </p>
            </div>
            <button
              onClick={startStudying}
              className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-primary/90 hover:scale-105 transition-all flex items-center gap-2 shadow-lg shrink-0"
            >
              <PlayCircle className="w-5 h-5" /> Bắt đầu học
            </button>
          </div>
        )}

        {/* Flashcard study mode */}
        {isStudying && currentCard && (
          <div className="mb-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-ink-muted mb-3">
              <span>Thẻ {currentIndex + 1} / {cards.length}</span>
              <button onClick={() => setIsStudying(false)} className="text-primary hover:underline flex items-center gap-1">
                <RotateCcw className="w-4 h-4" /> Import file khác
              </button>
            </div>
            <div className="w-full bg-line rounded-full h-1.5 mb-6">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
            </div>

            {/* Card */}
            <div
              onClick={flipCard}
              className="bg-surface rounded-3xl border border-line shadow-sm cursor-pointer hover:shadow-md transition-all select-none min-h-[280px] flex flex-col items-center justify-center p-10 text-center mb-4 relative"
            >
              {!isFlipped ? (
                <div>
                  <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-4">Mặt trước — Nhấp để xem đáp án</p>
                  <div
                    className="text-2xl font-bold text-ink leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: cleanAnkiHtml(currentCard.front) }}
                  />
                  {currentCard.tags && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {currentCard.tags.split(' ').filter(Boolean).map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-3 py-1">
                          <Tag className="w-3 h-3" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-4">Mặt sau</p>
                  <div
                    className="text-xl text-ink leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: cleanAnkiHtml(currentCard.back) }}
                  />
                  {currentCard.extra.length > 0 && (
                    <div
                      className="mt-4 text-sm text-ink-muted border-t border-line pt-4"
                      dangerouslySetInnerHTML={{ __html: cleanAnkiHtml(currentCard.extra.join(' • ')) }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={prevCard}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface border border-line hover:border-primary hover:text-primary transition-all disabled:opacity-40 font-medium"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </button>
              <button
                onClick={flipCard}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-sm"
              >
                {isFlipped ? '🔄 Lật lại' : '👁️ Xem đáp án'}
              </button>
              <button
                onClick={nextCard}
                disabled={currentIndex === cards.length - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface border border-line hover:border-primary hover:text-primary transition-all disabled:opacity-40 font-medium"
              >
                Tiếp <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Activity Calendar */}
        <div className="bg-surface rounded-3xl border border-line p-6 overflow-hidden">
          <h2 className="text-base font-bold text-ink mb-5 flex items-center gap-2">
            🔥 Lịch sử học tập của bạn
          </h2>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[700px]">
              <ActivityCalendar
                data={activityData}
                theme={{
                  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                  dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                }}
                labels={{
                  months: ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'],
                  weekdays: ['CN','T2','T3','T4','T5','T6','T7'],
                  totalCount: '{{count}} từ vựng đã học trong năm qua',
                  legend: { less: 'Ít', more: 'Nhiều' },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
