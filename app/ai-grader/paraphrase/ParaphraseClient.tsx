'use client'

import React, { useState, useEffect } from 'react'
import { useAiKey } from '@/src/contexts/AiContext'
import { Loader2, RefreshCw, Send, BrainCircuit, CheckCircle2, AlertCircle, Quote } from 'lucide-react'

export type PracticeTopic = { id: string, name: string, description: string }
export type PracticeLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type PracticePrompt = { vietnameseText: string, context: string }

const HARDCODED_TOPICS: PracticeTopic[] = [
  { id: 'family', name: 'Gia Ä‘Ã¬nh', description: 'CÃ¡c tÃ¬nh huá»‘ng giao tiáº¿p trong gia Ä‘Ã¬nh, há» hÃ ng' },
  { id: 'education', name: 'GiÃ¡o dá»¥c & Há»c táº­p', description: 'TrÆ°á»ng lá»›p, bÃ i táº­p, thi cá»­ vÃ  phÆ°Æ¡ng phÃ¡p há»c' },
  { id: 'shopping', name: 'Mua sáº¯m & Dá»‹ch vá»¥', description: 'Äi siÃªu thá»‹, máº·c cáº£, tráº£ giÃ¡, khiáº¿u náº¡i dá»‹ch vá»¥' },
  { id: 'directions', name: 'Chá»‰ Ä‘Æ°á»ng & Giao thÃ´ng', description: 'Há»i Ä‘Æ°á»ng, Ä‘i phÆ°Æ¡ng tiá»‡n cÃ´ng cá»™ng, káº¹t xe' },
  { id: 'work', name: 'CÃ´ng sá»Ÿ & Há»p hÃ nh', description: 'Giao tiáº¿p chuyÃªn nghiá»‡p, bÃ¡o cÃ¡o, lÃ m viá»‡c nhÃ³m' },
  { id: 'factory', name: 'NhÃ  mÃ¡y & CÃ´ng xÆ°á»Ÿng', description: 'Tá»« vá»±ng sáº£n xuáº¥t, mÃ¡y mÃ³c, an toÃ n lao Ä‘á»™ng' },
  { id: 'travel', name: 'Du lá»‹ch & KhÃ¡ch sáº¡n', description: 'Äáº·t phÃ²ng, check-in sÃ¢n bay, há»i thÃ´ng tin' },
  { id: 'health', name: 'Sá»©c khá»e & Y táº¿', description: 'Äi khÃ¡m bá»‡nh, miÃªu táº£ triá»‡u chá»©ng, mua thuá»‘c' },
  { id: 'technology', name: 'CÃ´ng nghá»‡ & Máº¡ng xÃ£ há»™i', description: 'Thiáº¿t bá»‹ Ä‘iá»‡n tá»­, pháº§n má»m, xu hÆ°á»›ng online' },
  { id: 'entertainment', name: 'Sá»Ÿ thÃ­ch & Giáº£i trÃ­', description: 'BÃ n luáº­n vá» phim áº£nh, Ã¢m nháº¡c, thá»ƒ thao' },
  { id: 'interview', name: 'Phá»ng váº¥n xin viá»‡c', description: 'Tráº£ lá»i cÃ¢u há»i HR, Ä‘Ã m phÃ¡n lÆ°Æ¡ng, ká»¹ nÄƒng' },
  { id: 'dating', name: 'TÃ¬nh yÃªu & Háº¹n hÃ²', description: 'TÃ¡n gáº«u, bÃ y tá» tÃ¬nh cáº£m, cÃ¡c má»‘i quan há»‡' },
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
      setError('Vui lÃ²ng nháº­p API Key Gemini á»Ÿ phÃ­a trÃªn Ä‘á»ƒ AI táº¡o cÃ¢u há»i.')
      return
    }

    setIsLoadingPrompt(true)
    setError(null)
    setResult(null)
    setUserTranslation('')
    
    try {
      const topicName = topics.find(t => t.id === selectedTopic)?.name || selectedTopic
      const { callAiGraderClient } = await import('@/src/utils/geminiClient')
      const data = await callAiGraderClient(
        {
          action: 'generate_paraphrase_prompt',
          topic: topicName,
          level: selectedLevel
        },
        apiKey.trim()
      )
      setCurrentPrompt(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoadingPrompt(false)
    }
  }

  const gradeTranslation = async () => {
    if (!apiKey.trim()) {
      setError('Vui lÃ²ng nháº­p API Key Gemini á»Ÿ phÃ­a trÃªn.')
      return
    }
    if (!currentPrompt || !userTranslation.trim()) {
      setError('Vui lÃ²ng nháº­p cÃ¢u dá»‹ch cá»§a báº¡n.')
      return
    }

    setIsGrading(true)
    setError(null)
    setResult(null)

    try {
      const { callAiGraderClient } = await import('@/src/utils/geminiClient')
      const data = await callAiGraderClient(
        {
          action: 'grade_paraphrase',
          level: selectedLevel,
          vietnameseText: currentPrompt.vietnameseText,
          contextText: currentPrompt.context,
          userTranslation
        },
        apiKey.trim()
      )
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGrading(false)
    }
  }

  // Load cÃ¢u Ä‘áº§u tiÃªn
  useEffect(() => {
    // Ð? tr?ng
  }, [topics]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      
      {/* Cáº¥u hÃ¬nh Chá»§ Ä‘á» & TrÃ¬nh Ä‘á»™ */}
      <div className="bg-white rounded-xl border border-line p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-ink mb-2">Chá»§ Ä‘á» giao tiáº¿p</label>
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
            <label className="block text-sm font-semibold text-ink mb-2">TrÃ¬nh Ä‘á»™ má»¥c tiÃªu</label>
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
              Äá»•i cÃ¢u khÃ¡c
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

      {/* Box lÃ m bÃ i */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CÃ¢u gá»‘c & Input */}
        <div className="space-y-6">
          <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 relative">
            <Quote className="absolute right-4 top-4 text-blue-200 w-12 h-12" />
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase mb-3">
              CÃ¢u gá»‘c ({selectedLevel})
            </span>
            <p className="text-lg font-bold text-slate-800 leading-snug">
              {currentPrompt ? currentPrompt.vietnameseText : 'Äang táº£i...'}
            </p>
            {currentPrompt && currentPrompt.context && (
              <p className="text-sm text-slate-500 mt-2 border-t border-blue-100/50 pt-2">
                <span className="font-semibold text-slate-600">Ngá»¯ cáº£nh: </span> 
                {currentPrompt.context}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-line p-6 shadow-sm flex flex-col h-[280px]">
            <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
              <BrainCircuit className="text-blue-600" size={16} /> Báº£n dá»‹ch / Diá»…n Ä‘áº¡t cá»§a báº¡n
            </h3>
            <textarea
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder="GÃµ báº£n tiáº¿ng Anh cá»§a báº¡n vÃ o Ä‘Ã¢y..."
              className="flex-1 w-full p-3 rounded-lg border border-line bg-page outline-none focus:border-blue-500 text-sm resize-none"
            />
            <button
              onClick={gradeTranslation}
              disabled={isGrading || !userTranslation.trim()}
              className="mt-4 w-full h-[46px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-emerald-600"
            >
              {isGrading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isGrading ? 'GiÃ¡m kháº£o AI Ä‘ang soi...' : 'Ná»™p bÃ i & Soi lá»—i'}
            </button>
          </div>
        </div>

        {/* Káº¿t quáº£ tráº£ vá» */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg text-slate-200">
          <h3 className="text-base font-bold text-white mb-4 border-b border-slate-700 pb-3 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={18} /> Nháº­n xÃ©t tá»« GiÃ¡m kháº£o AI
          </h3>

          {!result && !isGrading && (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm text-center">
              ChÆ°a cÃ³ dá»¯ liá»‡u cháº¥m. HÃ£y ná»™p bÃ i Ä‘á»ƒ xem AI bÃ³c phá»‘t lá»—i sai cá»§a báº¡n nhÃ©!
            </div>
          )}

          {isGrading && (
            <div className="h-[200px] flex flex-col items-center justify-center text-emerald-400 space-y-4">
              <Loader2 size={40} className="animate-spin" />
              <p className="text-sm animate-pulse">Äang dÃ¹ng tia X-quang soi tá»«ng chá»¯...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fade-up">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center text-2xl font-black text-white shrink-0">
                  {result.score}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Äiá»ƒm Ä‘Ã¡nh giÃ¡</h4>
                  <p className="text-xs text-slate-400">TrÃªn thang 10. Cháº¥m cá»±c gáº¯t theo chuáº©n {selectedLevel}.</p>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg">
                <h5 className="font-bold text-sm text-white mb-2 text-rose-400">ðŸ”¥ Nháº­n xÃ©t chung:</h5>
                <p className="text-sm leading-relaxed text-slate-300">
                  {result.feedback}
                </p>
              </div>

              {result.corrections && result.corrections.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-sm text-white text-orange-400">âŒ Báº¯t lá»—i chi tiáº¿t:</h5>
                  {result.corrections.map((c: any, i: number) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700/50 text-sm">
                      <div className="line-through text-rose-400 mb-1">{c.original}</div>
                      <div className="text-emerald-400 font-semibold mb-2">ðŸ‘‰ {c.corrected}</div>
                      <div className="text-xs text-slate-400 border-t border-slate-700 pt-2">{c.explanation}</div>
                    </div>
                  ))}
                </div>
              )}

              {result.betterAlternatives && result.betterAlternatives.length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-bold text-sm text-white text-blue-400">ðŸ’¡ Gá»£i Ã½ diá»…n Ä‘áº¡t hay hÆ¡n (Native Level):</h5>
                  <ul className="space-y-2">
                    {result.betterAlternatives.map((alt: string, i: number) => (
                      <li key={i} className="bg-blue-900/20 text-blue-200 p-3 rounded-lg border border-blue-800/30 text-sm font-medium">
                        âœ¨ {alt}
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


