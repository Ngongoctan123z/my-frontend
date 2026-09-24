import { Metadata } from 'next'
import RemovePagesWrapper from './RemovePagesWrapper'

export const metadata: Metadata = {
  title: 'Xóa Trang Tài Liệu | VNDocs',
  description: 'Công cụ xóa các trang không cần thiết khỏi tài liệu.',
}

export default function RemovePagesPage() {
  return <RemovePagesWrapper />
}
