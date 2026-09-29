import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chấm Thi Writing HSK AI | VNDocs',
  description: 'Tính năng luyện viết và chấm điểm HSK bằng AI đang được phát triển.',
}

export default function HskPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 text-center">
      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-800 mb-4">Luyện Writing HSK (Tiếng Trung)</h1>
      <p className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">
        Tính năng chấm chữa bài viết HSK bằng Trí Tuệ Nhân Tạo đang được đội ngũ VNDocs phát triển và sẽ sớm ra mắt trong thời gian tới. Mong bạn quay lại sau nhé!
      </p>
      <a href="/ai-grader" className="inline-flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-rose-700 transition-colors">
        Quay lại Luyện IELTS
      </a>
    </div>
  )
}
