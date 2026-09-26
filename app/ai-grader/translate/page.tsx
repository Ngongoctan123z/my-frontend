import { Metadata } from 'next'
import { TranslateClient } from './TranslateClient'

export const metadata: Metadata = {
  title: 'Dịch Nhanh AI | VNDocs',
}

export default function TranslatePage() {
  return <TranslateClient />
}
