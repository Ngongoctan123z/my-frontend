'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'

type ExamType = 'TOEIC_RESPOND' | 'TOEIC_ESSAY'
type PromptObject = { content: string, imageUrl?: string | null }

export function ToeicGraderClient() {
  const { data: session } = useSession()
  const [examType, setExamType] = useState<ExamType>('TOEIC_ESSAY')
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
    setHistory(data.filter(h => h.examType.startsWith('TOEIC')))
  }

  useEffect(() => {
    if (session?.user?.email) loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email])

  const promptQueue = useRef<PromptObject[]>([])
  const isFetchingQueue = useRef(false)
  const currentExamType = useRef<ExamType>('TOEIC_ESSAY')

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
      throw new Error(data.error || 'ÄÃ£ cÃ³ lá»—i xáº£y ra.');
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

  const gradeEssay = async () => {
    if (!prompt?.content.trim()) {
      setError('Vui lÃ²ng táº¡o Ä‘á» trÆ°á»›c khi cháº¥m.')
      return
    }

    let finalEssay = ''
    if (examType === 'TOEIC_RESPOND') {
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
      
      await saveEssayHistory({
        email: session?.user?.email || 'anonymous',
        examType,
        prompt: prompt.content,
        essay: finalEssay,
        result: data
      })
      loadHistory()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGrading(false)
    }
  }

  const wordCount = examType === 'TOEIC_RESPOND' 
    ? (essayTask1.trim() ? essayTask1.trim().split(/\s+/).length : 0)
    : (
        (essayTask2.intro.trim() ? essayTask2.intro.trim().split(/\s+/).length : 0) +
        (essayTask2.body.trim() ? essayTask2.body.trim().split(/\s+/).length : 0) +
        (essayTask2.conclusion.trim() ? essayTask2.conclusion.trim().split(/\s+/).length : 0)
      )

  const minWords = examType === 'TOEIC_RESPOND' ? 50 : 300

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
                onClick={() => { setExamType('TOEIC_RESPOND'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOEIC_RESPOND' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                TOEIC Writing Q6-7 (Respond to Request)
              </button>
              <button
                onClick={() => { setExamType('TOEIC_ESSAY'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOEIC_ESSAY' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                TOEIC Writing Q8 (Opinion Essay)
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

            {examType === 'TOEIC_RESPOND' ? (
              <textarea
                value={essayTask1}
                onChange={(e) => setEssayTask1(e.target.value)}
                placeholder="Viáº¿t email pháº£n há»“i cá»§a báº¡n vÃ o Ä‘Ã¢y (Tiáº¿ng Anh)..."
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
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Äiá»ƒm ThÃ nh Pháº§n (Thang TOEIC)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.criteria).map(([key, data]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 font-bold mb-1 uppercase">
                          {key}
                        </div>
                        <div className="text-xl font-bold text-indigo-600">{data.score}/5</div>
                        <div className="text-xs text-gray-400 mt-1">{data.feedback}</div>
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
                         <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${item.examType === 'TOEIC_RESPOND' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
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
                            if (item.examType === 'TOEIC_RESPOND') {
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
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n & TiÃªu ChÃ­ Cháº¥m Äiá»ƒm TOEIC Writing Báº±ng AI</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            Há»‡ thá»‘ng <strong>Cháº¥m thi TOEIC Writing AI</strong> cá»§a VNDocs lÃ  giáº£i phÃ¡p luyá»‡n thi hoÃ n háº£o cho ngÆ°á»i Ä‘i lÃ m vÃ  sinh viÃªn. Há»‡ thá»‘ng Ä‘Æ°á»£c tinh chá»‰nh Ä‘áº·c biá»‡t Ä‘á»ƒ cháº¥m Ä‘iá»ƒm 2 pháº§n thi quan trá»ng nháº¥t: Viáº¿t email pháº£n há»“i (Q6-7) vÃ  Viáº¿t bÃ i tiá»ƒu luáº­n (Q8) theo Ä‘Ãºng thang Ä‘iá»ƒm chuáº©n cá»§a ETS.
          </p>
          
          <div className="space-y-4">
            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-purple-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. CÃ¡ch Cháº¥m Äiá»ƒm CÃ¢u 6-7 (Respond to a written request)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">á»ž pháº§n thi nÃ y, báº¡n sáº½ nháº­n Ä‘Æ°á»£c má»™t email vÃ  pháº£i viáº¿t email pháº£n há»“i Ä‘Ã¡p á»©ng Ä‘á»§ yÃªu cáº§u Ä‘á» bÃ i. AI sáº½ cháº¥m theo thang Ä‘iá»ƒm tá»« 0-5 dá»±a trÃªn cÃ¡c yáº¿u tá»‘:</p>
                <ul className="list-disc pl-5 space-y-3">
                  <li><strong>Task Fulfillment (HoÃ n thÃ nh yÃªu cáº§u):</strong> Báº¡n cÃ³ tráº£ lá»i Ä‘á»§ cÃ¡c cÃ¢u há»i hoáº·c cung cáº¥p Ä‘á»§ sá»‘ lÆ°á»£ng thÃ´ng tin mÃ  email gá»‘c yÃªu cáº§u khÃ´ng? (VÃ­ dá»¥: Äá» yÃªu cáº§u Ä‘Æ°a ra 2 gá»£i Ã½ vÃ  Ä‘áº·t 1 cÃ¢u há»i).</li>
                  <li><strong>Organization (Bá»‘ cá»¥c & LiÃªn káº¿t):</strong> Email cÃ³ Ä‘á»§ cáº¥u trÃºc ChÃ o há»i (Salutation), ThÃ¢n bÃ i, vÃ  Káº¿t thÆ° (Closing) khÃ´ng? CÃ¡c cÃ¢u cÃ³ sá»± liÃªn káº¿t tá»± nhiÃªn khÃ´ng?</li>
                  <li><strong>Grammar & Vocabulary (Ngá»¯ phÃ¡p & Tá»« vá»±ng):</strong> Email cÃ´ng sá»Ÿ yÃªu cáº§u ngÃ´n ngá»¯ trang trá»ng (Formal) hoáº·c bÃ¡n trang trá»ng (Semi-formal). Viá»‡c sai chÃ­nh táº£ hay dÃ¹ng tá»« lÃ³ng sáº½ bá»‹ trá»« Ä‘iá»ƒm náº·ng.</li>
                </ul>
              </div>
            </details>

            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-purple-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. BÃ­ Quyáº¿t Äáº¡t Äiá»ƒm Tuyá»‡t Äá»‘i CÃ¢u 8 (Opinion Essay)
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p className="mb-3">CÃ¢u 8 lÃ  pháº§n thi viáº¿t Essay dÃ i tá»‘i thiá»ƒu 300 tá»«. Äá»ƒ Ä‘áº¡t Ä‘iá»ƒm tá»‘i Ä‘a (5/5), báº¡n cáº§n lÆ°u Ã½:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Báº£o vá»‡ quan Ä‘iá»ƒm rÃµ rÃ ng:</strong> TOEIC thÆ°á»ng há»i báº¡n Ä‘á»“ng Ã½ hay khÃ´ng Ä‘á»“ng Ã½ vá»›i má»™t nháº­n Ä‘á»‹nh. Má»Ÿ bÃ i pháº£i thá»ƒ hiá»‡n rÃµ láº­p trÆ°á»ng (Thesis statement).</li>
                  <li><strong>ÄÆ°a lÃ½ do vÃ  vÃ­ dá»¥ cá»¥ thá»ƒ (Reasons & Examples):</strong> KhÃ¡c vá»›i IELTS cÃ³ thá»ƒ láº­p luáº­n hÃ n lÃ¢m, TOEIC Ä‘Ã¡nh giÃ¡ cao cÃ¡c vÃ­ dá»¥ thá»±c táº¿ liÃªn quan Ä‘áº¿n mÃ´i trÆ°á»ng cÃ´ng sá»Ÿ, cÃ´ng viá»‡c hoáº·c Ä‘á»i sá»‘ng thÆ°á»ng ngÃ y.</li>
                  <li><strong>Háº¡n cháº¿ lá»—i ngá»¯ phÃ¡p cÆ¡ báº£n:</strong> TiÃªu chÃ­ cháº¥m TOEIC Ä‘Ã´i khi "gáº¯t" vá» Ä‘á»™ chÃ­nh xÃ¡c hÆ¡n lÃ  Ä‘á»™ phá»©c táº¡p. Má»™t bÃ i viáº¿t vá»›i cÃ¢u Ä‘Æ¡n giáº£n nhÆ°ng chuáº©n xÃ¡c 100% sáº½ Ä‘iá»ƒm cao hÆ¡n bÃ i dÃ¹ng cáº¥u trÃºc phá»©c táº¡p nhÆ°ng sai lá»—i chÃ­nh táº£.</li>
                </ol>
              </div>
            </details>

            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-purple-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. Lá»£i Ãch Khi Luyá»‡n TOEIC Writing Táº¡i VNDocs
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Sá»­a lá»—i nhÆ° gia sÆ° 1 kÃ¨m 1:</strong> AI khÃ´ng chá»‰ bÃ¡o Ä‘iá»ƒm mÃ  cÃ²n chá»‰ ra chÃ­nh xÃ¡c cá»¥m tá»« báº¡n viáº¿t sai, giáº£i thÃ­ch lÃ½ do báº±ng tiáº¿ng Viá»‡t vÃ  Ä‘á» xuáº¥t cÃ¡ch viáº¿t chuáº©n xÃ¡c hÆ¡n.</li>
                  <li><strong>Kho Ä‘á» phong phÃº:</strong> Báº¥m "Bá»‘c Ä‘á» ngáº«u nhiÃªn" Ä‘á»ƒ láº¥y cÃ¡c tÃ¬nh huá»‘ng email vÃ  essay bÃ¡m sÃ¡t thá»±c táº¿ Ä‘á» thi TOEIC.</li>
                  <li><strong>Báº£o máº­t & Tá»‘c Ä‘á»™:</strong> Cháº¥m Ä‘iá»ƒm trong chÆ°a Ä‘áº§y 15 giÃ¢y. Lá»‹ch sá»­ lÃ m bÃ i Ä‘Æ°á»£c lÆ°u hoÃ n toÃ n trÃªn mÃ¡y tÃ­nh cá»§a báº¡n (Local Storage) giÃºp xem láº¡i báº¥t cá»© lÃºc nÃ o mÃ  khÃ´ng sá»£ lá»™ thÃ´ng tin.</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
