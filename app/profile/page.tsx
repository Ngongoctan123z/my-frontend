import { Metadata } from 'next'
import { ProfileClient } from './ProfileClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
  title: 'Hồ sơ cá nhân — Quản lý tài khoản & lịch sử | VNDocs',
  description: 'Xem và cập nhật thông tin cá nhân, theo dõi lịch sử chấm bài và quản lý gói cước Premium của bạn trên VNDocs.',
}

export default function ProfilePage() {
  return <ProfileClient />
}

