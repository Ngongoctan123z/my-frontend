'use client'

import React, { useState, useEffect } from 'react'
import { Flashcard, getStudySession, submitCardReview, ReviewGrade } from '@/src/services/flashcardService'
import { Loader2, RotateCcw, ThumbsUp, PartyPopper, BrainCircuit } from 'lucide-react'

export function FlashcardStudyClient({ deckId }: { deckId: number }) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    getStudySession(deckId).then(data => {
      setCards(data)
      setLoading(false)
    })
  }, [deckId])

  const handleReview = async (grade: ReviewGrade) => {
    const currentCard = cards[currentIndex]
    
    // Gọi API lưu tiến độ ngầm
    submitCardReview(currentCard.id, grade).catch(console.error)

    // Chuyển thẻ tiếp theo
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false)
      setCurrentIndex(prev => prev + 1)
    } else {
      setFinished(true)
    }
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (finished || cards.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
          <PartyPopper size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Chúc mừng bạn!</h2>
        <p className="text-slate-500">Bạn đã hoàn thành mục tiêu học tập cho bộ thẻ này ngày hôm nay.</p>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
      {/* Flashcard Area */}
      <div 
        className="relative w-full h-[400px] perspective-1000 mb-8 cursor-pointer group"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`w-full h-full transition-transform duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Mặt trước */}
          <div className="absolute inset-0 backface-hidden bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center group-hover:shadow-md transition-shadow">
            <div 
              className="prose prose-lg text-center"
              dangerouslySetInnerHTML={{ __html: currentCard.frontHtml }} 
            />
            {!isFlipped && (
              <div className="absolute bottom-6 text-sm text-gray-400 font-medium flex items-center gap-1.5 animate-pulse">
                <RotateCcw size={14} /> Chạm để lật
              </div>
            )}
          </div>

          {/* Mặt sau */}
          <div className="absolute inset-0 backface-hidden bg-white border border-blue-100 rounded-2xl shadow-sm p-8 rotate-y-180 flex flex-col justify-center overflow-y-auto">
            <div 
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: currentCard.backHtml }} 
            />
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className={`w-full transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <p className="text-center text-sm font-semibold text-slate-500 mb-3">Bạn thấy thẻ này thế nào?</p>
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => handleReview('again')}
            className="flex flex-col items-center justify-center py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
          >
            <span className="font-bold">Lại</span>
            <span className="text-xs opacity-70">&lt; 1p</span>
          </button>
          <button 
            onClick={() => handleReview('hard')}
            className="flex flex-col items-center justify-center py-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors border border-orange-100"
          >
            <span className="font-bold">Khó</span>
            <span className="text-xs opacity-70">10p</span>
          </button>
          <button 
            onClick={() => handleReview('good')}
            className="flex flex-col items-center justify-center py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
          >
            <span className="font-bold">Tốt</span>
            <span className="text-xs opacity-70">1d</span>
          </button>
          <button 
            onClick={() => handleReview('easy')}
            className="flex flex-col items-center justify-center py-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
          >
            <span className="font-bold">Dễ</span>
            <span className="text-xs opacity-70">4d</span>
          </button>
        </div>
      </div>
      
      {/* Progress */}
      <div className="w-full mt-8 bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${(currentIndex / cards.length) * 100}%` }}
        />
      </div>
      <p className="text-xs font-medium text-slate-400 mt-2">
        {currentIndex} / {cards.length} thẻ
      </p>
    </div>
  )
}
