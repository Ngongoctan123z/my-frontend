import { HomeClient } from '../HomeClient'
import { getCoreMetadata } from '@/src/utils/serverSeo'
export async function generateMetadata() { return getCoreMetadata('/en') }
export default function EnglishHomePage() { return <HomeClient /> }
