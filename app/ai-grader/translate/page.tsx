import { Metadata } from 'next'
import { TranslateClient } from './TranslateClient'

export const metadata: Metadata = {
  title: 'Dịch Chuyên Sâu AI | VNDocs',
}

export default function TranslatePage() {
  return <TranslateClient />
}
