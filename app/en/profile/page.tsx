import { Metadata } from 'next'
import { ProfileClient } from '@/app/profile/ProfileClient'

export const metadata: Metadata = {
  title: 'Personal Profile - VNDocs',
  description: 'Manage account info, plans, and usage history.',
}

export default function ProfilePageEn() {
  return <ProfileClient isEn={true} />
}
