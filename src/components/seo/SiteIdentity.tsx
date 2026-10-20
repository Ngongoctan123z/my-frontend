import { PAGE_SEO, pageUrl } from '@/src/lib/pageSeo'

export function SiteIdentity({ language }: { language: 'vi' | 'en' }) {
  const path = language === 'en' ? '/en' : '/'
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://vndocs.net/#organization',
        name: 'VNDocs',
        url: 'https://vndocs.net',
        logo: { '@type': 'ImageObject', url: 'https://vndocs.net/icon-512.png' },
      },
      {
        '@type': 'WebSite',
        '@id': pageUrl(path) + '/#website',
        name: 'VNDocs',
        url: pageUrl(path),
        inLanguage: language,
        description: PAGE_SEO[path].description,
        publisher: { '@id': 'https://vndocs.net/#organization' },
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
