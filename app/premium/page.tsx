import { Metadata } from 'next'
import { PremiumClient } from './PremiumClient'

export const metadata: Metadata = {
  title: 'VNDocs Premium - Nâng Cấp Tài Khoản',
  description: 'Mở khoá các tính năng nâng cao với tài khoản VNDocs Premium.',
}

export default function PremiumPage() {
  return <PremiumClient />
}
