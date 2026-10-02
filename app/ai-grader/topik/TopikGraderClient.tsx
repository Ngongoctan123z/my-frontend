'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileEdit, Loader2, RefreshCw, Send, AlertCircle, CheckCircle2, XCircle, History, Clock, Trash2, ArrowRight } from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'
import { saveEssayHistory, getEssayHistory, clearEssayHistory, GradedEssayHistory } from '@/src/utils/indexedDB'

type ExamType = 'TOPIK_51_52' | 'TOPIK_53' | 'TOPIK_54'
type PromptObject = { content: string, imageUrl?: string | null }

export function TopikGraderClient() {
  const { data: session } = useSession()
  const [examType, setExamType] = useState<ExamType>('TOPIK_53')
  const [prompt, setPrompt] = useState<PromptObject | null>(null)
  
  const [essay, setEssay] = useState('')
  
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

  useEffect(() => {
    try {
      const savedEssay = localStorage.getItem('draft_topik_essay')
      const savedPrompt = localStorage.getItem('draft_topik_prompt')
      const savedExamType = localStorage.getItem('draft_topik_examType')

      if (savedEssay) setEssay(savedEssay)
      if (savedPrompt) setPrompt(JSON.parse(savedPrompt))
      if (savedExamType) setExamType(savedExamType as ExamType)
    } catch (e) {}
  }, [])

  useEffect(() => {
    localStorage.setItem('draft_topik_essay', essay)
    if (prompt) localStorage.setItem('draft_topik_prompt', JSON.stringify(prompt))
    localStorage.setItem('draft_topik_examType', examType)
  }, [essay, prompt, examType])

  const loadHistory = async () => {
    if (!session?.user?.email) return
    const data = await getEssayHistory(session.user.email)
    setHistory(data.filter(h => h.examType.startsWith('TOPIK')))
  }

  useEffect(() => {
    if (session?.user?.email) loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email])

  const promptQueue = useRef<PromptObject[]>([])
  const isFetchingQueue = useRef(false)
  const currentExamType = useRef<ExamType>('TOPIK_53')

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
    setEssay('')

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

    const finalEssay = essay.trim()
    if (!finalEssay) {
      setError('Vui lÃ²ng viáº¿t bÃ i trÆ°á»›c khi ná»™p.')
      return
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

  // Tiáº¿ng HÃ n Ä‘áº¿m chá»¯ (characters)
  const charCount = essay.replace(/\s+/g, '').length
  let minChars = 0
  if (examType === 'TOPIK_53') minChars = 200
  if (examType === 'TOPIK_54') minChars = 600

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <FileEdit className="w-5 h-5 text-emerald-600" /> Thiáº¿t láº­p Ä‘á» thi TOPIK
              </h2>
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                Lá»‹ch sá»­ ({history.length})
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => { setExamType('TOPIK_51_52'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOPIK_51_52' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                CÃ¢u 51-52 (Äiá»n tá»«)
              </button>
              <button
                onClick={() => { setExamType('TOPIK_53'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOPIK_53' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                CÃ¢u 53 (Biá»ƒu Ä‘á»“)
              </button>
              <button
                onClick={() => { setExamType('TOPIK_54'); setResult(null); setPrompt(null); }}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all border ${
                  examType === 'TOPIK_54' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                CÃ¢u 54 (Nghá»‹ luáº­n)
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-medium text-slate-700 text-sm">Ná»™i dung Ä‘á» bÃ i:</label>
                <button
                  onClick={generatePrompt}
                  disabled={isGenerating || isGrading}
                  className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
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
              {minChars > 0 && (
                <div className={`text-xs font-semibold px-2 py-1 rounded ${charCount >= minChars ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {charCount} / {minChars} chá»¯
                </div>
              )}
            </div>

            <textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Viáº¿t bÃ i cá»§a báº¡n báº±ng Tiáº¿ng HÃ n vÃ o Ä‘Ã¢y..."
              className="flex-1 w-full p-4 rounded-lg border border-gray-300 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none text-base leading-relaxed font-sans"
            />

            <button
              onClick={() => {
                if (!session) return signIn('google')
                gradeEssay()
              }}
              disabled={isGrading || isGenerating}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
              <p className="text-gray-500 text-sm max-w-sm">HoÃ n thÃ nh bÃ i viáº¿t vÃ  ná»™p bÃ i Ä‘á»ƒ nháº­n Ä‘Ã¡nh giÃ¡ chi tiáº¿t theo chuáº©n TOPIK.</p>
            </div>
          )}

          {isGrading && (
            <div className="h-full min-h-[500px] border border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Há»‡ thá»‘ng Ä‘ang xá»­ lÃ½...</h3>
              <p className="text-gray-500 text-sm">AI Ä‘ang cháº¥m bÃ i cá»§a báº¡n, vui lÃ²ng Ä‘á»£i trong giÃ¢y lÃ¡t.</p>
            </div>
          )}

          {result && !isGrading && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm sticky top-24">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-center text-white">
                <p className="font-semibold text-emerald-100 mb-1 text-sm tracking-wider">ÄIá»‚M ÄÃNH GIÃ (SCORE)</p>
                <h2 className="text-5xl font-black">{result.overallBand}</h2>
              </div>

              <div className="p-5 md:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">TiÃªu ChÃ­ ÄÃ¡nh GiÃ¡ TOPIK</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.criteria || {}).map(([key, data]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="text-xs text-gray-500 font-bold mb-1 uppercase">
                          {key}
                        </div>
                        <div className="text-xl font-bold text-emerald-600">{data.score}/100</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Nháº­n XÃ©t Tá»•ng Quan</h3>
                  <div className="bg-emerald-50/50 p-4 rounded-lg">
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{result.detailedFeedback}</p>
                  </div>
                </div>

                {result.corrections && result.corrections.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-gray-100 pb-2 uppercase tracking-wide">Sá»­a Lá»—i Chi Tiáº¿t</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {result.corrections.map((corr: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-emerald-200 transition-colors">
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
                <History className="w-5 h-5 text-emerald-600" /> 
                Lá»‹ch sá»­ cháº¥m bÃ i TOPIK
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
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                         <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-emerald-100 text-emerald-700">
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
                        <div className="font-bold text-emerald-600">
                          Äiá»ƒm sá»‘: <span className="text-lg">{item.result?.overallBand || 'N/A'}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setExamType(item.examType as ExamType)
                            setPrompt({ content: item.prompt })
                            setEssay(item.essay)
                            setResult(item.result)
                            setShowHistoryModal(false)
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
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
              <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-end">
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
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">HÆ°á»›ng Dáº«n Luyá»‡n Viáº¿t TOPIK Báº±ng AI</h2>
          <p className="mb-6 text-slate-600 text-center leading-relaxed">
            CÃ´ng cá»¥ cháº¥m Ä‘iá»ƒm TOPIK II Writing tá»± Ä‘á»™ng báº±ng AI giÃºp báº¡n luyá»‡n táº­p cÃ¡c bÃ i viáº¿t TOPIK (cÃ¢u 51-54), Ä‘Ã¡nh giÃ¡ chÃ­nh xÃ¡c ngá»¯ phÃ¡p, tá»« vá»±ng vÃ  cáº¥u trÃºc theo tiÃªu chuáº©n TOPIK.
          </p>
          
          <div className="space-y-4">
            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-emerald-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                1. CÃ¢u 51-52: Dáº¡ng bÃ i Ä‘iá»n tá»«
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>Báº¡n pháº£i Ä‘iá»n má»™t cÃ¢u ngáº¯n (hoáº·c cá»¥m tá»«) vÃ o chá»— trá»‘ng Ä‘á»ƒ hoÃ n thÃ nh thÃ´ng bÃ¡o, email hoáº·c bÃ i viáº¿t ngáº¯n sao cho phÃ¹ há»£p vá»›i ngá»¯ cáº£nh, kÃ­nh ngá»¯ vÃ  ngá»¯ phÃ¡p.</p>
              </div>
            </details>

            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-emerald-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                2. CÃ¢u 53: Viáº¿t phÃ¢n tÃ­ch biá»ƒu Ä‘á»“
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>Báº¡n sáº½ pháº£i quan sÃ¡t má»™t biá»ƒu Ä‘á»“ cho sáºµn vÃ  viáº¿t Ä‘oáº¡n vÄƒn (200 - 300 chá»¯) mÃ´ táº£ láº¡i nhá»¯ng thay Ä‘á»•i, nguyÃªn nhÃ¢n vÃ  káº¿t quáº£. ÄÃ¢y lÃ  bÃ i thi Ä‘Ã²i há»i náº¯m vá»¯ng máº«u cÃ¢u (template) biá»ƒu Ä‘á»“.</p>
              </div>
            </details>

            <details open className="group border border-gray-200 rounded-lg bg-white shadow-sm open:bg-emerald-50/30 transition-colors">
              <summary className="cursor-pointer font-bold text-lg text-slate-800 p-5 flex justify-between items-center list-none">
                3. CÃ¢u 54: Nghá»‹ luáº­n xÃ£ há»™i
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="p-5 border-t border-gray-200 text-slate-700 leading-relaxed">
                <p>BÃ i luáº­n dÃ i khoáº£ng 600 - 700 chá»¯ vá»›i 1 chá»§ Ä‘á» cá»‘ Ä‘á»‹nh vÃ  3 cÃ¢u há»i gá»£i Ã½. Báº¡n pháº£i Ä‘áº£m báº£o chia Ä‘oáº¡n (Má»Ÿ, ThÃ¢n, Káº¿t) rÃµ rÃ ng vÃ  sá»­ dá»¥ng tá»« vá»±ng á»Ÿ trÃ¬nh Ä‘á»™ cao cáº¥p.</p>
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
