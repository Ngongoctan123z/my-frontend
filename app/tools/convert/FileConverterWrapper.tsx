'use client'

import dynamic from 'next/dynamic'

const FileConverter = dynamic(() => import('@/src/components/tools/FileConverter').then(mod => mod.FileConverter), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-ink-muted">Đang tải công cụ...</div>
})

export default function FileConverterWrapper() {
  return <FileConverter />
}
