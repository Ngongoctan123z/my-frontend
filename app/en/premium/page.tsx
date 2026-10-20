import { getCoreMetadata } from '@/src/utils/serverSeo'
import { PremiumClient } from '@/app/premium/PremiumClient'

export async function generateMetadata() { return getCoreMetadata('/en/premium') }

export default function PremiumPageEn() {
  return <PremiumClient isEn={true} />
}

