'use client'

import dynamic from 'next/dynamic'

const MergeFilesClient = dynamic(() => import('./MergeFilesClient'), {
  ssr: false,
})

export default function MergeFilesWrapper() {
  return <MergeFilesClient />
}
