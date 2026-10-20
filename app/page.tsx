import { HomeClient } from './HomeClient'
import { getCoreMetadata } from '@/src/utils/serverSeo'
import { SiteIdentity } from '@/src/components/seo/SiteIdentity'

export async function generateMetadata() { return getCoreMetadata("/") }
export default function HomePage() {
  const navigation = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: [
    { '@type': 'SiteNavigationElement', position: 1, name: 'Luyện Writing', url: 'https://vndocs.net/ai-grader' },
    { '@type': 'SiteNavigationElement', position: 2, name: 'Luyện Speaking', url: 'https://vndocs.net/speaking' },
  ] }
  return <><SiteIdentity language="vi" /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(navigation) }} /><HomeClient /></>
}

