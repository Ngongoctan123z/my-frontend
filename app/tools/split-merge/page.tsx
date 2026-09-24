
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cắt / Gộp File PDF | VNDocs',
  description: 'Trình quản lý PDF đa năng: Cho phép tách rời các trang tài liệu dễ dàng.',
}

import SplitMergeWrapper from './SplitMergeWrapper'

export default function SplitMergeToolPage() {
  return <SplitMergeWrapper />
}
