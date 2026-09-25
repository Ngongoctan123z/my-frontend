import { Metadata } from 'next'
import { GrammarClient } from './GrammarClient'

export const metadata: Metadata = {
  title: 'Soi Lỗi Ngữ Pháp Gắt | VNDocs',
}

export default function GrammarPage() {
  return <GrammarClient />
}
