# SEO follow-up

The existing bilingual titles, descriptions, self canonicals and reciprocal language alternates remain in place. Retired sections still return 410 and stay outside the sitemap. Admin SEO customizations and favicon declarations are preserved.

Changes:
- Writing and Speaking structured data uses native server-rendered script elements, with less-than characters escaped. Crawlers can read it without waiting for client hydration. Writing application schema declares the page language.
- Both homepages share WebSite and Organization identity data. The English root Open Graph URL points to /en.
- Speaking includes a server-rendered practice guide, realistic AI score limitations and links to related Writing practice.
- Login, profile and temporary shared content explicitly use noindex metadata. Public noindex URLs remain crawlable in robots.txt so search engines can observe that directive. Robots exclusions are not access controls.
- Malformed saved route metadata cannot replace a title, description or image URL with non-text values.

Validation: run `node --experimental-vm-modules tests/build-seo.test.mjs`. Includes existing D1 fallback/customization checks plus regressions for malformed saved values, English Open Graph URL, private pages, robots crawling and server-rendered schema declarations.

The workspace could not clone or install packages because its configured network proxy was unavailable. Source files were retrieved at a fixed GitHub commit using the connected GitHub API. A full Next.js build, rendered browser checks and deployed URL audit still need a functioning build environment; the local checks do not establish deployment success or Google indexing.
