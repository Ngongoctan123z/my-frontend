import { HomeClient } from './HomeClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { SiteIdentity } from '@/src/components/seo/SiteIdentity'

export async function generateMetadata() { return getCoreMetadata("/") }
export default async function HomePage() {
  const [metadata, custom] = await Promise.all([getCoreMetadata('/'), getCustomRouteSeo('/')])
  const navigation = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: [
    { '@type': 'SiteNavigationElement', position: 1, name: 'Luyện Writing', url: 'https://vndocs.net/ai-grader' },
    { '@type': 'SiteNavigationElement', position: 2, name: 'Luyện Speaking', url: 'https://vndocs.net/speaking' },
  ] }
  return <><SiteIdentity language="vi" description={metadata.description || undefined} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(navigation).replace(/</g, '\\u003c') }} /><HomeClient language="vi" heading={custom?.h1} description={metadata.description || undefined} /></>
}


