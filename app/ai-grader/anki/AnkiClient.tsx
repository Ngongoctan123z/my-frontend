'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import localforage from 'localforage'
import { UploadCloud, Loader2, PlayCircle, BookOpen, ChevronLeft, Tag, Layers, Trash2, Folder, BrainCircuit, Activity, Calendar, FileText, CheckCircle2, Settings } from 'lucide-react'
import { parseSqliteAnki, AnkiNote } from './sqlite-reader'
import { FieldMappingModal, CardConfig, defaultConfig } from './FieldMappingModal'

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then(m => m.ActivityCalendar),
  { ssr: false, loading: () => <div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div> }
)

interface CardStudyState { reps: number; ivl: number; ef: number; due: number }

interface AnkiDeck {
  id: string
  name: string
  notes: AnkiNote[]
  mediaMap: Record<string, Blob>
  importedAt: number
  studyState: Record<string, CardStudyState>
}

/* ---------- helpers ---------- */

const hasContent = (v = '') =>
  v.replace(/\[sound:[^\]]+\]/g, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0 ||
  /<img|\[sound:/i.test(v)

// bỏ <script> và on*= handler (nội dung từ file người dùng)
const sanitize = (h: string) =>
  h.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')

const safeDecode = (s: string) => { try { return decodeURIComponent(s) } catch { return s } }

// CSS mặc định bên trong Shadow DOM (deck css đặt SAU nên sẽ ghi đè)
const BASE_CSS = `
:host{display:block}
.card{font-family:arial,'Segoe UI',sans-serif;font-size:20px;text-align:center;color:#111;line-height:1.5;word-break:break-word}
img{max-width:100%;height:auto}
audio{display:block;width:100%;max-width:350px;margin:10px auto}
hr{border:0;border-top:1px solid #ddd;margin:16px 0}
.cloze{font-weight:bold;color:#2563eb}
`

/** Render HTML + CSS của deck trong Shadow DOM: CSS không rò ra web, web không phá CSS của deck */
function ShadowHtml({ html, css }: { html: string; css: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const host = ref.current
    if (!host) return
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    root.innerHTML = `<style>${BASE_CSS}${css}</style><div class="card">${html}</div>`
  }, [html, css])
  return <div ref={ref} className="w-full" />
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen p-10 bg-red-50 text-red-600 font-mono">
          <h1 className="text-2xl font-bold mb-4">Lỗi Giao Diện (Client-side Exception)!</h1>
          <p className="whitespace-pre-wrap">{this.state.error?.toString()}</p>
        </div>
      )
    }
    return this.props.children
  }
}

export default function AnkiClientWrapper() {
  return (
    <ErrorBoundary>
      <AnkiClient />
    </ErrorBoundary>
  )
}

/* ---------- Modern card (dựa trên CardConfig do user chọn) ---------- */

