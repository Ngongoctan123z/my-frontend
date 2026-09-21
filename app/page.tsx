import { SearchResults } from '../src/views/SearchResults'
import { Suspense } from 'react'

export default function HomePage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <SearchResults />
    </Suspense>
  )
}
