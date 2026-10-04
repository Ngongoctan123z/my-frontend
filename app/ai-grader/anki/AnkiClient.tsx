'use client'

import React, { useState, useEffect } from 'react'
import JSZip from 'jszip'
import initSqlJs from 'sql.js'
import { ActivityCalendar } from 'react-activity-calendar'
import { UploadCloud, Loader2, PlayCircle, BookOpen } from 'lucide-react'

// Dummy data for activity calendar initially
const generateDummyData = () => {
  const data = []
  const today = new Date()
  for (let i = 365; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    // random activity for past days, 0 for future
    const count = Math.random() > 0.7 ? Math.floor(Math.random() * 50) : 0
    data.push({
      date: d.toISOString().split('T')[0],
      count: count,
      level: count === 0 ? 0 : count < 10 ? 1 : count < 25 ? 2 : count < 40 ? 3 : 4
    })
  }
  return data
}

export default function AnkiClient() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [cards, setCards] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])

  useEffect(() => {
    // Load local storage activity data later, use dummy for now
    setActivityData(generateDummyData())
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setError('')

    try {
      // 1. Unzip the .apkg file
      const zip = await JSZip.loadAsync(file)
      
      // 2. Find the SQLite DB inside
      const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2')
      if (!dbFile) {
        throw new Error('File không đúng định dạng Anki (thiếu collection.anki2)')
      }

      const dbData = await dbFile.async('uint8array')

      // 3. Initialize sql.js and load DB
      const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      })
      const db = new SQL.Database(dbData)

      // 4. Query notes (flashcards)
      const res = db.exec("SELECT id, flds, mid FROM notes LIMIT 100")
      if (res.length > 0) {
        const rows = res[0].values
        const parsedCards = rows.map(row => {
          const fields = (row[1] as string).split('\x1f')
          return {
            id: row[0],
            modelId: row[2],
            front: fields[0],
            back: fields[1] || ''
          }
        })
        setCards(parsedCards)
      } else {
        setCards([])
      }
      db.close()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra khi đọc file Anki.')
    } finally {
      setIsProcessing(false)
      // reset file input
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-page py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-ink mb-4 tracking-tight flex items-center justify-center gap-4">
            <BookOpen className="w-10 h-10 text-primary" />
            VNDocs Anki
          </h1>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            Nhập file Anki (.apkg) của bạn vào đây để học từ vựng trực quan, nhanh chóng với hệ thống theo dõi tiến độ mỗi ngày.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="bg-surface rounded-3xl shadow-sm border border-line p-8 mb-8">
          <div className="relative border-2 border-dashed border-line hover:border-primary transition-colors rounded-2xl p-12 text-center group bg-page/50">
            <input
              type="file"
              accept=".apkg"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isProcessing}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <UploadCloud className="w-10 h-10" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {isProcessing ? 'Đang đọc dữ liệu...' : 'Tải file .APKG lên đây'}
                </h3>
                <p className="text-ink-muted">Kéo thả hoặc click để chọn file Anki của bạn</p>
              </div>
            </div>
          </div>
        </div>

        {cards.length > 0 && (
          <div className="bg-surface rounded-3xl shadow-sm border border-line p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Đã tải {cards.length} thẻ ghi nhớ!</h2>
            <button className="bg-primary text-white font-bold py-4 px-12 rounded-full hover:bg-primary-hover hover:scale-105 transition-all text-lg shadow-lg flex items-center gap-2 mx-auto">
              <PlayCircle className="w-6 h-6" /> Bắt đầu học
            </button>
          </div>
        )}

        <div className="bg-surface rounded-3xl shadow-sm border border-line p-8 overflow-hidden">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            🔥 Tiến độ học tập của bạn
          </h2>
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <div className="min-w-[800px]">
              {activityData.length > 0 && (
                <ActivityCalendar 
                  data={activityData} 
                  theme={{
                    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
                  }}
                  labels={{
                    months: [
                      'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
                      'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'
                    ],
                    weekdays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
                    totalCount: '{{count}} từ vựng đã học trong năm qua',
                    legend: {
                      less: 'Ít',
                      more: 'Nhiều'
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
