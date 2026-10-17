import React, { useState, useEffect, useRef } from 'react'
import { Loader2, X, CheckCircle2, AlertCircle, FileText, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface GradingResultModalProps {
  isOpen: boolean
  onClose: () => void
  isGrading: boolean
  result: any | null
  examType: string
}

export function GradingResultModal({ isOpen, onClose, isGrading, result, examType }: GradingResultModalProps) {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const isIelts = (examType || '').includes('IELTS')
  const isToeic = (examType || '').includes('TOEIC')
  const isTopik = (examType || '').includes('TOPIK')
  const isHsk = (examType || '').includes('HSK')

  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [internalResult, setInternalResult] = useState<any>(null)
  const [selectedSubTab, setSelectedSubTab] = useState<string>('')
  const wasGradingRef = useRef(false)

  // Determine subtabs for full test
  const fullTestTabs = React.useMemo(() => {
    if (!internalResult?.isFullTest) return []
    const ft = internalResult.fullTestType || (isIelts ? 'IELTS' : isToeic ? 'TOEIC' : isTopik ? 'TOPIK' : isHsk ? 'HSK' : '')

    if (ft === 'IELTS') {
      return [
        { id: 'task1', label: isEn ? 'Task 1 (Report)' : 'Task 1 (Báo cáo)', badge: `Band ${internalResult.task1?.overallBand ?? '-'}` },
        { id: 'task2', label: isEn ? 'Task 2 (Essay)' : 'Task 2 (Nghị luận)', badge: `Band ${internalResult.task2?.overallBand ?? '-'}` }
      ]
    }
    if (ft === 'TOEIC') {
      return [
        { id: 'part1', label: isEn ? 'Part 1 (Q6-7 Email)' : 'Phần 1: Email (Câu 6-7)', badge: `${internalResult.part1?.overallBand ?? '-'}/4` },
        { id: 'part2', label: isEn ? 'Part 2 (Q8 Opinion)' : 'Phần 2: Nghị luận (Câu 8)', badge: `${internalResult.part2?.overallBand ?? '-'}/5` }
      ]
    }
    if (ft === 'TOPIK') {
      return [
        { id: 'topik51', label: isEn ? 'Q51 (10 pts)' : 'Câu 51 (10đ)', badge: `${internalResult.topik51?.overallBand ?? '-'}/10` },
        { id: 'topik52', label: isEn ? 'Q52 (10 pts)' : 'Câu 52 (10đ)', badge: `${internalResult.topik52?.overallBand ?? '-'}/10` },
        { id: 'topik53', label: isEn ? 'Q53 (30 pts)' : 'Câu 53 (30đ)', badge: `${internalResult.topik53?.overallBand ?? '-'}/30` },
        { id: 'topik54', label: isEn ? 'Q54 (50 pts)' : 'Câu 54 (50đ)', badge: `${internalResult.topik54?.overallBand ?? '-'}/50` }
      ]
    }
    if (ft === 'HSK_5') {
      return [
        { id: 'part1', label: isEn ? 'Part 1 (Q91-98)' : 'Phần 1: Sắp xếp câu', badge: `${internalResult.part1?.overallBand ?? 40}/40` },
        { id: 'part2', label: isEn ? 'Part 2 (Q99)' : 'Phần 2: Từ khóa', badge: `${internalResult.part2?.overallBand ?? 30}/30` },
        { id: 'part3', label: isEn ? 'Part 3 (Q100)' : 'Phần 3: Viết theo tranh', badge: `${internalResult.part3?.overallBand ?? 30}/30` }
      ]
    }
    return []
  }, [internalResult, isIelts, isToeic, isTopik, isHsk, isEn])

  // Default selected subtab
  useEffect(() => {
    if (fullTestTabs.length > 0 && !selectedSubTab) {
      setSelectedSubTab(fullTestTabs[0].id)
    }
  }, [fullTestTabs, selectedSubTab])

  // Get active result based on full test subtab
  const activeResult = React.useMemo(() => {
    if (!internalResult) return null
    if (!internalResult.isFullTest) return internalResult
    if (selectedSubTab && internalResult[selectedSubTab]) {
      return internalResult[selectedSubTab]
    }
    return internalResult.task1 || internalResult.part1 || internalResult.topik51 || internalResult
  }, [internalResult, selectedSubTab])

  // Compute maximum scale for active result
  const activeExamType = activeResult?.examType || (
    internalResult?.isFullTest ? (
      (internalResult.fullTestType === 'TOEIC' || isToeic)
        ? (selectedSubTab === 'part2' ? 'TOEIC_ESSAY' : 'TOEIC_RESPOND')
        : (internalResult.fullTestType === 'IELTS' || isIelts)
        ? (selectedSubTab === 'task2' ? 'IELTS_TASK_2' : 'IELTS_TASK_1')
        : (internalResult.fullTestType === 'TOPIK' || isTopik)
        ? (
            selectedSubTab === 'topik51' ? 'TOPIK_51' :
            selectedSubTab === 'topik52' ? 'TOPIK_52' :
            selectedSubTab === 'topik53' ? 'TOPIK_53' : 'TOPIK_54'
          )
        : examType
    ) : examType
  )
  const isSubTopik51 = activeExamType === 'TOPIK_51'
  const isSubTopik52 = activeExamType === 'TOPIK_52'
  const isSubTopik53 = activeExamType === 'TOPIK_53'
  const isSubTopik54 = activeExamType === 'TOPIK_54'

  const overallScale = internalResult?.scoreScale ?? (
    internalResult?.isFullTest ? (
      (internalResult.fullTestType === 'IELTS') ? 9 :
      (internalResult.fullTestType === 'TOEIC') ? 200 :
      (internalResult.fullTestType === 'TOPIK') ? 100 : 100
    ) :
    isSubTopik51 || isSubTopik52 ? 10 :
    isSubTopik53 ? 30 :
    isSubTopik54 ? 50 :
    isIelts ? 9 :
    activeExamType === 'TOEIC_ESSAY' ? 5 :
    activeExamType === 'TOEIC_RESPOND' ? 4 : 100
  )

  const overallScore = internalResult ? (String(internalResult.overallBand ?? '').split('/')[0] || '0') : '0'
  const correctionErrorCount = Array.isArray(activeResult?.corrections)
    ? activeResult.corrections.filter((corr: any) => {
        const type = (corr.type || '').toLowerCase()
        return type.includes('lỗi') || type.includes('error')
      }).length
    : 0

  useEffect(() => {
    if (isGrading) {
      wasGradingRef.current = true
      setProgress(0)
      setActiveStep(0)
      setInternalResult(null)
      setSelectedSubTab('')

      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 98) return 98
          const inc = Math.random() * 3.5 + 1.5
          const next = prev + inc
          if (next > 75) setActiveStep(3)
          else if (next > 50) setActiveStep(2)
          else if (next > 25) setActiveStep(1)
          return next > 98 ? 98 : next
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isGrading])

  useEffect(() => {
    if (result) {
      setInternalResult(result)
      wasGradingRef.current = false
    } else {
      setInternalResult(null)
    }
  }, [result])

  if (!isOpen) return null

  const stepsList = isEn
    ? ['Analyzing topic & requirements', 'Checking grammar & spelling', 'Evaluating coherence & style', 'Finalizing score & rubric']
    : ['Phân tích yêu cầu đề bài', 'Kiểm tra ngữ pháp & chính tả', 'Đánh giá liên kết & diễn đạt', 'Tổng hợp điểm & gợi ý cải thiện']

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
            <h2 className="text-base font-bold text-slate-800">
              {internalResult?.isFullTest
                ? (isEn ? 'Official Full Test Evaluation' : 'Kết Quả Chấm Thi Trọn Bộ')
                : (isEn ? 'Evaluation & Scoring Result' : 'Kết Quả Đánh Giá & Chấm Điểm')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title={isEn ? 'Close' : 'Đóng'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {!internalResult ? (
            /* Loading State */
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-6"></div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {isEn ? 'Evaluating Your Submission...' : 'Đang tiến hành chấm bài...'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                {isEn ? 'Detailed analysis against official grading rubrics. Please wait a moment.' : 'Đang phân tích chi tiết tiêu chí, ngữ pháp và đối chiếu barem khảo thí.'}
              </p>

              {/* Progress Steps */}
              <div className="w-full max-w-md space-y-2.5 text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
                {stepsList.map((st, idx) => {
                  const isDone = activeStep > idx
                  const isCur = activeStep === idx
                  return (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDone ? 'bg-emerald-600 text-white' : isCur ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className={`font-medium ${isDone ? 'text-slate-700' : isCur ? 'text-blue-700 font-semibold' : 'text-slate-400'}`}>
                        {st}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Result State */
            <div className="space-y-6">
              {/* Overall Score Banner */}
              <div className="bg-gradient-to-b from-blue-50/80 to-white border border-blue-200 rounded-xl p-6 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-3 py-1 rounded-md">
                  {internalResult.isFullTest
                    ? (isEn ? 'Official Overall Score' : 'Điểm Tổng Thể Toàn Bộ Bài Thi')
                    : (isEn ? 'Overall Score' : 'Điểm Tổng')}
                </span>
                <div className="mt-3 flex items-baseline justify-center">
                  <span className="text-6xl font-black text-blue-700 tracking-tight">{overallScore}</span>
                  <span className="text-2xl font-bold text-slate-400 ml-1.5">/{overallScale}</span>
                </div>
                {internalResult.isFullTest && internalResult.formula && (
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    {internalResult.formula}
                  </p>
                )}
              </div>

              {/* Subtabs if Full Test */}
              {fullTestTabs.length > 0 && (
                <div className="border-b border-slate-200 pb-3">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {isEn ? 'View section breakdown:' : 'Xem chi tiết từng phần:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fullTestTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedSubTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border ${
                          selectedSubTab === tab.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          selectedSubTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tab.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Criteria Scores Grid */}
              {activeResult?.criteria && Object.keys(activeResult.criteria).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {isEn ? 'Rubric Criteria Breakdown' : 'Điểm Chi Tiết Theo Tiêu Chí'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(activeResult.criteria).map(([k, crit]: [string, any]) => {
                      let label = k
                      let critMax = crit.maxScore ?? (
                        isSubTopik51 || isSubTopik52 ? 5 :
                        isSubTopik53 ? 10 :
                        isSubTopik54 ? (k === 'taskCompletion' ? 20 : 15) :
                        activeExamType === 'HSK_6' ? (k === 'grammar' ? 40 : 30) :
                        (isIelts || activeExamType === 'IELTS_TASK_1' || activeExamType === 'IELTS_TASK_2') ? 9 :
                        (activeExamType === 'TOEIC_ESSAY' || selectedSubTab === 'part2') ? 5 :
                        (activeExamType === 'TOEIC_RESPOND' || selectedSubTab === 'part1' || isToeic) ? 4 :
                        (activeResult?.scoreScale ?? 10)
                      )

                      if (k === 'taskResponse') label = isEn ? 'Task Response (TR)' : 'Đáp ứng yêu cầu (TR)'
                      else if (k === 'taskAchievement') label = isEn ? 'Task Achievement (TA)' : 'Hoàn thành nhiệm vụ (TA)'
                      else if (k === 'coherenceCohesion') label = isEn ? 'Coherence & Cohesion (CC)' : 'Mạch lạc & Liên kết (CC)'
                      else if (k === 'lexicalResource') label = isEn ? 'Lexical Resource (LR)' : 'Vốn từ vựng (LR)'
                      else if (k === 'grammaticalRange') label = isEn ? 'Grammatical Range (GRA)' : 'Ngữ pháp & Cú pháp (GRA)'
                      else if (k === 'reasonsAndExamples') label = isEn ? 'Reasons & Examples' : 'Lập luận & Dẫn chứng'
                      else if (k === 'taskFulfillment') label = isEn ? 'Task Fulfillment' : 'Đáp ứng đề bài'
                      else if (k === 'grammar') label = isEn ? 'Grammar & Syntax' : 'Ngữ pháp & Cú pháp'
                      else if (k === 'vocabulary') label = isEn ? 'Vocabulary' : 'Từ vựng & Diễn đạt'
                      else if (k === 'taskCompletion') {
                        label = (isSubTopik51 || isSubTopik52)
                          ? (isEn ? 'Completion (㉠ & ㉡)' : 'Hoàn thành câu (㉠ & ㉡)')
                          : isSubTopik53
                          ? (isEn ? 'Chart Data & Task' : 'Nội dung & Dữ liệu biểu đồ')
                          : isSubTopik54
                          ? (isEn ? 'Task & Arguments' : 'Nội dung & Luận điểm')
                          : (isEn ? 'Task Completion' : 'Nội dung & Yêu cầu')
                      } else if (k === 'organization') {
                        label = isSubTopik53
                          ? (isEn ? 'Cohesion & Structure' : 'Tính liên kết & Bố cục')
                          : isSubTopik54
                          ? (isEn ? 'Essay Organization' : 'Bố cục bài luận')
                          : (isEn ? 'Organization' : 'Bố cục')
                      } else if (k === 'grammarAndVocabulary') {
                        label = (isSubTopik51 || isSubTopik52)
                          ? (isEn ? 'Grammar & Style' : 'Ngữ pháp & Kính ngữ')
                          : (isEn ? 'Language Accuracy' : 'Ngữ pháp & Từ vựng')
                      }

                      return (
                        <div key={k} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide min-h-[32px]">
                            {label}
                          </div>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-2xl font-black text-blue-600">{crit.score}</span>
                            <span className="text-xs font-semibold text-slate-400 ml-1">/{critMax}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* HSK 5 Parts detail if available */}
              {activeResult?.hsk5Parts && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800">
                    {isEn ? 'HSK 5 Section Summary' : 'Chi tiết các phần HSK 5'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {activeResult.hsk5Parts.part1 && (
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <span className="font-semibold text-slate-700 block mb-1">{isEn ? 'Part 1 (Q91-98)' : 'Phần 1: Sắp xếp'}</span>
                        <span className="text-lg font-bold text-blue-600">{activeResult.hsk5Parts.part1.score}/40</span>
                      </div>
                    )}
                    {activeResult.hsk5Parts.part2 && (
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <span className="font-semibold text-slate-700 block mb-1">{isEn ? 'Part 2 (Q99)' : 'Phần 2: Từ khóa'}</span>
                        <span className="text-lg font-bold text-blue-600">{activeResult.hsk5Parts.part2.score}/30</span>
                      </div>
                    )}
                    {activeResult.hsk5Parts.part3 && (
                      <div className="p-3 bg-white rounded border border-slate-200">
                        <span className="font-semibold text-slate-700 block mb-1">{isEn ? 'Part 3 (Q100)' : 'Phần 3: Theo tranh'}</span>
                        <span className="text-lg font-bold text-blue-600">{activeResult.hsk5Parts.part3.score}/30</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Overall Feedback */}
              {activeResult?.detailedFeedback && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {isEn ? 'Examiner Feedback' : 'Nhận Xét Của Khảo Thí'}
                  </h3>
                  <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {activeResult.detailedFeedback}
                  </div>
                </div>
              )}

              {/* Corrections & Suggestions */}
              {Array.isArray(activeResult?.corrections) && activeResult.corrections.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      {isEn ? 'Corrections & Upgraded Expressions' : 'Nhận Xét Sửa Lỗi & Diễn Đạt Nâng Cao'}
                    </h3>
                    <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500">
                      <span className="text-rose-700">
                        {isEn
                          ? `${correctionErrorCount} errors found`
                          : `Đã phát hiện ${correctionErrorCount} lỗi`}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        {isEn ? 'Error' : 'Lỗi'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {isEn ? 'Suggestion' : 'Gợi ý'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {isEn ? 'Advanced' : 'Nâng cao'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {activeResult.corrections.map((corr: any, idx: number) => {
                      const t = (corr.type || '').trim().toLowerCase()
                      const isError = t.includes('lỗi') || t.includes('error')
                      const isAdvanced = t.includes('nâng cao') || t.includes('advanced')

                      const typeLabel = isError 
                        ? (isEn ? '❌ Error' : '❌ Lỗi') 
                        : isAdvanced 
                          ? (isEn ? '⭐ Advanced Expression' : '⭐ Diễn đạt Nâng cao') 
                          : (isEn ? '💡 Suggestion' : '💡 Gợi ý diễn đạt')

                      const badgeClass = isError
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : isAdvanced
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-300'

                      const cardBorder = isError
                        ? 'border-rose-200 bg-rose-50/20'
                        : isAdvanced
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-amber-200 bg-amber-50/20'

                      const originalBoxClass = isError
                        ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                        : isAdvanced
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50/80 border-amber-200 text-amber-900'

                      const originalLabelClass = isError ? 'text-rose-600' : isAdvanced ? 'text-emerald-700' : 'text-amber-700'
                      const originalTitle = isError 
                        ? (isEn ? 'Original (Error):' : 'Câu gốc (Sai):') 
                        : (isEn ? 'Original sentence:' : 'Câu gốc của bạn:')

                      const correctedBoxClass = isError
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : isAdvanced
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-amber-100/70 border-amber-300 text-amber-950 font-semibold'

                      const correctedLabelClass = isError ? 'text-emerald-600' : isAdvanced ? 'text-emerald-800' : 'text-amber-800'
                      const correctedTitle = isError
                        ? (isEn ? 'Corrected standard:' : 'Sửa lại chuẩn:')
                        : isAdvanced
                          ? (isEn ? 'Advanced Upgrade (C1-C2):' : 'Nâng cấp diễn đạt C1-C2:')
                          : (isEn ? 'More natural suggestion:' : 'Gợi ý diễn đạt tự nhiên hơn:')

                      return (
                        <div key={idx} className={`p-4 rounded-xl border ${cardBorder} space-y-2.5 transition-all`}>
                          <div className="flex items-center justify-between">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeClass}`}>
                              {typeLabel}
                            </span>
                            {corr.impact && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded">
                                {corr.impact}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className={`p-3 rounded-lg border ${originalBoxClass} min-w-0`}>
                              <span className={`text-xs font-bold ${originalLabelClass} block mb-1`}>
                                {originalTitle}
                              </span>
                              <span className={isError ? "line-through decoration-rose-400 font-medium break-words block" : "font-medium break-words block"}>
                                {corr.original}
                              </span>
                            </div>
                            <div className={`p-3 rounded-lg border ${correctedBoxClass} min-w-0`}>
                              <span className={`text-xs font-bold ${correctedLabelClass} block mb-1`}>
                                {correctedTitle}
                              </span>
                              <span className="font-semibold break-words block">{corr.corrected}</span>
                            </div>
                          </div>
                          {corr.explanation && (
                            <p className="text-xs text-slate-600 bg-white/90 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed break-words">
                              {corr.explanation}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {isEn ? 'Result saved to your history.' : 'Đã lưu vào lịch sử làm bài.'}
                </span>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  {isEn ? 'Close Result' : 'Đóng kết quả'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
