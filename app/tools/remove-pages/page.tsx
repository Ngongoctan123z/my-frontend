import { Metadata } from 'next'
import RemovePagesWrapper from './RemovePagesWrapper'

export const metadata: Metadata = {
  title: 'Cắt / Xóa Trang PDF Online Miễn Phí | VNDocs',
  description: 'Tiện ích xóa bỏ, tách và cắt các trang không cần thiết khỏi tài liệu PDF của bạn một cách nhanh chóng, trực quan.',
  keywords: 'xóa trang pdf, cắt pdf, tách pdf, split pdf, remove pdf pages',
  openGraph: {
    title: 'Cắt / Xóa Trang PDF Online Miễn Phí | VNDocs',
    description: 'Tiện ích xóa bỏ, tách và cắt các trang không cần thiết khỏi tài liệu PDF của bạn một cách nhanh chóng, trực quan.',
    siteName: 'VNDocs',
    locale: 'vi_VN',
    type: 'website',
  }
}

export default function RemovePagesPage() {
  return <RemovePagesWrapper />
}

