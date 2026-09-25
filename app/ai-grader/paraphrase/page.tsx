import { Metadata } from 'next'
import { ParaphraseClient } from './ParaphraseClient'

export const metadata: Metadata = {
  title: 'Diễn Đạt Lại Câu AI | VNDocs',
}

export default function ParaphrasePage() {
  return <ParaphraseClient />
}
