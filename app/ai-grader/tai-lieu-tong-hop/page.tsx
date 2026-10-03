import { Metadata } from 'next'
import { Suspense } from 'react'
import { DocumentLibraryClient } from './DocumentLibraryClient'

export const metadata: Metadata = {
  title: 'Tài Liệu Tổng Hợp Miễn Phí | VNDocs',
  description: 'Kho tài liệu học tập miễn phí từ thầy cô, trung tâm nổi tiếng — Toán, Văn, Anh, Lý, Hóa, Sinh cho THCS, THPT và luyện thi đại học.',
  openGraph: {
    title: 'Tài Liệu Tổng Hợp Miễn Phí | VNDocs',
    description: 'Tổng hợp tài liệu học tập chất lượng cao từ thầy cô và trung tâm nổi tiếng. Hoàn toàn miễn phí.',
    url: 'https://vndocs.net/ai-grader/tai-lieu-tong-hop',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  },
  alternates: { canonical: 'https://vndocs.net/ai-grader/tai-lieu-tong-hop' },
}

export default function TaiLieuTongHopPage() {
  return (
    <div className="py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Tài Liệu Tiếng Anh & Luyện Thi Tổng Hợp Miễn Phí</h1>
        <p className="text-slate-600 font-medium">Kho tài liệu miễn phí được tuyển chọn từ các giáo viên và trung tâm uy tín. Tải xuống giáo trình IELTS, TOEIC, TOPIK, HSK và các đề thi Đại Học môn Toán, Lý, Hóa, Văn, Anh chất lượng cao.</p>
      </div>
      <Suspense>
        <DocumentLibraryClient />
      </Suspense>
    </div>
  )
}
