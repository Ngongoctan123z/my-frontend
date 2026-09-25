'use client'

import dynamic from 'next/dynamic'

const PdfLockUnlock = dynamic(() => import('@/src/components/tools/PdfLockUnlock').then((mod) => mod.PdfLockUnlock), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center p-12 text-ink-muted">
      Đang tải công cụ xử lý PDF...
    </div>
  ),
})

export default function PdfLockUnlockWrapper() {
  return <PdfLockUnlock />
}
