'use client'
import { useState } from 'react'
import { AnswerTextarea } from './GraderControls'
import type { ToeicPictureSet } from '@/src/data/toeicWriting'

export function ToeicPictureQuestions({ set, answers, onAnswer, disabled, isEn }: {
  set: ToeicPictureSet; answers: string[]; onAnswer: (index: number, value: string) => void; disabled: boolean; isEn: boolean
}) {
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  return <div className="space-y-4">
    <p className="text-sm leading-relaxed text-slate-500">{isEn ? 'Write one sentence about each picture. Use both words or phrases; you may change their forms and order.' : 'Viết một câu cho mỗi ảnh, dùng cả hai từ hoặc cụm từ gợi ý. Có thể đổi dạng từ và thứ tự.'}</p>
    {set.questions.map((q, index) => <article key={`${set.title}:${q.id}:${q.imageUrl}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-bold text-slate-800">{isEn ? 'Question' : 'Câu'} {q.id}</h3><span className="text-xs text-slate-400">/ 3</span></div>
      <div className="p-4">{failed[q.imageUrl] ? <div role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">{isEn ? 'The picture could not load. Reload it before answering.' : 'Chưa tải được ảnh. Hãy tải lại ảnh trước khi làm câu này.'}<button type="button" onClick={() => setFailed(previous => ({...previous,[q.imageUrl]:false}))} className="ml-2 font-semibold underline">{isEn ? 'Retry' : 'Tải lại'}</button></div> : <img src={q.imageUrl} alt={isEn ? `Picture for question ${q.id}` : `Ảnh câu ${q.id}`} loading={index > 0 ? 'lazy' : 'eager'} onError={() => setFailed(previous => ({...previous,[q.imageUrl]:true}))} className="max-h-80 w-full rounded-lg bg-slate-50 object-contain" />}
        <p className="my-3 text-sm font-semibold text-blue-700">{q.keywords[0]} / {q.keywords[1]}</p>
        <AnswerTextarea answerLabel={`${isEn ? 'TOEIC question' : 'TOEIC câu'} ${q.id}`} isEn={isEn} value={answers[index] || ''} onValueChange={value => onAnswer(index,value)} disabled={disabled} maxLength={800} rows={2} placeholder={isEn ? 'Write one sentence…' : 'Viết một câu theo ảnh…'} className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-blue-500 disabled:bg-slate-50" />
      </div>
    </article>)}
  </div>
}
