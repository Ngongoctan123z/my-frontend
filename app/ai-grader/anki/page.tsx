import { Metadata } from 'next'
import AnkiClient from './AnkiClient'

export const metadata: Metadata = {
  title: 'Học Từ Vựng (Anki) | VNDocs',
  description: 'Nhập file Anki và học từ vựng trực quan với spaced repetition.',
}

export default function AnkiPage() {
  return <AnkiClient />
}
