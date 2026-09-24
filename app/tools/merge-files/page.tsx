import { Metadata } from 'next'
import MergeFilesWrapper from './MergeFilesWrapper'

export const metadata: Metadata = {
  title: 'Gộp File PDF Online Miễn Phí | VNDocs',
  description: 'Công cụ gộp nối nhiều file PDF thành một bản duy nhất. Sắp xếp thứ tự file dễ dàng, nhanh chóng và an toàn.',
  keywords: 'gộp pdf, nối file pdf, merge pdf online, ghép file pdf',
  openGraph: {
    title: 'Gộp File PDF Online Miễn Phí | VNDocs',
    description: 'Công cụ gộp nối nhiều file PDF thành một bản duy nhất. Sắp xếp thứ tự file dễ dàng, nhanh chóng và an toàn.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function MergeFilesPage() {
  return <MergeFilesWrapper />
}

