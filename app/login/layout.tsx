import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Keep account access and temporary user content out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
}

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return children
}
