import React, { useState, useEffect, useRef } from 'react'
import { Loader2, XCircle, CheckCircle2, Sparkles, Activity } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface GradingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGrading: boolean;
  result: any | null;
  examType: string;
}

export function GradingResultModal({ isOpen, onClose, isGrading, result, examType }: GradingResultModalProps) {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [internalResult, setInternalResult] = useState<any>(null)
  const [isFinishing, setIsFinishing] = useState(false)
  const wasGradingRef = useRef(false)

  useEffect(() => {
    if (isGrading) {
      wasGradingRef.current = true
      setProgress(0)
      setActiveStep(0)
      setInternalResult(null)
      setIsFinishing(false)
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return 98;
          // random increment, slightly faster
          const inc = Math.random() * 3.5 + 1.5;
          const next = prev + inc;
          
          if (next > 75) setActiveStep(3);
          else if (next > 50) setActiveStep(2);
          else if (next > 25) setActiveStep(1);
          
          return next > 98 ? 98 : next;
        })
      }, 250)
      
      return () => clearInterval(interval)
    }
  }, [isGrading])

  useEffect(() => {
    if (result) {
      if (wasGradingRef.current) {
        // Fast finish animation
        setIsFinishing(true)
        setProgress(100)
        setActiveStep(4) // All complete
        
        const timer = setTimeout(() => {
          setInternalResult(result)
          setIsFinishing(false)
          wasGradingRef.current = false
        }, 1200)
        
        return () => clearTimeout(timer)
      } else {
        setInternalResult(result)
      }
    } else {
      setInternalResult(null)
    }
  }, [result])

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-white/50 rounded-full p-1 transition-colors z-10"
        >
          <XCircle className="w-7 h-7" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 relative">
          {!internalResult ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
              <div className="relative w-40 h-40 mb-10 flex items-center justify-center group">
                {/* Glowing aura */}
                <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                
                {/* Outer spinning dashed ring */}
                <div className="absolute inset-2 border-4 border-dashed border-[var(--color-primary)]/30 rounded-full animate-[spin_15s_linear_infinite]"></div>
                
                {/* Background track */}
                <div className="absolute inset-4 border-[6px] border-slate-100 dark:border-slate-800 rounded-full shadow-inner"></div>
                
                {/* SVG Progress Circle */}
                <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] -rotate-90 transform drop-shadow-md" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <circle 
                    cx="50" cy="50" r="44" 
                    fill="none" 
                    stroke="url(#grad1)" 
                    strokeWidth="8" 
                    className="transition-all duration-300 ease-out"
                    strokeDasharray="276.46"
                    strokeDashoffset={276.46 - (276.46 * progress) / 100}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-6 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-[0_0_20px_rgba(0,0,0,0.06)] border border-white/50">
                  <Sparkles className="w-5 h-5 text-blue-400 absolute top-4 right-4 animate-bounce" />
                  <span className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-[var(--color-primary)] to-blue-500 tracking-tighter">
                    {Math.floor(progress)}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[var(--color-primary)] animate-pulse" />
                    AI AI
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 mb-3">
                {isEn ? 'AI is analyzing & grading...' : 'AI đang phân tích và chấm điểm...'}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm font-medium">
                {isEn ? 'This process involves deep neural networks and may take 10-30 seconds. Please wait.' : 'Quá trình này sử dụng AI chuyên sâu và có thể mất 10-30 giây. Vui lòng chờ.'}
              </p>
              
              <div className="mt-12 w-full max-w-xl mx-auto grid grid-cols-2 gap-4">
                {(isEn ? ['Context Analysis', 'Grammar Check', 'Vocabulary Eval', 'Result Synthesis'] : ['Phân tích ngữ cảnh', 'Kiểm tra ngữ pháp', 'Đánh giá từ vựng', 'Tổng hợp kết quả']).map((step, idx) => {
                  const isActive = activeStep === idx;
                  const isDone = activeStep > idx;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`relative rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-500 overflow-hidden ${
                        isActive 
                          ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-[var(--color-primary)]/40 scale-[1.02] z-10 transform-gpu' 
                          : isDone
                            ? 'bg-emerald-50/50 border border-emerald-100/60 opacity-80'
                            : 'bg-slate-50/60 border border-slate-100 opacity-60'
                      }`} 
                    >
                      {isActive && (
                         <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent"></div>
                      )}
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isActive 
                            ? 'bg-[var(--color-primary)] text-white shadow-[0_0_15px_var(--color-primary)] animate-pulse' 
                            : isDone
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-400'
                        }`}>
                           {isDone ? <CheckCircle2 className="w-4 h-4" /> : (idx + 1)}
                        </div>
                        <span className={`text-[13px] font-bold tracking-wide transition-colors ${
                          isActive ? 'text-[var(--color-primary)]' : isDone ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          {step}
                        </span>
                      </div>
                      
                      {isActive && (
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 relative z-10">
                            <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-blue-400 w-1/2 rounded-full animate-pulse shadow-[0_0_10px_var(--color-primary)]"></div>
                         </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : result ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10 relative">
                <div className="inline-block p-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 mb-6 relative">
                  <div className="bg-white rounded-[22px] px-12 py-6">
                    <p className="font-bold text-indigo-500 mb-1 text-sm tracking-[0.2em] uppercase">Overall Band Score</p>
                    <h2 className="text-7xl font-black text-slate-800 bg-clip-text text-transparent bg-gradient-to-br from-slate-800 to-slate-600">
                      {result.overallBand}
                    </h2>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{isEn ? 'Detailed Grading Result' : 'Kết Quả Chấm Điểm Chi Tiết'}</h2>
              </div>

              <div className="space-y-8 max-w-3xl mx-auto">
                <div>
                  <h3 className="text-sm font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-[2px] bg-indigo-500 rounded-full"></span>
                    {isEn ? 'Criteria Scores' : 'Điểm Thành Phần'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(result.criteria).map(([key, data]: [string, any]) => {
                      let label = key;
                      if (key === 'taskResponse' || key === 'taskAchievement' || key === 'contentAndTask' || key === 'taskCompletion' || key === 'opinionAndReason') label = isEn ? 'Content & Task' : 'Nội dung & Yêu cầu';
                      if (key === 'coherenceCohesion' || key === 'structure' || key === 'coherence' || key === 'organization') label = isEn ? 'Structure & Cohesion' : 'Bố cục & Liên kết';
                      if (key === 'lexicalResource' || key === 'vocabulary' || key === 'grammarAndVocab') label = isEn ? 'Vocabulary' : 'Từ vựng';
                      if (key === 'grammaticalRange' || key === 'languageUse' || key === 'grammar') label = isEn ? 'Grammar' : 'Ngữ pháp';
                      
                      return (
                        <div key={key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                          <div className="text-[11px] text-slate-400 font-bold mb-2 uppercase tracking-wide min-h-[32px]">{label}</div>
                          <div className="text-3xl font-black text-indigo-600">{data.score}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-[2px] bg-indigo-500 rounded-full"></span>
                    {isEn ? 'Overall Feedback' : 'Nhận Xét Tổng Quan'}
                  </h3>
                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 shadow-sm">
                    <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap">{result.detailedFeedback}</p>
                  </div>
                </div>

                {result.corrections && result.corrections.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-6 h-[2px] bg-indigo-500 rounded-full"></span>
                      {isEn ? 'Corrections & Suggestions' : 'Sửa Lỗi & Gợi Ý Nâng Cao'}
                    </h3>
                    <div className="space-y-4">
                      {result.corrections.map((corr: any, idx: number) => {
                        const typeLower = (corr.type || '').toLowerCase();
                        const isError = typeLower.includes('lỗi');
                        const isAdvanced = typeLower.includes('nâng cao');
                        const isSuggestion = !isError && !isAdvanced;

                        let borderColor = 'border-rose-200 hover:border-rose-300';
                        let tagColor = 'bg-rose-100 text-rose-700';
                        let boxColor = 'bg-rose-50/50 border-rose-100/50';
                        let textColor = 'text-rose-700';
                        let titleColor = 'text-rose-500';

                        if (isAdvanced) {
                          borderColor = 'border-purple-200 hover:border-purple-300';
                          tagColor = 'bg-purple-100 text-purple-700';
                          boxColor = 'bg-slate-50/50 border-slate-200/50';
                          textColor = 'text-slate-600';
                          titleColor = 'text-slate-500';
                        } else if (isSuggestion) {
                          borderColor = 'border-amber-200 hover:border-amber-300';
                          tagColor = 'bg-amber-100 text-amber-700';
                          boxColor = 'bg-slate-50/50 border-slate-200/50';
                          textColor = 'text-slate-600';
                          titleColor = 'text-slate-500';
                        }

                        return (
                          <div key={idx} className={`bg-white p-5 rounded-2xl border ${borderColor} shadow-sm transition-colors relative overflow-hidden`}>
                            {corr.type && (
                              <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-bl-xl ${tagColor}`}>
                                {corr.type}
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4 mb-3 mt-2">
                              <div className={`flex-1 ${boxColor} rounded-xl p-3 border`}>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <XCircle className={`w-4 h-4 ${titleColor} shrink-0`} />
                                  <span className={`text-xs font-bold ${titleColor} uppercase tracking-wider`}>{isEn ? 'Original' : 'Câu gốc'}</span>
                                </div>
                                <p className={`${textColor} text-sm line-through decoration-current/50`}>{corr.original}</p>
                              </div>
                              <div className="flex-1 bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                                    {isError ? (isEn ? 'Correction' : 'Sửa thành') : (isEn ? 'Better Suggestion' : 'Câu gợi ý hay hơn')}
                                  </span>
                                </div>
                                <p className="text-emerald-700 font-medium text-sm">{corr.corrected}</p>
                              </div>
                            </div>
                            <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 flex flex-col gap-2">
                              <div className="flex items-start gap-3">
                                <div className="bg-slate-200/50 text-slate-500 text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 mt-0.5">{isEn ? 'Reason' : 'Lý do'}</div>
                                <p className="text-sm text-slate-600 leading-relaxed">{corr.explanation}</p>
                              </div>
                              {corr.impact && (
                                <div className="flex items-start gap-3 border-t border-slate-200/50 pt-2 mt-1">
                                  <div className="bg-indigo-100/50 text-indigo-600 text-[10px] font-black uppercase px-2 py-1 rounded shrink-0 mt-0.5">{isEn ? 'Impact' : 'Ảnh hưởng điểm'}</div>
                                  <p className="text-sm text-indigo-700 leading-relaxed font-medium">{corr.impact}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <div className="pt-6 text-center">
                  <button onClick={onClose} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95">
                    {isEn ? 'Close Result' : 'Đóng Kết Quả'}
                  </button>
                  <p className="text-xs text-slate-400 mt-4 font-medium">{isEn ? 'This result has been automatically saved to your History.' : 'Kết quả này đã được tự động lưu vào Lịch sử chấm bài của bạn.'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
