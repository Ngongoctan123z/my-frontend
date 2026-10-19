import { HomeClient } from './HomeClient'
import { getCoreMetadata } from '@/src/utils/serverSeo'
import { PAGE_SEO } from '@/src/lib/pageSeo'

export async function generateMetadata() { return getCoreMetadata("/") }
export default function HomePage() {
  const site = { '@context': 'https://schema.org', '@type': 'WebSite', url: 'https://vndocs.net', name: 'VNDocs', inLanguage: 'vi', description: PAGE_SEO['/'].description }
  const navigation = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: [
    { '@type': 'SiteNavigationElement', position: 1, name: 'Luyện Writing', url: 'https://vndocs.net/ai-grader' },
    { '@type': 'SiteNavigationElement', position: 2, name: 'Luyện Speaking', url: 'https://vndocs.net/speaking' },
  ] }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(site) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(navigation) }} /><HomeClient /></>
}
