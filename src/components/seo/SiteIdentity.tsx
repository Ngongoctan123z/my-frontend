import { PAGE_SEO, pageUrl } from '@/src/lib/pageSeo'

export function SiteIdentity({ language, description }: { language: 'vi' | 'en'; description?: string }) {
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
        sameAs: ['https://www.facebook.com/people/Vndocsnet/61595105977293/'],
        contactPoint: { '@type': 'ContactPoint', email: 'vndocsnet@gmail.com', contactType: 'customer support', availableLanguage: ['vi', 'en'] },
      },
      {
        '@type': 'WebSite',
        '@id': pageUrl(path) + (path === '/' ? '/#website' : '#website'),
        name: 'VNDocs',
        url: pageUrl(path),
        inLanguage: language,
        description: description || PAGE_SEO[path].description,
        publisher: { '@id': 'https://vndocs.net/#organization' },
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

