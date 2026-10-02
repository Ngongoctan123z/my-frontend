import { Metadata } from 'next'
import { Suspense } from 'react'
import { DocumentLibraryClient } from './DocumentLibraryClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'



export async function generateMetadata() {
  return getRouteMetadata(
    '/ai-grader/tai-lieu-tong-hop',
    'Tài Liệu Tổng Hợp Miễn Phí | VNDocs',
    'Kho tài liệu học tập miễn phí từ thầy cô, trung tâm nổi tiếng — Toán, Văn, Anh, Lý, Hóa, Sinh cho THCS, THPT và luyện thi đại học.'
  )
}

export default function TaiLieuTongHopPage() {
  return (
    <Suspense>
      <DocumentLibraryClient />
    </Suspense>
  )
}
