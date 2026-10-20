import { HomeClient } from '../HomeClient'
import { SiteIdentity } from '@/src/components/seo/SiteIdentity'
import { getCoreMetadata } from '@/src/utils/serverSeo'
export async function generateMetadata() { return getCoreMetadata('/en') }
export default function EnglishHomePage() { return <><SiteIdentity language="en" /><HomeClient /></> }

