# Legacy URL search audit — 2026-10-19

Public search results still show four retired pages: `https://vndocs.net/tools`, `https://www.vndocs.net/en/tools`, `https://www.vndocs.net/en/tools/lock`, and `https://www.vndocs.net/en/tools/compress`. Search snapshots also retain outdated titles for `/en` and three English Writing pages on www. The search result cache must not be confused with current origin responses.

A fresh read-only Actions audit checked 42 public URLs on both hostnames. All 22 retired catalog/tool variants returned 410 with X-Robots-Tag noindex; all 10 active pages returned 200 with current Writing/Speaking titles and no obsolete navigation links. Five obsolete aliases on each hostname returned real 404s: `/favorites`, `/documents`, `/de-thi`, `/vao-10`, `/thpt`. The `/favorites` link is present in a cached old footer. These aliases are now explicitly retired with 410/noindex as well.

Cached Open Graph URLs using old exam titles/descriptions are now rejected, in addition to the existing slug rejection. Speaking now declares the apex canonical URL, matching the other active pages. Valid Writing/Speaking content remains indexable.

`scripts/audit-indexed-urls.mjs --verify` checks the final 46 URLs, including old Open Graph images, on the apex and www hosts. CI runs it after the production readiness smoke test and saves its JSON report. The manual branch audit workflow supports collecting current public responses without login or provider calls.

Google must recrawl before old search entries/snippets change. A site: query is not a complete index inventory. No Search Console removal request has been submitted; this session has no Search Console access. Retired routes remain crawlable so Google can observe the 410/noindex response, consistent with https://developers.google.com/crawling/docs/troubleshooting/http-status-codes and https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag.
