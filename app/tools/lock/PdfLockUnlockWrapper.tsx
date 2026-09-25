'use client'

import dynamic from 'next/dynamic'

const PdfLockUnlock = dynamic(() => import('@/src/components/tools/PdfLockUnlock').then(mod => mod.PdfLockUnlock), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-slate-500">Đang tải công cụ...</div>
})

export default function PdfLockUnlockWrapper() {
  return <PdfLockUnlock />
}
