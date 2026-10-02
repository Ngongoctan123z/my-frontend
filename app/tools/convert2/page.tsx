import type { Metadata } from 'next'
import FileConverterWrapper from './FileConverterWrapper'

export const metadata: Metadata = {
  title: 'Chuyển Đổi Định Dạng Ảnh | VNDocs',
  description: 'Chuyển đổi ảnh giữa các định dạng JPG, PNG, WEBP, BMP, GIF, ICO miễn phí và nhanh chóng.',
}

export default function ConvertImagePage() {
  return <FileConverterWrapper />
}
