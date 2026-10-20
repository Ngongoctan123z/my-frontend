import { getCoreMetadata } from '@/src/utils/serverSeo'
import { PremiumClient } from './PremiumClient'

export async function generateMetadata() { return getCoreMetadata('/premium') }

export default function PremiumPage() {
  return <PremiumClient />
}

