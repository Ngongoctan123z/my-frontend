# 2026 exam PDF archive

The archive is managed at `/quan-tri-he-thong-123` → **Danh sách đề** → **Đề 2026**. The existing admin login and the historical upload/edit/delete workflow remain in place. Imported archive entries expose their PDF, public exam page, provenance and SEO fields; they are maintained through the source manifest rather than the legacy backend's edit/delete endpoints.

`resources/exams-2026/sources.json` lists the source candidates. The collection workflow downloads original PDFs or packages published question scans without OCR, rewriting questions or generating illustrations. Only successfully downloaded, parseable PDFs are published. Each metadata record identifies the source, original assets, page count, file size and SHA-256. Answer-only sources and inaccessible files are not substituted for question papers.

The initial release contains 109 PDFs: 98 Vào 10 papers representing 33 provinces and 11 THPT subjects. Cao Bằng and seven THPT subjects still lack imported files. Some province collections contain only selected subjects or specialized-school papers; coverage remains visible in the admin.

Actual PDFs live under `public/exam-papers/2026/`. `src/data/exams2026.json` is the generated catalog. `resources/exams-2026/collection-report.json` records collection failures. Counts and missing provinces/THPT subjects are calculated from downloaded records in the admin; coverage of one province does not imply every subject is present. This is a growing collection, not a claim that all provinces, subjects or question codes are complete.

Public discovery uses `/tai-lieu?year=2026`; every PDF has a canonical `/exams/...` page with a source citation, SEO title, description and structured data. The PDF viewer uses the same-origin PDF.js worker prepared during the build. Archived routes and downloads work independently of the historical backend. Legacy search failures preserve available archive results; unavailable historical-only searches still show an error.

Validation: archive service tests cover filters, canonical routes, downloads, source metadata, legacy pagination and outages. CI additionally verifies every PDF's bytes/hash and checks the existing admin login, archive pagination, PDF links, SEO disclosure and 320/375/1280px layouts. Release smoke tests fetch a real deployed PDF and its server-rendered SEO page.
