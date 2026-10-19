import { HomeClient } from './HomeClient'
import { getRouteMetadata } from '@/src/utils/serverSeo'
import { SITE_TITLE, SITE_DESCRIPTION } from '@/src/lib/siteSections'

export async function generateMetadata() { return getRouteMetadata('/', SITE_TITLE, SITE_DESCRIPTION) }
export default function HomePage() {
  const site = { '@context': 'https://schema.org', '@type': 'WebSite', url: 'https://vndocs.net', name: 'VNDocs', description: SITE_DESCRIPTION }
  const navigation = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: [
    { '@type': 'SiteNavigationElement', position: 1, name: 'Luyện Writing', url: 'https://vndocs.net/ai-grader' },
    { '@type': 'SiteNavigationElement', position: 2, name: 'Luyện Speaking', url: 'https://vndocs.net/speaking' },
  ] }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(site) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(navigation) }} /><HomeClient /></>
}
