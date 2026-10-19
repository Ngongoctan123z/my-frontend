import { HomeClient } from '../HomeClient'
import { SITE_TITLE_EN, SITE_DESCRIPTION_EN } from '@/src/lib/siteSections'
export const metadata = { title: SITE_TITLE_EN, description: SITE_DESCRIPTION_EN, alternates: { canonical: 'https://vndocs.net/en' } }
export default function EnglishHomePage() { return <HomeClient /> }
