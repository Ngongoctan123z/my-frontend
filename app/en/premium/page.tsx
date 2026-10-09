import { Metadata } from 'next'
import { PremiumClient } from '@/app/premium/PremiumClient'

export const metadata: Metadata = {
  title: 'VNDocs Premium - Upgrade Account',
  description: 'Unlock advanced features with a VNDocs Premium account.',
}

export default function PremiumPageEn() {
  return <PremiumClient isEn={true} />
}
