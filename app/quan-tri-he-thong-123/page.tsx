import { Metadata } from 'next'
import { Admin } from '../../src/views/Admin'

export const metadata: Metadata = {
  title: 'Quản trị hệ thống | VNDocs',
  description: 'Trang quản trị nội dung VNDocs.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminPage() {
  return <Admin />
}
