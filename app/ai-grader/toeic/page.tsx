import { Metadata } from 'next'
import { ToeicGraderClient } from './ToeicGraderClient'

export const metadata: Metadata = {
  title: 'Chấm Thi Luyện Viết TOEIC | VNDocs',
}

export default function ToeicGraderPage() {
  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Luyện Viết TOEIC (Writing)</h1>
        <p className="text-slate-600">Ôn luyện kĩ năng viết TOEIC Q6-7 và Q8 với công nghệ chấm điểm AI tức thì.</p>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <ToeicGraderClient />
      </div>
    </div>
  )
}
