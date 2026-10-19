# Writing and Speaking focus

Public navigation, homepages and the sitemap expose Writing and Speaking only. The former exam/document sections and standalone tool pages are retired. Middleware returns HTTP 410 with an X-Robots-Tag noindex header and an HTML robots tag, including localized paths and former PDF/proxy URLs. Retired URLs are deliberately crawlable in robots.txt: crawlers must see the 410/noindex response to remove existing search entries. Search engines choose when their cached results disappear.

The 109 imported provincial/THPT PDFs and their collection workflow are removed from the release. The generated archive catalog is empty. Speaking sample PDFs, Writing bank media, D1/R2 submissions and Writing/Speaking administration are preserved. Legacy source components remain unreachable; retired page renderers and file handlers also fail closed.

Home metadata, sitelink structured data and navigation no longer advertise the archive. Saved global/route SEO referring to retired sections is ignored at render time. The SEO editor hides retired paths and clears their saved keys when its normal save action runs, preserving valid active route settings. No AI key rotation, grading or authentication behavior is changed.

CI covers middleware status/headers, sitemap/robots, metadata fallbacks with stale D1 settings, absence of archive PDFs, and real Header/Footer/Home/SEO editor components at 320/375/1280px. Production checks verify 410/noindex and the active sitemap alongside the existing Writing/Speaking catalog and authentication checks.
