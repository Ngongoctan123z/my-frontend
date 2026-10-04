import { Metadata } from 'next'
import { ProfileClient } from './ProfileClient'

export const metadata: Metadata = {
  title: 'Hồ sơ cá nhân - VNDocs',
  description: 'Quản lý thông tin tài khoản, gói cước và lịch sử sử dụng.',
}

export default function ProfilePage() {
  return <ProfileClient />
}
