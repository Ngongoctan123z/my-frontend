import { Metadata } from 'next'
import { ProfileClient } from '@/app/profile/ProfileClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() {
  const metadata = await getRouteMetadata(
    '/en/profile',
    'Personal Profile & Submission History | VNDocs',
    'Manage your profile, view saved essays, track writing test scores over time, and manage subscription settings.'
  )
  return { ...metadata, robots: { index: false, follow: false, noarchive: true } }
}

export default function ProfilePageEn() {
  return <ProfileClient isEn={true} />
}

