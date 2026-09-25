'use client'

import React, { useState, useEffect } from 'react'
import { useAiKey } from '@/src/contexts/AiContext'
import { Loader2, RefreshCw, Send, BrainCircuit, CheckCircle2, AlertCircle, Quote } from 'lucide-react'

export type PracticeTopic = { id: string, name: string, description: string }
export type PracticeLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type PracticePrompt = { vietnameseText: string, context: string }

const HARDCODED_TOPICS: PracticeTopic[] = [
  { id: 'family', name: 'Gia đình', description: 'Các tình huống giao tiếp trong gia đình, họ hàng' },
  { id: 'education', name: 'Giáo dục & Học tập', description: 'Trường lớp, bài tập, thi cử và phương pháp học' },
  { id: 'shopping', name: 'Mua sắm & Dịch vụ', description: 'Đi siêu thị, mặc cả, trả giá, khiếu nại dịch vụ' },
  { id: 'directions', name: 'Chỉ đường & Giao thông', description: 'Hỏi đường, đi phương tiện công cộng, kẹt xe' },
  { id: 'work', name: 'Công sở & Họp hành', description: 'Giao tiếp chuyên nghiệp, báo cáo, làm việc nhóm' },
  { id: 'factory', name: 'Nhà máy & Công xưởng', description: 'Từ vựng sản xuất, máy móc, an toàn lao động' },
  { id: 'travel', name: 'Du lịch & Khách sạn', description: 'Đặt phòng, check-in sân bay, hỏi thông tin' },
  { id: 'health', name: 'Sức khỏe & Y tế', description: 'Đi khám bệnh, miêu tả triệu chứng, mua thuốc' },
  { id: 'technology', name: 'Công nghệ & Mạng xã hội', description: 'Thiết bị điện tử, phần mềm, xu hướng online' },
  { id: 'entertainment', name: 'Sở thích & Giải trí', description: 'Bàn luận về phim ảnh, âm nhạc, thể thao' },
  { id: 'interview', name: 'Phỏng vấn xin việc', description: 'Trả lời câu hỏi HR, đàm phán lương, kỹ năng' },
  { id: 'dating', name: 'Tình yêu & Hẹn hò', description: 'Tán gẫu, bày tỏ tình cảm, các mối quan hệ' },
]

