import { Metadata } from 'next'
import { Suspense } from 'react'
import { DocumentLibraryClient } from './DocumentLibraryClient'

export const metadata: Metadata = {
  title: 'Tài Liệu Tổng Hợp Miễn Phí | VNDocs',
  description: 'Kho tài liệu học tập miễn phí từ thầy cô, trung tâm nổi tiếng — Toán, Văn, Anh, Lý, Hóa, Sinh cho THCS, THPT và luyện thi đại học.',
  keywords: 'tài liệu miễn phí, tài liệu học tập, tài liệu thầy cô, trung tâm nổi tiếng, ôn thi thpt, luyện thi đại học',
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
    <Suspense>
      <DocumentLibraryClient />
    </Suspense>
  )
}