function ModernCard({ note, cfg, flipped, resolve }: {
  note: AnkiNote; cfg: CardConfig; flipped: boolean; resolve: (h: string) => string
}) {
  const val = (i: number | null) => (i == null ? '' : note.fieldsData[i]?.value ?? '')
  const Block = ({ html, className = '' }: { html: string; className?: string }) =>
    <div className={`anki-content ${className}`} dangerouslySetInnerHTML={{ __html: resolve(html) }} />

  return (
    <div className="w-full text-center">
      <div className={flipped ? 'pb-6 mb-6 border-b-2 border-dashed border-slate-100' : ''}>
        {cfg.big !== null && hasContent(val(cfg.big)) && (
          <Block html={val(cfg.big)} className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight mb-4" />
        )}
        {cfg.front.filter(i => hasContent(val(i))).map(i => (
          <Block key={i} html={val(i)} className="text-xl text-slate-600 mb-2" />
        ))}
      </div>

      {flipped && (
        <div className="text-left space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {cfg.back.filter(i => hasContent(val(i))).map(i => (
            <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                {note.fieldsData[i]?.name}
              </div>
              <Block html={val(i)} className="text-lg text-slate-700 leading-relaxed" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Main ---------- */

function AnkiClient() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [savedDecks, setSavedDecks] = useState<AnkiDeck[]>([])

  const [activeDeck, setActiveDeck] = useState<AnkiDeck | null>(null)
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  const [selectedSubdeck, setSelectedSubdeck] = useState<string | null>(null)

  const [useOriginalLayout, setUseOriginalLayout] = useState(true)
  const [showMapping, setShowMapping] = useState(false)
  const [cfgOverrides, setCfgOverrides] = useState<Record<string, CardConfig>>({})

  const [studyQueue, setStudyQueue] = useState<AnkiNote[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isStudying, setIsStudying] = useState(false)
  const [studySessionCount, setStudySessionCount] = useState(0)

  const [activityData, setActivityData] = useState<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActivityData(loadActivityFromStorage())
    loadSavedDecks()
    try { setUseOriginalLayout(localStorage.getItem('anki-layout') !== 'modern') } catch { }
  }, [])

  const setLayout = (original: boolean) => {
    setUseOriginalLayout(original)
    try { localStorage.setItem('anki-layout', original ? 'original' : 'modern') } catch { }
  }

  const loadSavedDecks = async () => {
    try {
      const decks: AnkiDeck[] = []
      await localforage.iterate((value: AnkiDeck, key: string) => {
        if (key.startsWith('deck_')) {
          if (!value.studyState) value.studyState = {}
          decks.push(value)
        }
      })
      setSavedDecks(decks.sort((a, b) => b.importedAt - a.importedAt))
    } catch (e) {
      console.error('Lỗi khi tải decks từ localforage:', e)
    }
  }

  const loadActivityFromStorage = () => {
    const data = []
    const todayDate = new Date()
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('anki_activity') || '{}') } catch { return {} }
    })()
    for (let i = 365; i >= 0; i--) {
      const d = new Date(todayDate)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = stored[dateStr] || 0
      const level = count === 0 ? 0 : count < 10 ? 1 : count < 25 ? 2 : count < 50 ? 3 : 4
      data.push({ date: dateStr, count, level: level as 0 | 1 | 2 | 3 | 4 })
    }
    return data
  }

  const recordActivity = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('anki_activity') || '{}')
      const today = new Date().toISOString().split('T')[0]
      stored[today] = (stored[today] || 0) + 1
      localStorage.setItem('anki_activity', JSON.stringify(stored))
      setActivityData(loadActivityFromStorage())
    } catch { }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''

    setIsUploading(true)
    setError('')

    try {
      const buffer = await file.arrayBuffer()
      let finalDbBuffer: Uint8Array = new Uint8Array(buffer)
      const mediaMap: Record<string, Blob> = {}

      const isPkZip = finalDbBuffer[0] === 0x50 && finalDbBuffer[1] === 0x4b

      if (isPkZip) {
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(buffer)

        // Anki bản mới (anki21b) chứa 1 collection.anki2 "giả" -> báo lỗi rõ ràng
        if (zip.file('collection.anki21b') && !zip.file('collection.anki21')) {
          throw new Error(
            'File này được export bằng định dạng Anki mới (.anki21b). Hãy export lại trong Anki và TICK ' +
            '"Support older Anki versions (slower, larger files)", rồi import lại.'
          )
        }

        const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2')
        if (!dbFile) throw new Error('File .apkg không hợp lệ (thiếu collection database bên trong)')
        finalDbBuffer = await dbFile.async('uint8array') as any as any

        const mediaFile = zip.file('media')
        if (mediaFile) {
          try {
            const mediaDict = JSON.parse(await mediaFile.async('string'))
            for (const [key, filename] of Object.entries(mediaDict)) {
              const f = zip.file(key)
              if (f) mediaMap[filename as string] = await f.async('blob')
            }
          } catch (err) {
            console.warn('Lỗi khi parse media:', err)
          }
        }
      }

      const notes = parseSqliteAnki(finalDbBuffer)

      const newDeck: AnkiDeck = {
        id: `deck_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: file.name.replace(/\.apkg$/i, ''),
        notes,
        mediaMap,
        studyState: {},
        importedAt: Date.now(),
      }

      await localforage.setItem(newDeck.id, newDeck)
      await loadSavedDecks()
      selectDeck(newDeck)
    } catch (err: any) {
      setError(err.message || 'Có lỗi khi đọc file Anki.')
    } finally {
      setIsUploading(false)
    }
  }

  const selectDeck = (deck: AnkiDeck) => {
    Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url))
    const urls: Record<string, string> = {}
    for (const [filename, blob] of Object.entries(deck.mediaMap || {})) {
      urls[filename] = URL.createObjectURL(blob as Blob)
    }
    setMediaUrls(urls)
    setActiveDeck(deck)
    setSelectedSubdeck(null)
    setIsStudying(false)
  }

  const deleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bạn có chắc muốn xóa bộ thẻ này?')) {
      await localforage.removeItem(id)
      if (activeDeck?.id === id) setActiveDeck(null)
      await loadSavedDecks()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.dataTransfer.files[0]) return
    handleFileUpload({ target: { files: e.dataTransfer.files, value: '' } } as any)
  }

  /** Thay [sound:x] thành <audio>, đổi src ảnh/audio sang blob URL */
  const resolve = (html: string) =>
    sanitize(html)
      .replace(/(<(?:img|audio|source)[^>]*?\ssrc\s*=\s*)(["']?)([^"'\s>]+)\2/gi, (m, pre, _q, src) => {
        const url = mediaUrls[safeDecode(src)] ?? mediaUrls[src]
        return url ? `${pre}"${url}"` : m
      })
      .replace(/\[sound:([^\]]+)\]/gi, (_, f) => {
        const url = mediaUrls[f] ?? mediaUrls[safeDecode(f)]
        return url ? `<audio controls preload="none" src="${url}"></audio>` : ''
      })

  const subdecks = useMemo(() => {
    if (!activeDeck) return []
    const groups: Record<string, number> = {}
    let usesTags = false

    const uniqueDecks = new Set(activeDeck.notes.map(n => n.deckName || 'Mặc định'))
    if (uniqueDecks.size === 1) {
      activeDeck.notes.forEach(n => {
        if (n.tags && n.tags.trim()) {
          usesTags = true
          n.tags.split(' ').map(t => t.trim()).filter(Boolean).forEach(tag => (groups[tag] = (groups[tag] || 0) + 1))
        }
      })
    }
    if (!usesTags || Object.keys(groups).length === 0) {
      usesTags = false
      activeDeck.notes.forEach(n => {
        const name = n.deckName || 'Mặc định'
        groups[name] = (groups[name] || 0) + 1
      })
    }
    return Object.entries(groups)
      .map(([name, count]) => ({ name, count, isTag: usesTags }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [activeDeck])

  const startStudying = (categoryName: string | null = null, isTag = false) => {
    if (!activeDeck) return
    setSelectedSubdeck(categoryName)

    let queue = [...activeDeck.notes]
    if (categoryName) {
      queue = isTag
        ? queue.filter(n => n.tags.split(' ').includes(categoryName))
        : queue.filter(n => (n.deckName || 'Mặc định') === categoryName)
    }

    // sort ổn định: thẻ chưa học / đến hạn trước, giữ thứ tự gốc
    queue.sort((a, b) => (activeDeck.studyState[a.id]?.due || 0) - (activeDeck.studyState[b.id]?.due || 0))

    if (queue.length === 0) {
      setError('Bộ thẻ này có 0 thẻ (thường là deck cũ import bị lỗi). Hãy xoá deck rồi import lại file .apkg.')
      return
    }

    setStudyQueue(queue)
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsStudying(true)
    setStudySessionCount(0)
  }

  const currentCard = studyQueue[currentIndex]

  const handleRating = async (quality: number) => {
    if (!activeDeck || !currentCard) return
    recordActivity()

    const state = activeDeck.studyState[currentCard.id] || { reps: 0, ivl: 0, ef: 2.5, due: 0 }
    let { reps, ivl, ef } = state

    if (quality >= 3) {
      if (reps === 0) ivl = 1
      else if (reps === 1) ivl = 6
      else ivl = Math.round(ivl * ef)
      reps += 1
    } else {
      reps = 0
      ivl = 1
    }
    ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

    const updatedDeck: AnkiDeck = {
      ...activeDeck,
      studyState: {
        ...activeDeck.studyState,
        [currentCard.id]: { reps, ivl, ef, due: Date.now() + ivl * 86400000 },
      },
    }
    setActiveDeck(updatedDeck)
    localforage.setItem(updatedDeck.id, updatedDeck)
    setStudySessionCount(c => c + 1)

    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex(i => i + 1)
      setIsFlipped(false)
    } else {
      alert('Tuyệt vời! Bạn đã hoàn thành các thẻ trong bộ này cho hôm nay.')
      setIsStudying(false)
    }
  }

  /* ----- Field mapping config (giao diện Hiện đại) ----- */

  const modelInfo = useMemo(() => {
    const m: Record<string, { names: string[]; rows: string[][]; qfmt: string; sortf: number }> = {}
    if (!activeDeck) return m
    for (const n of activeDeck.notes) {
      const e = (m[n.modelId] ??= { names: n.fieldsData.map(f => f.name), rows: [], qfmt: n.qfmt, sortf: n.sortf })
      if (e.rows.length < 300) e.rows.push(n.fieldsData.map(f => f.value))
    }
    return m
  }, [activeDeck?.notes]) // eslint-disable-line react-hooks/exhaustive-deps

  const cfgKey = activeDeck && currentCard ? `${activeDeck.id}_${currentCard.modelId}` : ''

  const cfg: CardConfig | null = useMemo(() => {
    if (!cfgKey || !currentCard) return null
    if (cfgOverrides[cfgKey]) return cfgOverrides[cfgKey]
    try {
      const s = localStorage.getItem(`anki-cfg:${cfgKey}`)
      if (s) return JSON.parse(s) as CardConfig
    } catch { }
    const info = modelInfo[currentCard.modelId]
    return info ? defaultConfig(info.names, info.rows, info.qfmt, info.sortf) : null
  }, [cfgKey, cfgOverrides, modelInfo, currentCard?.modelId]) // eslint-disable-line react-hooks/exhaustive-deps

  const mappingInfo = currentCard ? modelInfo[currentCard.modelId] : undefined

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isStudying && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200 mb-6">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Hệ Thống Học Từ Vựng Thuật Toán</h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
              Tối ưu hóa ghi nhớ bằng thuật toán lặp lại ngắt quãng (Spaced Repetition). Hỗ trợ đọc mọi file Anki.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl mb-8 flex items-center shadow-sm">
            <span className="mr-3 text-xl">⚠️</span> {error}
          </div>
        )}

        {!isStudying ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-1 space-y-8">
              <div
                className={`bg-white rounded-3xl border-2 border-dashed ${isUploading ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/50'
                  } p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-sm`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileRef.current?.click()}
              >
                <input type="file" ref={fileRef} className="hidden" accept=".apkg" onChange={handleFileUpload} />
                {isUploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-700 font-bold">Đang xử lý...</p>
                    <p className="text-xs text-slate-500 mt-2">Dữ liệu được lưu an toàn trên máy bạn.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-md">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Import file .apkg</h3>
                    <p className="text-slate-500 text-sm">Kéo thả file vào đây</p>
                  </>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col max-h-[500px]">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Thư viện của bạn
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {savedDecks.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Chưa có bộ thẻ nào.
                    </div>
                  ) : (
                    savedDecks.map(deck => (
                      <div
                        key={deck.id}
                        onClick={() => selectDeck(deck)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${activeDeck?.id === deck.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                          }`}
                      >
                        <div className="flex-1 overflow-hidden">
                          <h4 className={`font-bold truncate text-base ${activeDeck?.id === deck.id ? 'text-blue-800' : 'text-slate-800'}`}>{deck.name}</h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <Layers className="w-3 h-3" /> {deck.notes.length} thẻ
                          </p>
                        </div>
                        <button
                          onClick={e => deleteDeck(deck.id, e)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                          title="Xóa bộ thẻ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {activeDeck ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{activeDeck.name}</h2>
                      <p className="text-slate-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Đã nhập vào {new Date(activeDeck.importedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={() => startStudying(null)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:-translate-y-1 transition-all"
                    >
                      <PlayCircle className="w-5 h-5 fill-current" /> Học toàn bộ
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2 mb-6">
                    <Folder className="w-5 h-5 text-blue-500" /> Chọn phần học:
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subdecks.map((sub, i) => (
                      <div
                        key={i}
                        className="group bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
                        onClick={() => startStudying(sub.name, sub.isTag)}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                            {sub.isTag ? <Tag className="w-4 h-4" /> : i + 1}
                          </div>
                          <span className="font-bold text-slate-700 truncate">{sub.name}</span>
                        </div>
                        <span className="text-sm font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          {sub.count} thẻ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center text-slate-400 p-10 min-h-[400px]">
                  <FileText className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-lg font-medium">Chọn một bộ thẻ để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STUDY MODE */
          <div className="max-w-3xl mx-auto mb-10 relative">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
              <button
                onClick={() => setIsStudying(false)}
                className="text-slate-500 hover:text-blue-600 font-bold flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm hover:shadow-md"
              >
                <ChevronLeft className="w-5 h-5" /> Trở về thư mục
              </button>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-sm font-medium">
                <button onClick={() => setLayout(true)} className={`px-4 py-2 rounded-lg ${useOriginalLayout ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Gốc (Anki)</button>
                <button onClick={() => setLayout(false)} className={`px-4 py-2 rounded-lg ${!useOriginalLayout ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Hiện đại</button>
                {!useOriginalLayout && (
                  <button onClick={() => setShowMapping(true)} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white" title="Tuỳ chỉnh field">
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold bg-green-50 text-green-600 px-4 py-2 rounded-full border border-green-100 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {studySessionCount}
                </span>
                <span className="text-sm font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100">
                  {currentIndex + 1} / {studyQueue.length}
                </span>
              </div>
            </div>

            {currentCard && (
              <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-2xl shadow-blue-900/5 border border-slate-100 min-h-[420px] flex flex-col justify-center">
                {useOriginalLayout || !cfg || cfg.big === null ? (
                  <ShadowHtml html={resolve(isFlipped ? currentCard.back : currentCard.front)} css={currentCard.css} />
                ) : (
                  <ModernCard note={currentCard} cfg={cfg} flipped={isFlipped} resolve={resolve} />
                )}
              </div>
            )}

            <div className="mt-10">
              {!isFlipped ? (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-5 rounded-[2rem] bg-blue-600 text-white font-extrabold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1"
                >
                  Hiện kết quả
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-3 md:gap-6">
                  <button onClick={() => handleRating(0)} className="py-4 rounded-2xl bg-red-50 text-red-600 font-bold text-lg hover:bg-red-100 border border-red-200">Lại</button>
                  <button onClick={() => handleRating(2)} className="py-4 rounded-2xl bg-orange-50 text-orange-600 font-bold text-lg hover:bg-orange-100 border border-orange-200">Khó</button>
                  <button onClick={() => handleRating(4)} className="py-4 rounded-2xl bg-green-50 text-green-600 font-bold text-lg hover:bg-green-100 border border-green-200">Tốt</button>
                  <button onClick={() => handleRating(5)} className="py-4 rounded-2xl bg-blue-50 text-blue-600 font-bold text-lg hover:bg-blue-100 border border-blue-200">Dễ</button>
                </div>
              )}
            </div>
          </div>
        )}

        {showMapping && currentCard && mappingInfo && (
          <FieldMappingModal
            modelId={cfgKey}
            names={mappingInfo.names}
            sampleRow={currentCard.fieldsData.map(f => f.value)}
            rows={mappingInfo.rows}
            qfmt={mappingInfo.qfmt}
            sortf={mappingInfo.sortf}
            onSave={c => setCfgOverrides(prev => ({ ...prev, [cfgKey]: c }))}
            onClose={() => setShowMapping(false)}
          />
        )}

        {!isStudying && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden mt-8">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" /> Biểu Đồ Tích Lũy
            </h2>
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[800px]">
                {activityData.length > 0 ? (
                  <ActivityCalendar
                    data={activityData}
                    theme={{
                      light: ['#f1f5f9', '#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
                      dark: ['#1e293b', '#1e3a8a', '#3b82f6', '#93c5fd', '#dbeafe'],
                    }}
                    labels={{
                      months: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
                      weekdays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                      totalCount: 'Đã ôn tập {{count}} thẻ trong năm qua',
                      legend: { less: 'Ít', more: 'Nhiều' },
                    }}
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" /> Đang tải dữ liệu...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Style cho giao diện Hiện đại (light DOM) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .anki-content img { max-width: 100%; max-height: 320px; border-radius: 16px; margin: 12px auto; display: block; }
        .anki-content audio { width: 100%; max-width: 350px; margin: 12px auto; display: block; }
        .anki-content .cloze { font-weight: 900; color: #2563eb; }
      `}} />
    </div>
  )
}
