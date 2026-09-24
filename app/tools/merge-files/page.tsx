import { Metadata } from 'next'
import MergeFilesWrapper from './MergeFilesWrapper'

export const metadata: Metadata = {
  title: 'Gộp File Tài Liệu | VNDocs',
  description: 'Công cụ gộp nhiều file tài liệu lại thành một file duy nhất nhanh chóng.',
}

export default function MergeFilesPage() {
  return <MergeFilesWrapper />
}
