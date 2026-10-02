'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'

type ExamType = 'IELTS_TASK_1' | 'IELTS_TASK_2'
type PromptObject = { content: string, imageUrl?: string | null }

export function AiGraderClient() {
  const { data: session } = useSession()
  const [examType, setExamType] = useState<ExamType>('IELTS_TASK_2')
  const [prompt, setPrompt] = useState<PromptObject | null>(null)
  
  // States for Task 1 and Task 2
  const [essayTask1, setEssayTask1] = useState('')
  const [essayTask2, setEssayTask2] = useState({ intro: '', body: '', conclusion: '' })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(15)

  useEffect(() => {
    fetch('/api/ai-grader').then(r => r.json()).then(data => {
      setUsageCount(data.count || 0)
      setUsageLimit(data.limit || 15)
    }).catch(() => {})
  }, [session])

  const [history, setHistory] = useState<GradedEssayHistory[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Load draft on mount
  useEffect(() => {
    try {
      const savedTask1 = localStorage.getItem('draft_essayTask1')
      const savedTask2 = localStorage.getItem('draft_essayTask2')
      const savedPrompt = localStorage.getItem('draft_prompt')
      const savedExamType = localStorage.getItem('draft_examType')

      if (savedTask1) setEssayTask1(savedTask1)
      if (savedTask2) setEssayTask2(JSON.parse(savedTask2))
      if (savedPrompt) setPrompt(JSON.parse(savedPrompt))
      if (savedExamType) setExamType(savedExamType as ExamType)
    } catch (e) {}
  }, [])

  // Save draft on change
  useEffect(() => {
    localStorage.setItem('draft_essayTask1', essayTask1)
    localStorage.setItem('draft_essayTask2', JSON.stringify(essayTask2))
    if (prompt) localStorage.setItem('draft_prompt', JSON.stringify(prompt))
    localStorage.setItem('draft_examType', examType)
  }, [essayTask1, essayTask2, prompt, examType])

  const loadHistory = async () => {
    if (!session?.user?.email) return
    const data = await getEssayHistory(session.user.email)
    setHistory(data.filter(h => h.examType.startsWith('IELTS')))
  }

  useEffect(() => {
    if (session?.user?.email) loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email])

  const promptQueue = useRef<PromptObject[]>([])
  const isFetchingQueue = useRef(false)
  const currentExamType = useRef<ExamType>('IELTS_TASK_2')

  useEffect(() => {
    promptQueue.current = []
    isFetchingQueue.current = false
    currentExamType.current = examType
    setPrompt(null)
  }, [examType])

  const callApi = async (body: object) => {
    const res = await fetch('/api/ai-grader', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đã có lỗi xảy ra.');
    }
    return data;
  }

  const fetchPromptsBatch = async (type: ExamType) => {
    if (isFetchingQueue.current) return
    isFetchingQueue.current = true
    try {
      const data = await callApi({ action: 'generate_prompt_batch', type })
      if (currentExamType.current === type) {
        promptQueue.current = [...promptQueue.current, ...data.prompts]
      }
    } catch (err) {
      console.error("Background fetch failed:", err)
    } finally {
      isFetchingQueue.current = false
    }
  }

  const generatePrompt = async () => {
    setError(null)
    setResult(null)
    setEssayTask1('')
    setEssayTask2({ intro: '', body: '', conclusion: '' })

    if (promptQueue.current.length === 0) {
      setIsGenerating(true)
      try {
        const data = await callApi({ action: 'generate_prompt_batch', type: examType })
        promptQueue.current = data.prompts
      } catch (err: any) {
        setError(err.message)
        setIsGenerating(false)
        return
      }
      setIsGenerating(false)
    }

    const nextPrompt = promptQueue.current.shift()
    if (nextPrompt) {
      setPrompt(nextPrompt)
    }

    if (promptQueue.current.length <= 1 && !isFetchingQueue.current) {
      fetchPromptsBatch(examType)
    }
  }

  const wordCount = examType === 'IELTS_TASK_1' 
    ? (essayTask1.trim() ? essayTask1.trim().split(/\s+/).length : 0)
    : (
        (essayTask2.intro.trim() ? essayTask2.intro.trim().split(/\s+/).length : 0) +
        (essayTask2.body.trim() ? essayTask2.body.trim().split(/\s+/).length : 0) +
        (essayTask2.conclusion.trim() ? essayTask2.conclusion.trim().split(/\s+/).length : 0)
      )

  const minWords = examType === 'IELTS_TASK_1' ? 150 : 250

  const gradeEssay = async () => {
    if (wordCount < minWords) {
      setError(`Bài viết của bạn chưa đủ ${minWords} từ (mức tối thiểu cho ${examType === 'IELTS_TASK_1' ? 'Task 1' : 'Task 2'}). Vui lòng viết thêm để hệ thống chấm điểm chính xác.`)
      return
    }

    if (!prompt?.content.trim()) {
      setError('Vui lÃ²ng táº¡o Ä‘á» trÆ°á»›c khi cháº¥m.')
      return
    }

    let finalEssay = ''
    if (examType === 'IELTS_TASK_1') {
      finalEssay = essayTask1.trim()
      if (!finalEssay) {
        setError('Vui lÃ²ng viáº¿t bÃ i trÆ°á»›c khi ná»™p.')
        return
      }
    } else {
      const { intro, body, conclusion } = essayTask2
      if (!intro.trim() || !body.trim() || !conclusion.trim()) {
        setError('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ cáº£ 3 pháº§n: Má»Ÿ bÃ i, ThÃ¢n bÃ i vÃ  Káº¿t bÃ i.')
        return
      }
      finalEssay = `[INTRODUCTION]\n${intro}\n\n[BODY]\n${body}\n\n[CONCLUSION]\n${conclusion}`
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const data = await callApi({ action: 'grade_essay', type: examType, prompt: prompt.content, essay: finalEssay })
      setResult(data)
      setUsageCount(prev => prev + 1)
      
      if (session?.user?.email) {
        await saveEssayHistory({
          email: session.user.email,
          examType,
          prompt: prompt.content,
          essay: finalEssay,
          result: data
        })
        loadHistory()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGrading(false)
    }
  }


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <FileEdit className="w-5 h-5 text-blue-600" /> Thiáº¿t láº­p Ä‘á» thi
              </h2>
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                Lá»‹ch sá»­ ({history.length})
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => { setExamType('IELTS_TASK_1'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'IELTS_TASK_1' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                IELTS Writing Task 1
              </button>
              <button
                onClick={() => { setExamType('IELTS_TASK_2'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'IELTS_TASK_2' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                IELTS Writing Task 2
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 text-sm">Ná»™i dung Ä‘á» bÃ i:</label>
                <button
                  onClick={generatePrompt}
                  disabled={isGenerating || isGrading}
                  className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Bá»‘c Ä‘á» ngáº«u nhiÃªn
                </button>
              </div>
              
              <div className="w-full min-h-[120px] p-4 rounded-lg border border-gray-300 bg-gray-50 text-slate-800 text-sm whitespace-pre-wrap">
                {prompt ? prompt.content : "Báº¥m 'Bá»‘c Ä‘á» ngáº«u nhiÃªn' Ä‘á»ƒ báº¯t Ä‘áº§u..."}
              </div>

              {prompt?.imageUrl && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <img src={prompt.imageUrl} alt="Chart/Graph" className="w-full h-auto object-contain bg-white" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                BÃ i lÃ m cá»§a báº¡n
              </h2>
              <div className={`text-xs font-semibold px-2 py-1 rounded ${wordCount >= minWords ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {wordCount} / {minWords} tá»«
              </div>
            </div>

            {examType === 'IELTS_TASK_1' ? (
              <textarea
                value={essayTask1}
                onChange={(e) => setEssayTask1(e.target.value)}
                placeholder="Viáº¿t bÃ i lÃ m Task 1 cá»§a báº¡n vÃ o Ä‘Ã¢y (Tiáº¿ng Anh)..."
                className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-y text-sm leading-relaxed min-h-[300px]"
              />
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Má»Ÿ bÃ i (Introduction)</label>
                  <textarea
                    value={essayTask2.intro}
                    onChange={(e) => setEssayTask2({ ...essayTask2, intro: e.target.value })}
                    placeholder="Paraphrase the prompt & state your thesis..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-y min-h-[120px]"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ThÃ¢n bÃ i (Body Paragraphs)</label>
                  <textarea
                    value={essayTask2.body}
                    onChange={(e) => setEssayTask2({ ...essayTask2, body: e.target.value })}
                    placeholder="Develop your arguments with examples..."
                    className="flex-1 w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-y min-h-[250px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Káº¿t bÃ i (Conclusion)</label>
                  <textarea
                    value={essayTask2.conclusion}
                    onChange={(e) => setEssayTask2({ ...essayTask2, conclusion: e.target.value })}
                    placeholder="Summarize your main points..."
                    className="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm resize-y min-h-[120px]"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!session) return signIn('google')
                gradeEssay()
              }}
              disabled={isGrading || isGenerating}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isGrading ? 'Äang cháº¥m Ä‘iá»ƒm...' : (session ? 'Ná»™p bÃ i & Cháº¥m Ä‘iá»ƒm' : 'ÄÄƒng nháº­p Ä‘á»ƒ Cháº¥m Ä‘iá»ƒm')}
            </button>
            {session && (
              <p className="text-center text-xs text-slate-500 mt-2">
                LÆ°á»£t cháº¥m hÃ´m nay: <span className="font-bold text-slate-700">{usageCount}/{usageLimit}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="h-full">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {!result && !isGrading && !error && (
            <div className="h-full min-h-[500px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <FileEdit className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">ChÆ°a cÃ³ káº¿t quáº£</h3>
              <p className="text-gray-500 text-sm max-w-sm">HoÃ n thÃ nh bÃ i viáº¿t vÃ  ná»™p bÃ i Ä‘á»ƒ nháº­n Ä‘Ã¡nh giÃ¡ chi tiáº¿t theo chuáº©n tiÃªu chÃ­ IELTS.</p>
            </div>
          )}

          {isGrading && (
            <div className="h-full min-h-[500px] border border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Há»‡ thá»‘ng Ä‘ang xá»­ lÃ½...</h3>
              <p className="text-gray-500 text-sm">AI Ä‘ang cháº¥m bÃ i cá»§a báº¡n, vui lÃ²ng Ä‘á»£i trong giÃ¢y lÃ¡t.</p>
            </div>
          )}

          {result && !isGrading && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm sticky top-24">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center text-white">
                <p className="font-semibold text-blue-100 mb-1 text-sm tracking-wider">OVERALL BAND SCORE</p>
                <h2 className="text-5xl font-black">{result.overallBand}</h2>
              </div>

              <div className="p-5 md:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Äiá»ƒm ThÃ nh Pháº§n</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.criteria).map(([key, data]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 font-bold mb-1">
                          {key === 'taskResponse' ? 'Task Response' :
                           key === 'coherenceCohesion' ? 'Coherence & Cohesion' :
                           key === 'lexicalResource' ? 'Lexical Resource' :
                           key === 'grammaticalRange' ? 'Grammar & Accuracy' : key}
                        </div>
                        <div className="text-xl font-bold text-indigo-600">{data.score}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Nháº­n XÃ©t Tá»•ng Quan</h3>
                  <div className="bg-blue-50/50 p-4 rounded-lg">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{result.detailedFeedback}</p>
                  </div>
                </div>

                {result.corrections && result.corrections.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Sá»­a Lá»—i Chi Tiáº¿t</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {result.corrections.map((corr: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                          <div className="flex items-start gap-2 mb-1.5 text-sm">
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-rose-700 line-through">{corr.original}</p>
                          </div>
                          <div className="flex items-start gap-2 mb-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-emerald-700 font-medium">{corr.corrected}</p>
                          </div>
                          <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-600">
                            <strong>LÃ½ do:</strong> {corr.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <History className="w-5 h-5 text-indigo-600" /> 
                Lá»‹ch sá»­ cháº¥m bÃ i (LÆ°u trá»¯ ngoáº¡i tuyáº¿n an toÃ n)
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-700">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>Báº¡n chÆ°a cháº¥m bÃ i nÃ o.</p>
                  <p className="text-sm mt-1">Dá»¯ liá»‡u sáº½ Ä‘Æ°á»£c lÆ°u tá»± Ä‘á»™ng trÃªn trÃ¬nh duyá»‡t mÃ  khÃ´ng cáº§n tÃ i khoáº£n!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${item.examType === 'IELTS_TASK_1' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.examType.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(item.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium line-clamp-2 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="font-bold text-slate-900">Äá» bÃ i:</span> {item.prompt}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="font-bold text-indigo-600">
                          Äiá»ƒm sá»‘: <span className="text-lg">{item.result?.overallBand || 'N/A'}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setExamType(item.examType as ExamType)
                            setPrompt({ content: item.prompt })
                            if (item.examType === 'IELTS_TASK_1') {
                              setEssayTask1(item.essay)
                            } else {
                              // basic parser to populate the 3 fields, since we saved it as a single string
                              const parts = item.essay.split(/\[BODY\]|\[CONCLUSION\]/)
                              const intro = parts[0]?.replace(/\[INTRODUCTION\]/, '').trim() || ''
                              const body = parts[1]?.trim() || ''
                              const conclusion = parts[2]?.trim() || ''
                              setEssayTask2({ intro, body, conclusion })
                            }
                            setResult(item.result)
                            setShowHistoryModal(false)
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Xem chi tiáº¿t <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-between items-center">
                <p className="text-xs text-slate-500 max-w-[60%]">
                  Dá»¯ liá»‡u Ä‘Æ°á»£c lÆ°u trá»¯ an toÃ n ngay trÃªn trÃ¬nh duyá»‡t (IndexedDB), Ä‘áº£m báº£o quyá»n riÃªng tÆ° 100%.
                </p>
                <button 
                  onClick={async () => {
                    if (confirm('Báº¡n cÃ³ cháº¯c muá»‘n xoÃ¡ toÃ n bá»™ lá»‹ch sá»­?')) {
                      await clearEssayHistory(session?.user?.email || 'anonymous')
                      loadHistory()
                    }
                  }}
                  className="text-sm font-semibold flex items-center gap-1.5 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  XÃ³a táº¥t cáº£
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEO Content Section */}
      <section className="mt-12 pt-8 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n & TiÃªu ChÃ­ Cháº¥m Äiá»ƒm IELTS Writing Báº±ng AI</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Há»‡ thá»‘ng <strong>Cháº¥m thi IELTS Writing AI</strong> cá»§a VNDocs lÃ  cÃ´ng cá»¥ miá»…n phÃ­ giÃºp báº¡n luyá»‡n táº­p vÃ  cáº£i thiá»‡n ká»¹ nÄƒng viáº¿t chuáº©n quá»‘c táº¿. Sá»­ dá»¥ng mÃ´ hÃ¬nh TrÃ­ Tuá»‡ NhÃ¢n Táº¡o hiá»‡n Ä‘áº¡i, cÃ´ng cá»¥ tá»± Ä‘á»™ng phÃ¢n tÃ­ch vÃ  Ä‘Æ°a ra Ä‘iá»ƒm sá»‘ mÃ´ phá»ng chÃ­nh xÃ¡c ká»³ thi tháº­t.
          </p>
          
          <div className="space-y-4">
            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. 4 TiÃªu ChÃ­ Cháº¥m Äiá»ƒm (IELTS Grading Criteria)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">BÃ i viáº¿t cá»§a báº¡n Ä‘Æ°á»£c AI Ä‘Ã¡nh giÃ¡ cá»±c ká»³ kháº¯t khe dá»±a trÃªn 4 tiÃªu chÃ­ chÃ­nh thá»©c cá»§a IDP vÃ  Há»™i Ä‘á»“ng Anh (British Council):</p>
                <ul className="list-disc pl-5 space-y-3">
                  <li><strong>Task Response (TR) - ÄÃ¡p á»©ng yÃªu cáº§u Ä‘á» bÃ i:</strong> AI sáº½ kiá»ƒm tra xem báº¡n Ä‘Ã£ tráº£ lá»i Ä‘áº§y Ä‘á»§ cÃ¡c váº¿ cá»§a cÃ¢u há»i chÆ°a? Láº­p luáº­n cÃ³ rÃµ rÃ ng, nháº¥t quÃ¡n vÃ  cÃ³ vÃ­ dá»¥ chá»©ng minh cá»¥ thá»ƒ khÃ´ng. Náº¿u viáº¿t láº¡c Ä‘á» (off-topic), Ä‘iá»ƒm TR sáº½ ráº¥t tháº¥p.</li>
                  <li><strong>Coherence and Cohesion (CC) - TÃ­nh máº¡ch láº¡c vÃ  liÃªn káº¿t:</strong> ÄÃ¡nh giÃ¡ cÃ¡ch báº¡n sáº¯p xáº¿p cÃ¡c Ä‘oáº¡n vÄƒn (Má»Ÿ bÃ i, ThÃ¢n bÃ i, Káº¿t bÃ i). Báº¡n cÃ³ sá»­ dá»¥ng Ä‘a dáº¡ng vÃ  chÃ­nh xÃ¡c cÃ¡c tá»« ná»‘i (Linking words) nhÆ° <em>Furthermore, Nevertheless, On the other hand</em> hay khÃ´ng.</li>
                  <li><strong>Lexical Resource (LR) - Vá»‘n tá»« vá»±ng:</strong> Kiá»ƒm tra má»©c Ä‘á»™ Ä‘a dáº¡ng tá»« vá»±ng. TrÃ­ tuá»‡ nhÃ¢n táº¡o cÃ³ kháº£ nÄƒng phÃ¡t hiá»‡n báº¡n Ä‘ang dÃ¹ng tá»« vá»±ng cÆ¡ báº£n hay nÃ¢ng cao (Less common vocabulary), viá»‡c sá»­ dá»¥ng cÃ¡c cá»¥m tá»« (Collocations) cÃ³ chuáº©n tá»± nhiÃªn (Native-like) hay khÃ´ng.</li>
                  <li><strong>Grammatical Range and Accuracy (GRA) - Sá»± Ä‘a dáº¡ng vÃ  chÃ­nh xÃ¡c ngá»¯ phÃ¡p:</strong> BÃ i viáº¿t pháº£i cÃ³ sá»± káº¿t há»£p nhuáº§n nhuyá»…n giá»¯a cÃ¢u Ä‘Æ¡n, cÃ¢u ghÃ©p vÃ  cÃ¢u phá»©c. AI sáº½ rÃ  soÃ¡t tá»«ng lá»—i chÃ­nh táº£, sai thÃ¬ (Tense), máº¡o tá»« (a/an/the) vÃ  Ä‘Æ°a ra gá»£i Ã½ sá»­a lá»—i hoÃ n háº£o nháº¥t.</li>
                </ul>
              </div>
            </details>

            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. Máº¹o Äáº¡t Band 7.0+ Cho IELTS Task 2
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">Äá»ƒ Ä‘áº¡t Ä‘iá»ƒm cao trong bÃ i thi IELTS Writing Task 2, báº¡n cáº§n Ã¡p dá»¥ng chiáº¿n lÆ°á»£c rÃµ rÃ ng thay vÃ¬ chá»‰ nhá»“i nhÃ©t tá»« khÃ³:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Láº­p dÃ n Ã½ (Outline):</strong> DÃ nh Ã­t nháº¥t 3-5 phÃºt Ä‘áº§u tiÃªn Ä‘á»ƒ gáº¡ch Ä‘áº§u dÃ²ng Ã½ tÆ°á»Ÿng cho ThÃ¢n bÃ i 1 vÃ  ThÃ¢n bÃ i 2. Äiá»u nÃ y giÃºp bÃ i khÃ´ng bá»‹ cá»¥t Ã½ hay thiáº¿u logic giá»¯a chá»«ng.</li>
                  <li><strong>CÃ´ng thá»©c P.I.E cho ThÃ¢n BÃ i:</strong> Má»—i Ä‘oáº¡n thÃ¢n bÃ i nÃªn tuÃ¢n theo cáº¥u trÃºc: <strong>P</strong>oint (Luáº­n Ä‘iá»ƒm chÃ­nh) - <strong>I</strong>llustration (Giáº£i thÃ­ch/VÃ­ dá»¥) - <strong>E</strong>ffect (Háº­u quáº£/Káº¿t quáº£).</li>
                  <li><strong>TrÃ¡nh sá»­ dá»¥ng tá»« ngá»¯ tuyá»‡t Ä‘á»‘i:</strong> HÃ£y dÃ¹ng cÃ¡c tá»« chá»‰ má»©c Ä‘á»™ (Hedging words) nhÆ° <em>tend to, likely, often, majority</em> thay vÃ¬ <em>always, all, everyone</em> Ä‘á»ƒ láº­p luáº­n cháº·t cháº½ vÃ  há»c thuáº­t hÆ¡n.</li>
                  <li><strong>Luyá»‡n táº­p thÆ°á»ng xuyÃªn vá»›i AI Grader:</strong> DÃ¹ng cÃ´ng cá»¥ VNDocs Ä‘á»ƒ liÃªn tá»¥c cháº¥m lá»—i sai. Quan sÃ¡t cÃ¡c pháº§n tá»« vá»±ng mÃ u Ä‘á» bá»‹ gáº¡ch Ä‘i vÃ  há»c thuá»™c cÃ¡ch diá»…n Ä‘áº¡t mÃ u xanh Ä‘á»ƒ tá»± cáº£i thiá»‡n.</li>
                </ol>
              </div>
            </details>

            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-blue-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. CÃ¡ch Sá»­ Dá»¥ng CÃ´ng Cá»¥ Cháº¥m BÃ i AI
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>BÆ°á»›c 1:</strong> Báº¥m nÃºt "Bá»‘c Ä‘á» ngáº«u nhiÃªn" Ä‘á»ƒ há»‡ thá»‘ng chá»n má»™t Ä‘á» IELTS tá»« kho dá»¯ liá»‡u thi tháº­t. Hoáº·c báº¡n cÃ³ thá»ƒ tá»± copy má»™t Ä‘á» bÃªn ngoÃ i vÃ  dÃ¡n vÃ o.</li>
                  <li><strong>BÆ°á»›c 2:</strong> Viáº¿t bÃ i vÃ o cÃ¡c Ã´ tÆ°Æ¡ng á»©ng. Há»‡ thá»‘ng chia sáºµn Má»Ÿ bÃ i, ThÃ¢n bÃ i, Káº¿t bÃ i Ä‘á»ƒ rÃ¨n luyá»‡n thÃ³i quen tÃ¡ch Ä‘oáº¡n. NhÃ¬n Ä‘á»“ng há»“ bá»™ Ä‘áº¿m tá»« (Word count) Ä‘á»ƒ Ä‘áº£m báº£o tá»‘i thiá»ƒu 250 tá»«.</li>
                  <li><strong>BÆ°á»›c 3:</strong> Báº¥m "Ná»™p bÃ i & Cháº¥m Ä‘iá»ƒm". Há»‡ thá»‘ng AI cá»§a chÃºng tÃ´i sáº½ phÃ¢n tÃ­ch trong 10-15 giÃ¢y vÃ  tráº£ ra báº£ng Ä‘iá»ƒm Overall cÃ¹ng cÃ¡c gÃ³p Ã½ siÃªu chi tiáº¿t. Dá»¯ liá»‡u cá»§a báº¡n sáº½ Ä‘Æ°á»£c lÆ°u tá»± Ä‘á»™ng lÃªn trÃ¬nh duyá»‡t Ä‘á»ƒ xem láº¡i.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
