'use client'

import dynamic from 'next/dynamic'

const RemovePagesClient = dynamic(() => import('./RemovePagesClient'), {
  ssr: false,
})

export default function RemovePagesWrapper() {
  return <RemovePagesClient />
}