export function ParaphraseClient() {
  const { apiKey } = useAiKey()
  const [topics] = useState<PracticeTopic[]>(HARDCODED_TOPICS)
  const [selectedTopic, setSelectedTopic] = useState<string>('family')
  const [selectedLevel, setSelectedLevel] = useState<PracticeLevel>('B1')
  
  const [currentPrompt, setCurrentPrompt] = useState<PracticePrompt | null>(null)
  const [userTranslation, setUserTranslation] = useState('')
  
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const levels: PracticeLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

  const fetchPrompt = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key Gemini ở phía trên để AI tạo câu hỏi.')
      return
    }

    setIsLoadingPrompt(true)
    setError(null)
    setResult(null)
    setUserTranslation('')
    
    try {
      const topicName = topics.find(t => t.id === selectedTopic)?.name || selectedTopic
      const res = await fetch('/api/ai-grader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey.trim()
        },
        body: JSON.stringify({
          action: 'generate_paraphrase_prompt',
          topic: topicName,
          level: selectedLevel
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Đã xảy ra lỗi.')
      setCurrentPrompt(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoadingPrompt(false)
    }
  }

  const gradeTranslation = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API Key Gemini ở phía trên.')
      return
    }
    if (!currentPrompt || !userTranslation.trim()) {
      setError('Vui lòng nhập câu dịch của bạn.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai-grader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey.trim() ? { 'x-gemini-key': apiKey.trim() } : {})
        },
        body: JSON.stringify({
          action: 'grade_paraphrase',
          level: selectedLevel,
          vietnameseText: currentPrompt.vietnameseText,
          contextText: currentPrompt.context,
          userTranslation: userTranslation
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Đã xảy ra lỗi.')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGrading(false)
    }
  }

  // Load câu đầu tiên
  useEffect(() => {
    if (topics.length > 0) {
      fetchPrompt()
    }
  }, [topics]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      
      {/* Cấu hình Chủ đề & Trình độ */}
      <div className="bg-white rounded-xl border border-line p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-ink mb-2">Chủ đề giao tiếp</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-line bg-page outline-none focus:border-blue-500 text-sm"
            >
              {topics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="text-xs text-ink-muted mt-2">
              {topics.find(t => t.id === selectedTopic)?.description}
            </p>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-semibold text-ink mb-2">Trình độ mục tiêu</label>
            <div className="flex gap-2 flex-wrap">
              {levels.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                    selectedLevel === level
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-page text-ink-muted border border-line hover:border-blue-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchPrompt}
              disabled={isLoadingPrompt}
              className="w-full md:w-auto h-[42px] px-6 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoadingPrompt ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Đổi câu khác
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Box làm bài */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Câu gốc & Input */}
        <div className="space-y-6">
          <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 relative">
            <Quote className="absolute right-4 top-4 text-blue-200 w-12 h-12" />
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase mb-3">
              Câu gốc ({selectedLevel})
            </span>
            <p className="text-lg font-bold text-slate-800 leading-snug">
              {currentPrompt ? currentPrompt.vietnameseText : 'Đang tải...'}
            </p>
            {currentPrompt && currentPrompt.context && (
              <p className="text-sm text-slate-500 mt-2 border-t border-blue-100/50 pt-2">
                <span className="font-semibold text-slate-600">Ngữ cảnh: </span> 
                {currentPrompt.context}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-line p-6 shadow-sm flex flex-col h-[280px]">
            <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <BrainCircuit className="text-blue-600" size={16} /> Bản dịch / Diễn đạt của bạn
            </h3>
            <textarea
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder="Gõ bản tiếng Anh của bạn vào đây..."
              className="flex-1 w-full p-3 rounded-lg border border-line bg-page outline-none focus:border-blue-500 text-sm resize-none"
            />
            <button
              onClick={gradeTranslation}
              disabled={isGrading || !userTranslation.trim()}
              className="mt-4 w-full h-[46px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-emerald-600"
            >
              {isGrading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isGrading ? 'Giám khảo AI đang soi...' : 'Nộp bài & Soi lỗi'}
            </button>
          </div>
        </div>

        {/* Kết quả trả về */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg text-slate-200">
          <h3 className="text-base font-bold text-white mb-4 border-b border-slate-700 pb-3 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={18} /> Nhận xét từ Giám khảo AI
          </h3>

          {!result && !isGrading && (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm text-center">
              Chưa có dữ liệu chấm. Hãy nộp bài để xem AI bóc phốt lỗi sai của bạn nhé!
            </div>
          )}

          {isGrading && (
            <div className="h-[200px] flex flex-col items-center justify-center text-emerald-400 space-y-4">
              <Loader2 size={40} className="animate-spin" />
              <p className="text-sm animate-pulse">Đang dùng tia X-quang soi từng chữ...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fade-up">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
                  {result.score}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Điểm đánh giá</h4>
                  <p className="text-xs text-slate-400">Trên thang 10. Chấm cực gắt theo chuẩn {selectedLevel}.</p>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg">
                <h5 className="font-bold text-sm text-white mb-2 text-rose-400">🔥 Nhận xét chung:</h5>
                <p className="text-sm leading-relaxed text-slate-300">
                  {result.feedback}
                </p>
              </div>

              {result.corrections && result.corrections.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-sm text-white text-orange-400">❌ Bắt lỗi chi tiết:</h5>
                  {result.corrections.map((c: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700/50 text-sm">
                      <div className="line-through text-rose-400 mb-1">{c.original}</div>
                      <div className="text-emerald-400 font-semibold mb-2">👉 {c.corrected}</div>
                      <div className="text-xs text-slate-400 border-t border-slate-700 pt-2">{c.explanation}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.betterAlternatives && result.betterAlternatives.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-sm text-white text-blue-400">💡 Gợi ý diễn đạt hay hơn (Native Level):</h5>
                  <ul className="space-y-2">
                    {result.betterAlternatives.map((alt: string, i: number) => (
                      <li key={i} className="bg-blue-900/20 text-blue-200 p-3 rounded-lg border border-blue-800/30 text-sm font-medium">
                        ✨ {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}
