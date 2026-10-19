# Vietnamese and English search pages

The public Vietnamese URLs must return 200 from every country. The former IP-based redirect to /en could send crawlers outside Vietnam to English pages. Language now follows the URL and the middleware overwrites the internal locale header; root HTML and Content-Language agree.

Original copy for 13 active pages is maintained in src/lib/pageSeo.ts and shared with the SEO admin editor. It names each exam and task accurately; AI scores are practice estimates. Valid admin customizations remain supported. Vietnamese global settings never replace English copy.

Each translated page has a self canonical, reciprocal vi/en alternates and Vietnamese x-default, also in sitemap.xml. Speaking currently has Vietnamese UI only, so no nonexistent /en/speaking alternate is advertised. Retired school exams, documents and tools remain 410/noindex and excluded from the sitemap.

Research references (19 October 2026):
- https://study4.com/courses/25/ielts-intensive-writing/ — specific tasks and feedback criteria.
- https://www.dolenglish.vn/blog/website-cham-ielts-writing-mien-phi-tot-nhat — learner questions and clear writing terminology.
- https://tryielts.com/vi/landing/ielts-speaking.html — recording, replay and practice feedback.
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites — stable language URLs; avoid automatic location redirects.
- https://developers.google.com/search/docs/specialty/international/localized-versions — self-inclusive reciprocal hreflang.

Validation: middleware tests include foreign countries, Googlebot and a spoofed locale header; metadata tests preserve D1 overrides and favicon declarations. The live audit verifies every core page on both hostnames, including title, description, HTML language, Content-Language, canonical, Open Graph locale and alternate URLs. Search results update when Google recrawls; metadata cannot guarantee ranking or instant replacement of cached snippets.

Live validation found three pre-existing D1 overrides (Vietnamese IELTS/TOEIC/TOPIK). Exact old title/description values are upgraded independently at read time and in the admin editor; unrelated custom fields remain intact. This does not write to D1 during public requests. Saving in admin persists the upgraded values.
