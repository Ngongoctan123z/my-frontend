import { Metadata } from 'next'
import { ProfileClient } from '@/app/profile/ProfileClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/profile',
    'Personal Profile & Submission History | VNDocs',
    'Manage your profile, view saved essays, track writing test scores over time, and manage subscription settings.'
  )
}

export default function ProfilePageEn() {
  return <ProfileClient isEn={true} />
}
