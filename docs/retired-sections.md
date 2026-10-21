# Writing and Speaking focus

Public navigation, homepages and the sitemap expose Writing and Speaking only. The former exam/document sections and standalone tool pages are retired. Middleware returns HTTP 410 with an X-Robots-Tag noindex header and an HTML robots tag, including localized paths and former PDF/proxy URLs. Retired URLs are deliberately crawlable in robots.txt: crawlers must see the 410/noindex response to remove existing search entries. Search engines choose when their cached results disappear.

The 109 imported provincial/THPT PDFs and their collection workflow are removed from the release. The generated archive catalog is empty. Speaking sample PDFs, Writing bank media, D1/R2 submissions and Writing/Speaking administration are preserved. Legacy source components remain unreachable; retired page renderers and file handlers also fail closed.

Home metadata, sitelink structured data and navigation no longer advertise the archive. Saved global/route SEO referring to retired sections is ignored at render time. The authenticated admin config read deletes obsolete saved SEO in batches of at most 50 keys. Config writes cannot restore retired paths or retired titles/descriptions, and the editor refuses these paths. Valid active practice settings are preserved. No AI key rotation, grading or authentication behavior is changed.

CI covers middleware status/headers, sitemap/robots, metadata fallbacks with stale D1 settings, absence of archive PDFs, and real Header/Footer/Home/SEO editor components at 320/375/1280px. Production checks verify 410/noindex and the active sitemap alongside the existing Writing/Speaking catalog and authentication checks.

The retirement policy also covers singular `/tool`, top-level `/convert`, converter/compression/merge/split/lock aliases, and flat THPT/grade-10 exam slugs, including `/en` and nested paths. All 14 former tool pages now contain only a noindex/not-found fallback: their old titles, descriptions, offers, FAQs and application schema are removed from source. Middleware supplies the public 410 response before those fallbacks render.

Deploying this change stops serving obsolete SEO immediately. Persistent D1 cleanup runs the next time an authenticated administrator loads `/api/admin?type=configs`; it does not run as a public unauthenticated migration. Google sitelinks and cached search results are selected and refreshed by Google, so deployment does not guarantee an immediate change to those results.
