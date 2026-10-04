'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import localforage from 'localforage'
import { UploadCloud, Loader2, PlayCircle, BookOpen, ChevronLeft, ChevronRight, RotateCcw, Tag, Layers, Trash2, Folder, BrainCircuit, Activity, Calendar, FileText, CheckCircle2 } from 'lucide-react'
import { parseSqliteAnki, AnkiNote } from './sqlite-reader'

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then(m => m.ActivityCalendar),
  { ssr: false, loading: () => <div className="h-32 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div> }
)

interface CardStudyState {
  reps: number
  ivl: number
  ef: number
  due: number // timestamp
}

interface AnkiDeck {
  id: string
  name: string
  notes: AnkiNote[]
  mediaMap: Record<string, Blob>
  importedAt: number
  studyState: Record<string, CardStudyState>
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
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

function AnkiClient() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [savedDecks, setSavedDecks] = useState<AnkiDeck[]>([])
  
  const [activeDeck, setActiveDeck] = useState<AnkiDeck | null>(null)
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  
  // Subdeck selection
  const [selectedSubdeck, setSelectedSubdeck] = useState<string | null>(null)
  
  // Custom display
  const [showDebug, setShowDebug] = useState(false)
  
  // Study State
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
  }, [])
  
  useEffect(() => {
    return () => {
      Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeck])

  const loadSavedDecks = async () => {
    try {
      const decks: AnkiDeck[] = []
      await localforage.iterate((value: AnkiDeck, key: string) => {
        if (key.startsWith('deck_')) {
          // Initialize study state if missing (migration)
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
      try { return JSON.parse(localStorage.getItem('anki_activity') || '{}') }
      catch { return {} }
    })()
    
    for (let i = 365; i >= 0; i--) {
      const d = new Date(todayDate)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const count = stored[dateStr] || 0
      const level = count === 0 ? 0 : count < 10 ? 1 : count < 25 ? 2 : count < 50 ? 3 : 4
      data.push({ date: dateStr, count, level: level as 0|1|2|3|4 })
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
    } catch {}
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''

    setIsUploading(true)
    setError('')

    try {
      const buffer = await file.arrayBuffer()
      const dbBuffer = new Uint8Array(buffer)
      let finalDbBuffer = dbBuffer
      const mediaMap: Record<string, Blob> = {}

      const isPkZip = dbBuffer[0] === 0x50 && dbBuffer[1] === 0x4b

      if (isPkZip) {
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(buffer)
        const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2')
        
        if (!dbFile) {
          throw new Error('File .apkg không hợp lệ (thiếu collection database bên trong)')
        }
        const extracted = await dbFile.async('uint8array')
        finalDbBuffer = new Uint8Array(extracted.buffer as ArrayBuffer)
        
        // Extract media
        const mediaFile = zip.file('media')
        if (mediaFile) {
          try {
            const mediaJsonText = await mediaFile.async('string')
            const mediaDict = JSON.parse(mediaJsonText)
            for (const [key, filename] of Object.entries(mediaDict)) {
              const fileInZip = zip.file(key)
              if (fileInZip) {
                const blob = await fileInZip.async('blob')
                mediaMap[filename as string] = blob
              }
            }
          } catch (e) {
            console.warn('Lỗi khi parse media:', e)
          }
        }
      }

      const notes = parseSqliteAnki(finalDbBuffer)
      
      const newDeck: AnkiDeck = {
        id: `deck_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: file.name.replace('.apkg', ''),
        notes,
        mediaMap,
        studyState: {},
        importedAt: Date.now()
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
    const file = e.dataTransfer.files[0]
    if (!file) return
    const synth = { target: { files: e.dataTransfer.files, value: '' } } as any
    handleFileUpload(synth)
  }
  
  const processHtmlWithMedia = (html: string) => {
    let processed = html
    processed = processed.replace(/<img[^>]+src="([^">]+)"[^>]*>/gi, (match, src) => {
      if (mediaUrls[src]) return match.replace(src, mediaUrls[src])
      return match
    })
    processed = processed.replace(/\[sound:([^\]]+)\]/gi, (match, src) => {
      if (mediaUrls[src]) {
        return `<audio controls autoplay src="${mediaUrls[src]}" class="mt-4 mb-2 w-full max-w-[300px] outline-none rounded-full h-12 shadow-sm border border-indigo-100 bg-indigo-50/50"></audio>`
      }
      return ''
    })
    return processed
  }

  // Group notes by Deck or Tags
  const subdecks = useMemo(() => {
    if (!activeDeck) return []
    const groups: Record<string, number> = {}
    let usesTags = false
    
    const uniqueDecks = new Set(activeDeck.notes.map(n => n.deckName || 'Mặc định'))
    if (uniqueDecks.size === 1) {
      activeDeck.notes.forEach(n => {
        if (n.tags && n.tags.trim()) {
          usesTags = true
          const cardTags = n.tags.split(' ').map(t => t.trim()).filter(Boolean)
          cardTags.forEach(tag => groups[tag] = (groups[tag] || 0) + 1)
        }
      })
    }
    
    if (!usesTags || Object.keys(groups).length === 0) {
      activeDeck.notes.forEach(n => {
        const name = n.deckName || 'Mặc định'
        groups[name] = (groups[name] || 0) + 1
      })
    }
    
    return Object.entries(groups)
      .map(([name, count]) => ({ name, count, isTag: usesTags }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [activeDeck])

  const startStudying = (categoryName: string | null = null, isTag: boolean = false) => {
    if (!activeDeck) return
    setSelectedSubdeck(categoryName)
    
    let queue = activeDeck.notes
    if (categoryName) {
      if (isTag) {
        queue = queue.filter(n => n.tags && n.tags.includes(categoryName))
      } else {
        queue = queue.filter(n => (n.deckName || 'Mặc định') === categoryName)
      }
    }

    // Thuật toán SM-2: Sắp xếp các thẻ cần ôn tập lên trước
    const now = Date.now()
    queue.sort((a, b) => {
      const stateA = activeDeck.studyState[a.id]?.due || 0
      const stateB = activeDeck.studyState[b.id]?.due || 0
      return stateA - stateB
    })

    setStudyQueue(queue)
    setCurrentIndex(0)
    setIsFlipped(false)
    setIsStudying(true)
    setStudySessionCount(0)
  }

  const handleRating = async (quality: number) => {
    if (!activeDeck || !currentCard) return
    
    recordActivity()
    
    const state = activeDeck.studyState[currentCard.id] || { reps: 0, ivl: 0, ef: 2.5, due: 0 }
    let { reps, ivl, ef } = state
    
    // Simple SM-2 Implementation
    if (quality >= 3) {
      if (reps === 0) ivl = 1
      else if (reps === 1) ivl = 6
      else ivl = Math.round(ivl * ef)
      reps += 1
    } else {
      reps = 0
      ivl = 1
    }
    
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (ef < 1.3) ef = 1.3
    
    const newState = { reps, ivl, ef, due: Date.now() + ivl * 24 * 60 * 60 * 1000 }
    
    // Save to activeDeck and localforage
    const updatedDeck = { ...activeDeck }
    updatedDeck.studyState[currentCard.id] = newState
    setActiveDeck(updatedDeck)
    localforage.setItem(updatedDeck.id, updatedDeck)
    
    setStudySessionCount(c => c + 1)
    
    // Move to next card
    if (currentIndex < studyQueue.length - 1) {
      setCurrentIndex(curr => curr + 1)
      setIsFlipped(false)
    } else {
      // Completed queue
      alert('Tuyệt vời! Bạn đã hoàn thành các thẻ trong bộ này cho hôm nay.')
      setIsStudying(false)
    }
  }
  
  // Intelligent parsing for raw fields to find Word, IPA, Meaning, Examples
  const extractSemanticFields = (fieldsData: {name: string, value: string}[]) => {
    let word = '', ipa = '', meaning = ''
    const examples: string[] = [], images: string[] = [], audios: string[] = []
    const others: {name: string, value: string}[] = []
    
    fieldsData.forEach(f => {
      const name = f.name.toLowerCase().trim()
      const val = f.value.trim()
      if (!val) return
      
      const textOnly = val.replace(/<[^>]*>?/gm, '').replace(/\[sound:[^\]]+\]/gi, '').replace(/&nbsp;/gi, '').trim()
      
      const hasLetters = /\p{L}/u.test(textOnly)
      
      // Ignore index numbers or fields that contain NO letters (like "1", "#1", "1/100")
      if (['stt', 'id', 'thứ tự', 'seq', 'index', 'no', 'số thứ tự'].includes(name) || (textOnly.length > 0 && !hasLetters)) {
        return
      }
      
      const isImgOnly = textOnly.length === 0 && val.includes('<img')
      const isAudioOnly = textOnly.length === 0 && val.includes('[sound:')
      
      if (name.includes('word') || name.includes('từ vựng') || name.includes('từ') || name.includes('vocab') || name.includes('english') || name.includes('tiếng anh') || name.includes('mặt trước') || name.includes('front')) {
        word = val
      }
      else if (name.includes('ipa') || name.includes('phiên âm') || name.includes('phonetic') || name.includes('pronunciation')) {
        ipa = val
      }
      else if (name.includes('meaning') || name.includes('nghĩa') || name.includes('definition') || name.includes('tiếng việt') || name.includes('dịch') || name.includes('mặt sau') || name.includes('back')) {
        meaning = val
      }
      else if (name.includes('example') || name.includes('ví dụ') || name.includes('sentence') || name.includes('câu')) {
        examples.push(val)
      }
      else if (name.includes('audio') || name.includes('âm thanh') || name.includes('sound') || name.includes('nghe') || isAudioOnly) {
        audios.push(val)
      }
      else if (name.includes('picture') || name.includes('image') || name.includes('hình ảnh') || name.includes('ảnh') || isImgOnly) {
        images.push(val)
      }
      else {
        others.push(f)
      }
    })
    
    // Nếu chưa tìm thấy Word (Từ khóa chính), lấy field text đầu tiên
    if (!word && others.length > 0) {
      const idx = others.findIndex(f => {
         const t = f.value.replace(/<[^>]*>?/gm, '').replace(/\[sound:[^\]]+\]/gi, '').replace(/&nbsp;/gi, '').trim()
         return /\p{L}/u.test(t)
      })
      if (idx !== -1) {
        word = others[idx].value
        others.splice(idx, 1)
      }
    }
    
    // Nếu chưa tìm thấy Meaning, lấy field text tiếp theo
    if (!meaning && others.length > 0) {
      const idx = others.findIndex(f => {
         const t = f.value.replace(/<[^>]*>?/gm, '').replace(/\[sound:[^\]]+\]/gi, '').replace(/&nbsp;/gi, '').trim()
         return /\p{L}/u.test(t)
      })
      if (idx !== -1) {
        meaning = others[idx].value
        others.splice(idx, 1)
      }
    }
    
    // Tống hết các fields còn lại vào examples để không bị mất dữ liệu
    others.forEach(o => {
      examples.push(`<b>${o.name}:</b><br/>${o.value}`)
    })
    
    return { word, ipa, meaning, examples, images, audios }
  }

  const currentCard = studyQueue[currentIndex]
  const semantic = currentCard ? extractSemanticFields(currentCard.fieldsData || []) : null

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-24 pb-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {!isStudying && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200 mb-6 transform hover:scale-105 transition-transform duration-300">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Hệ Thống Học Từ Vựng Thuật Toán
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
              Tối ưu hóa ghi nhớ bằng thuật toán lặp lại ngắt quãng (Spaced Repetition). Hỗ trợ đọc mọi file Anki, lấy đúng trọng tâm từ vựng.
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
            {/* Left Column: Upload & Decks */}
            <div className="lg:col-span-1 space-y-8">
              {/* Upload Area */}
              <div
                className={`bg-white rounded-3xl border-2 border-dashed ${
                  isUploading ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/50'
                } p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-sm`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileRef.current?.click()}
              >
                <input type="file" ref={fileRef} className="hidden" accept=".apkg" onChange={handleFileUpload} />
                {isUploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-700 font-bold">Đang xử lý thuật toán...</p>
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

              {/* Saved Decks List */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col max-h-[500px]">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Thư viện của bạn
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {savedDecks.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Chưa có bộ thẻ nào.
                    </div>
                  ) : (
                    savedDecks.map(deck => (
                      <div 
                        key={deck.id} 
                        onClick={() => selectDeck(deck)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          activeDeck?.id === deck.id 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex-1 overflow-hidden">
                          <h4 className={`font-bold truncate text-base ${activeDeck?.id === deck.id ? 'text-blue-800' : 'text-slate-800'}`}>
                            {deck.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                            <Layers className="w-3 h-3" /> {deck.notes.length} thẻ
                          </p>
                        </div>
                        <button 
                          onClick={(e) => deleteDeck(deck.id, e)}
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

            {/* Right Column: Deck Details & Subdecks */}
            <div className="lg:col-span-2">
              {activeDeck ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-full animate-in fade-in zoom-in-95 duration-300">
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
                  
                  <div className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">
                    <Folder className="w-5 h-5 text-blue-500" /> Các mục bài học trong bộ này
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subdecks.map((sub, i) => (
                      <div key={i} className="group bg-slate-50 border border-slate-200 p-5 rounded-2xl hover:bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-center" onClick={() => startStudying(sub.name, sub.isTag)}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                            {sub.isTag ? <Tag className="w-4 h-4" /> : i+1}
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
          /* STUDY MODE - SCIENTIFIC UI */
          <div className="max-w-3xl mx-auto mb-10 relative">
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setIsStudying(false)}
                className="text-slate-500 hover:text-blue-600 font-bold flex items-center gap-2 transition-colors px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm hover:shadow-md"
              >
                <ChevronLeft className="w-5 h-5" /> Trở về thư mục
              </button>
              
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold bg-green-50 text-green-600 px-4 py-2 rounded-full border border-green-100 flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Đã học: {studySessionCount}
                </span>
                <span className="text-sm font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-full border border-blue-100 shadow-sm">
                  Thẻ {currentIndex + 1} / {studyQueue.length}
                </span>
              </div>
            </div>

            {currentCard && (
              <div className="bg-white rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-blue-900/5 border border-slate-100 min-h-[500px] flex flex-col justify-center text-center relative overflow-hidden transition-all">
                
                {/* Front (Word, IPA, Image) */}
                <div className={`transition-all duration-500 ${isFlipped ? 'mb-8 pb-8 border-b-2 border-dashed border-slate-100 opacity-60 scale-95 origin-top' : 'scale-100'}`}>
                  {semantic?.word ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                      {semantic.images.length > 0 && (
                        <div className="flex flex-col gap-4 mb-4">
                          {semantic.images.map((m, i) => (
                            <div key={i} className="anki-content rounded-3xl overflow-hidden shadow-lg border border-slate-100" dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(m) }} />
                          ))}
                        </div>
                      )}
                      <div 
                        className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight anki-content text-center drop-shadow-sm"
                        dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(semantic.word) }}
                      />
                      {semantic.ipa && (
                        <div 
                          className="text-2xl font-medium text-slate-500 font-mono tracking-widest anki-content text-center opacity-80"
                          dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(semantic.ipa) }}
                        />
                      )}
                    </div>
                  ) : (
                    // Fallback to Anki QFMT only if we literally couldn't find ANY text field
                    <div
                      className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight anki-content text-center drop-shadow-sm"
                      dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(currentCard.front) }}
                    />
                  )}
                </div>

                {/* Back (Meanings, Audio, Examples) */}
                {isFlipped && (
                  <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 text-left">
                    
                    {semantic?.meaning ? (
                      <div className="space-y-8">
                        {/* Audio */}
                        {semantic.audios.length > 0 && (
                          <div className="flex flex-col items-center gap-2 mb-6">
                            {semantic.audios.map((a, i) => (
                              <div key={i} className="anki-content" dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(a) }} />
                            ))}
                          </div>
                        )}
                        
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                          <h3 className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Ý nghĩa
                          </h3>
                          <div 
                            className="text-3xl font-bold text-slate-700 leading-snug anki-content"
                            dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(semantic.meaning) }}
                          />
                        </div>
                        
                        {semantic.examples.length > 0 && (
                          <div className="grid grid-cols-1 gap-6 mt-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Bổ sung
                              </h3>
                              <ul className="space-y-4">
                                {semantic.examples.map((ex, i) => (
                                  <li key={i} className="text-lg text-slate-600 font-medium leading-relaxed anki-content" dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(ex) }} />
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {/* DEBUG BUTTON */}
                        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                          <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-slate-400 hover:text-blue-500 underline">
                            {showDebug ? 'Ẩn Debug Info' : 'Sai cấu trúc? Bấm vào đây để xem lỗi (Debug)'}
                          </button>
                          {showDebug && currentCard && (
                            <div className="mt-4 text-left bg-slate-900 text-green-400 p-4 rounded-xl overflow-auto text-xs font-mono max-h-64">
                              <p className="mb-2 text-white font-bold">RAW FIELDS DATA:</p>
                              {currentCard.fieldsData?.map((f: any, i: number) => (
                                <div key={i} className="mb-2 border-b border-slate-700 pb-2">
                                  <strong className="text-blue-300">[{f.name}]</strong>: {f.value}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                      </div>
                    ) : (
                      // Fallback to Anki AFMT
                      <div
                        className="text-2xl text-slate-700 leading-relaxed anki-content text-center"
                        dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(currentCard.back) }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SRS Navigation Buttons */}
            <div className="mt-10">
              {!isFlipped ? (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-5 rounded-[2rem] bg-blue-600 text-white font-extrabold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1 hover:shadow-2xl"
                >
                  Hiện kết quả
                </button>
              ) : (
                <div className="grid grid-cols-4 gap-3 md:gap-6 animate-in slide-in-from-bottom-4 duration-300">
                  <button onClick={() => handleRating(0)} className="py-4 rounded-2xl bg-red-50 text-red-600 font-bold text-lg hover:bg-red-100 border border-red-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">Lại (Khó)</button>
                  <button onClick={() => handleRating(2)} className="py-4 rounded-2xl bg-orange-50 text-orange-600 font-bold text-lg hover:bg-orange-100 border border-orange-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">Khá</button>
                  <button onClick={() => handleRating(4)} className="py-4 rounded-2xl bg-green-50 text-green-600 font-bold text-lg hover:bg-green-100 border border-green-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">Tốt</button>
                  <button onClick={() => handleRating(5)} className="py-4 rounded-2xl bg-blue-50 text-blue-600 font-bold text-lg hover:bg-blue-100 border border-blue-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-1">Dễ</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Calendar */}
        {!isStudying && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm overflow-hidden mt-8">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" /> Biểu Đồ Tích Lũy
            </h2>
            <div className="overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-[800px]">
                {activityData.length > 0 ? (
                  <ActivityCalendar
                    data={activityData}
                    theme={{
                      light: ['#f1f5f9', '#dbeafe', '#93c5fd', '#3b82f6', '#1e3a8a'],
                      dark: ['#1e293b', '#1e3a8a', '#3b82f6', '#93c5fd', '#dbeafe'],
                    }}
                    labels={{
                      months: ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'],
                      weekdays: ['CN','T2','T3','T4','T5','T6','T7'],
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
      
      {/* Global styles for injected Anki HTML and Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .anki-content img { max-width: 100%; border-radius: 16px; margin: 16px auto; display: block; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .anki-content audio { width: 100%; max-width: 350px; margin: 16px auto; display: block; }
        .cloze { font-weight: 900; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 6px; border: 2px solid #bfdbfe; }
      `}} />
    </div>
  )
}
