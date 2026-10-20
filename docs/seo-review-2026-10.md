# VNDocs SEO review — 20 October 2026

This review applies current Google Search Central guidance and the Next.js 15 App Router documentation to VNDocs. The site is a Writing/Speaking practice product; it is not an official exam authority. AI feedback and scores are practice estimates. Improvements should help learners understand, use and discover the product, without promising rankings or an official exam result.

## Research and decisions

1. **Consistent canonical URLs.** Public metadata, Open Graph, internal links and the sitemap should agree on the HTTPS `vndocs.net` URL. Each translated page keeps its own-language self canonical. Query-string variants should identify the corresponding clean page. Google describes redirects and canonical annotations as strong signals, but can still choose a different canonical. Source: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls

2. **Reciprocal language variants.** Existing Vietnamese and English versions should list themselves and each other with absolute URLs. Only advertise translations that exist. Vietnamese-only Speaking must not claim a nonexistent English alternate. Language should follow the URL rather than an IP redirect. Source: https://developers.google.com/search/docs/specialty/international/localized-versions

3. **Descriptive titles and a clear main heading.** Use specific task descriptions and a concise VNDocs suffix. Keep the main heading, metadata and visible purpose aligned. Keyword repetition, arbitrary title-length targets and boilerplate claims do not improve the learner experience. Google may rewrite title links. Source: https://developers.google.com/search/docs/appearance/title-link

4. **Useful original copy and accurate sourcing.** Explain the real task formats, review workflow, score limitations and next practice step. Use official exam sources for task facts. Do not fabricate authors, credentials, partnerships, user statistics, processing-time guarantees or claims that data is never sent to third-party AI providers. VNDocs authorship and AI assistance should be described honestly where relevant. Source: https://developers.google.com/search/docs/fundamentals/creating-helpful-content

5. **Crawlable internal links.** Connect home, Writing hub, individual exams and Speaking using descriptive anchor links. Important pages should not require a picker, button event or authenticated tool session to be discovered. Source: https://developers.google.com/search/docs/crawling-indexing/links-crawlable

6. **Schema must describe visible facts.** WebApplication, WebSite, Organization and breadcrumbs should match the page. Unsupported zero-price offers and apparent exam-board affiliations should be removed, rather than padding schema with invented reviews or ratings. Preserve shared FAQ text when visible FAQs are also represented in schema. Source: https://developers.google.com/search/docs/appearance/structured-data/sd-policies

7. **FAQ rich results are no longer a target.** Google's documentation changelog records that FAQ rich results stopped appearing on 7 May 2026 and their documentation was removed on 15 June. Useful visible FAQs can remain, but FAQPage markup is not a promise of a Google FAQ result. The same changelog states that `llms.txt` is not required and does not improve Google Search visibility or rankings. Sources: https://developers.google.com/search/updates and https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

8. **Safe server-visible JSON-LD.** Next.js recommends native script elements in page/layout output and escaping `<` in serialized payloads. Rendered tests should parse the real output and try hostile saved SEO text, rather than merely checking that a source file contains a script string. Source: https://nextjs.org/docs/15/app/guides/json-ld

9. **Factual sitemap and indexing controls.** Include public canonical pages intended for Search. Exclude private/noindex/retired routes. Google ignores sitemap `priority` and `changefreq`; `lastmod` is useful only when it reflects a real significant update. Keep noindex pages crawlable so the directive can be read. A retired 410 response should stay distinct from a live learning page. Sources: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap and https://developers.google.com/search/docs/crawling-indexing/block-indexing

10. **Measure performance before making claims.** Keep useful initial content light, reserve dimensions for media/ads and avoid blocking optional scripts. Google's experience targets are LCP within 2.5 seconds, INP below 200 milliseconds and CLS below 0.1. This work does not establish field Core Web Vitals, PageSpeed scores, traffic uplift or ranking gains. Those require actual measurement over the relevant pages and devices. Source: https://developers.google.com/search/docs/appearance/core-web-vitals

## Verification

`node --experimental-vm-modules tests/build-seo.test.mjs` exercises real metadata functions against controlled D1 scenarios. `node tests/seo-rendering.test.mjs` bundles and renders real public page shells with React, parses JSON-LD, compares visible FAQ answers, checks the primary heading and verifies crawlable exam links. Interactive tools and external services are fixtures; the tests do not simulate the learner's physical microphone or make paid AI calls. Rendering tests need installed dependencies but do not need a browser or `.next` output.

Production build and browser checks run through the existing GitHub Actions workflow. Cloudflare Workers Builds remains the deployment path for `main`. Deployed URL checks are separate evidence from a successful local build. Search Console indexing, Google-selected canonicals, impressions and clicks require access to the site's verified property; this review does not claim to have inspected those reports. Google recrawling and search appearance updates can take time, and no technical change guarantees placement or traffic.
