import { Metadata } from 'next'
import { PremiumClient } from '@/app/premium/PremiumClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() {
  return getRouteMetadata(
    '/en/premium',
    'VNDocs Premium — Unlimited Essay Grading & Advanced Features | VNDocs',
    'Upgrade to VNDocs Premium for unlimited essay submissions, comprehensive band score analytics, priority processing, and ad-free educational tools.'
  )
}

export default function PremiumPageEn() {
  return <PremiumClient isEn={true} />
}
