import { HomeClient } from '../HomeClient'
import { SiteIdentity } from '@/src/components/seo/SiteIdentity'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
export async function generateMetadata() { return getCoreMetadata('/en') }
export default async function EnglishHomePage() {
  const [metadata, custom] = await Promise.all([getCoreMetadata('/en'), getCustomRouteSeo('/en')])
  return <><SiteIdentity language="en" description={metadata.description || undefined} /><HomeClient language="en" heading={custom?.h1} description={metadata.description || undefined} /></>
}


