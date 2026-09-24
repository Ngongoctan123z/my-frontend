'use client'

import dynamic from 'next/dynamic'

const SplitMergeClient = dynamic(() => import('./SplitMergeClient'), {
  ssr: false,
})

export default function SplitMergeWrapper() {
  return <SplitMergeClient />
}
