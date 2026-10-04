'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import localforage from 'localforage'
import { UploadCloud, Loader2, PlayCircle, BookOpen, ChevronLeft, ChevronRight, RotateCcw, Tag, Layers, Trash2, Edit2, Play } from 'lucide-react'
import { parseSqliteAnki, AnkiNote } from './sqlite-reader'

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then(m => m.ActivityCalendar),
  { ssr: false, loading: () => <div className="h-32" /> }
)

interface AnkiDeck {
  id: string
  name: string
  notes: AnkiNote[]
  mediaMap: Record<string, Blob> // original filename -> blob
  importedAt: number
}

// Generate 366 days of empty activity data
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
  const [savedDecks, setSavedDecks] = useState<AnkiDeck[]>([])
  
  const [activeDeck, setActiveDeck] = useState<AnkiDeck | null>(null)
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  
  const [activityData, setActivityData] = useState<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isStudying, setIsStudying] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActivityData(loadActivityFromStorage())
    loadSavedDecks()
  }, [])
  
  // Cleanup object URLs when component unmounts or active deck changes
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
        if (key.startsWith('deck_')) decks.push(value)
      })
      setSavedDecks(decks.sort((a, b) => b.importedAt - a.importedAt))
    } catch (e) {
      console.error('Lỗi khi tải decks từ localforage:', e)
    }
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
            const mediaDict = JSON.parse(mediaJsonText) // {"0": "cat.jpg", "1": "dog.mp3"}
            
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
    // Revoke old URLs
    Object.values(mediaUrls).forEach(url => URL.revokeObjectURL(url))
    
    // Create new URLs for this deck's media
    const urls: Record<string, string> = {}
    for (const [filename, blob] of Object.entries(deck.mediaMap || {})) {
      urls[filename] = URL.createObjectURL(blob)
    }
    
    setMediaUrls(urls)
    setActiveDeck(deck)
    setCurrentIndex(0)
    setIsFlipped(false)
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
    
    // Replace <img> src with blob URLs
    processed = processed.replace(/<img[^>]+src="([^">]+)"[^>]*>/gi, (match, src) => {
      if (mediaUrls[src]) {
        return match.replace(src, mediaUrls[src])
      }
      return match
    })
    
    // Replace [sound:...] with audio tags
    processed = processed.replace(/\[sound:([^\]]+)\]/gi, (match, src) => {
      if (mediaUrls[src]) {
        return `<audio controls autoplay src="${mediaUrls[src]}" class="mt-2 w-full max-w-[250px] outline-none rounded-full h-10 shadow-sm"></audio>`
      }
      return `<span class="text-xs text-red-400 border border-red-200 px-2 py-1 rounded bg-red-50">[Thiếu file âm thanh: ${src}]</span>`
    })
    
    return processed
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
    if (activeDeck && currentIndex < activeDeck.notes.length - 1) {
      setCurrentIndex(curr => curr + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(curr => curr - 1)
      setIsFlipped(false)
    }
  }
  
  const currentCard = activeDeck?.notes[currentIndex]

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200 mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">
            VNDocs Anki <span className="text-sm font-normal text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md ml-2 border border-indigo-100">v2.0</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
            Học từ vựng trực quan, lưu trữ offline ngay trên trình duyệt, không giới hạn dung lượng!
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 flex items-center shadow-sm">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {!isStudying ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Upload Area */}
            <div
              className={`bg-white rounded-3xl border-2 border-dashed ${
                isUploading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'
              } p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-sm min-h-[300px]`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileRef.current?.click()}
            >
              <input
                type="file"
                ref={fileRef}
                className="hidden"
                accept=".apkg"
                onChange={handleFileUpload}
              />
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">Đang xử lý file trực tiếp trên trình duyệt...</p>
                  <p className="text-sm text-slate-400 mt-2">Việc này không tốn dung lượng mạng!</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Nhập file .apkg mới</h3>
                  <p className="text-slate-500 text-sm max-w-[250px]">Kéo thả file Anki vào đây hoặc click để chọn file từ máy</p>
                </>
              )}
            </div>

            {/* Saved Decks List */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-full min-h-[300px]">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Các bộ thẻ đã lưu
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {savedDecks.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 text-sm">
                    Bạn chưa lưu bộ thẻ nào. Hãy upload file .apkg để bắt đầu!
                  </div>
                ) : (
                  savedDecks.map(deck => (
                    <div 
                      key={deck.id} 
                      onClick={() => selectDeck(deck)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        activeDeck?.id === deck.id 
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100 ring-offset-1' 
                          : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex-1 overflow-hidden">
                        <h4 className={`font-bold truncate ${activeDeck?.id === deck.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {deck.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {deck.notes.length} thẻ
                        </p>
                      </div>
                      <button 
                        onClick={(e) => deleteDeck(deck.id, e)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa bộ thẻ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {activeDeck && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={startStudying}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Play className="w-4 h-4 fill-current" /> Bắt đầu học "{activeDeck.name}"
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STUDY MODE */
          <div className="max-w-2xl mx-auto mb-10 relative">
            <button
              onClick={() => setIsStudying(false)}
              className="absolute -top-12 left-0 text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
            </button>
            
            <div className="flex justify-between items-center mb-6 px-2">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {activeDeck?.name}
              </span>
              <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                Thẻ {currentIndex + 1} / {activeDeck?.notes.length}
              </span>
            </div>

            {currentCard && (
              <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col justify-center text-center relative overflow-hidden transition-all">
                
                {/* Dynamic Anki CSS */}
                {currentCard.css && (
                  <style dangerouslySetInnerHTML={{ __html: `.anki-content { ${currentCard.css.replace(/card/gi, '')} }` }} />
                )}
                
                {/* Front */}
                <div className={`${isFlipped ? 'mb-8 pb-8 border-b border-slate-100' : ''}`}>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-6 flex justify-center items-center gap-2">
                    <Tag className="w-3 h-3" /> Mặt trước
                  </p>
                  <div
                    className="text-lg md:text-xl text-slate-800 leading-relaxed anki-content"
                    dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(currentCard.front) }}
                  />
                </div>

                {/* Back */}
                {isFlipped && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-6 flex justify-center items-center gap-2">
                      <BookOpen className="w-3 h-3" /> Đáp án
                    </p>
                    <div
                      className="text-lg md:text-xl text-slate-700 leading-relaxed anki-content"
                      dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(currentCard.back) }}
                    />
                    {currentCard.extra.length > 0 && (
                      <div
                        className="mt-8 text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 anki-content"
                        dangerouslySetInnerHTML={{ __html: processHtmlWithMedia(currentCard.extra.join('<br/><br/>')) }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={prevCard}
                disabled={currentIndex === 0}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600 shadow-sm"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={flipCard}
                className="flex-1 max-w-[240px] flex items-center justify-center gap-2 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1"
              >
                {isFlipped ? (
                  <><RotateCcw className="w-5 h-5" /> Lật thẻ lại</>
                ) : (
                  <><PlayCircle className="w-5 h-5" /> Hiện đáp án</>
                )}
              </button>
              
              <button
                onClick={nextCard}
                disabled={currentIndex === (activeDeck?.notes.length ?? 1) - 1}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-all disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600 shadow-sm"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Activity Calendar */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm overflow-hidden mt-10">
          <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            🔥 Lịch sử học tập
          </h2>
          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="min-w-[700px]">
              {activityData.length > 0 ? (
                <ActivityCalendar
                  data={activityData}
                  theme={{
                    light: ['#f1f5f9', '#c7d2fe', '#818cf8', '#6366f1', '#4338ca'],
                    dark: ['#1e293b', '#3730a3', '#4f46e5', '#6366f1', '#818cf8'],
                  }}
                  labels={{
                    months: ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'],
                    weekdays: ['CN','T2','T3','T4','T5','T6','T7'],
                    totalCount: '{{count}} từ vựng đã học trong năm qua',
                    legend: { less: 'Ít', more: 'Nhiều' },
                  }}
                />
              ) : (
                <div className="h-32 flex items-center justify-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải lịch sử...
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Global styles for injected Anki HTML */}
      <style dangerouslySetInnerHTML={{__html: `
        .anki-content img { max-width: 100%; border-radius: 8px; margin: 10px auto; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .anki-content audio { width: 100%; max-width: 300px; margin: 10px auto; display: block; }
        .cloze { font-weight: bold; color: #4f46e5; background: #eef2ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #c7d2fe; }
        .anki-img-placeholder { display: inline-block; padding: 8px 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; font-size: 13px; }
      `}} />
    </div>
  )
}
