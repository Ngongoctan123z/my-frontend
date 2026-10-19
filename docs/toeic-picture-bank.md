# TOEIC Writing picture practice

Open `/quan-ly-he-thong-123?tab=toeic-photos` to preview the bank. Each set shows all five photographs, two required words/phrases, an original example sentence, the grading reference caption, photo source and license. There are 50 added five-picture practice sets: 250 distinct word/example tasks using 50 visually reviewed Unsplash photos. A photo appears in five different tasks. These are VNDocs original practice tasks following the TOEIC picture-sentence format, not verified ETS past examination papers. The admin UI links to ETS's official sample PDF.

`src/data/toeicPhotoBank.ts` contains the reviewed captions, original examples and source/license metadata. `src/data/toeicPhotoCandidates.json` and the photo-audit workflow document the exact full-aspect-ratio photo URLs reviewed. Photo files are loaded from Unsplash's image CDN, so availability still depends on that service. No random image search or generated placeholder is used.

The first admin bank request, public picture request or linked-set request inserts the 50 sets into D1. The transaction uses six statements and <=41 bound parameters per statement. A version marker makes seeding idempotent and prevents edited/deleted content from being overwritten or resurrected. Existing questions remain unchanged. Examples are omitted from public practice responses.

`/quan-ly-de-thi-123` links one parent Writing exam ID to four persistent prompt IDs: one five-picture group, separate emails for questions 6 and 7, and the essay for question 8. This replaces positional matching. The new picture groups are available in the selector for any full exam. They are not automatically combined with arbitrary unrelated emails and essays. Unpublished, incomplete or broken sets are excluded from full practice. Single-picture practice retains a separate draft from full practice.

Native TOEIC picture marks are 0–3 each (0–15 total). The five questions allow eight minutes in the official format. Example sentences are possible answers, not exclusive answers. Assessment uses the checked reference caption, both required words and grammar. The current text grading provider does not inspect image pixels.

Validation: SQLite tests cover 50 sets/250 tasks, immutable IDs, seeding and public example removal. Chromium tests check photo loading, admin previews/search, failed-save retention, linked IDs, mobile layouts and preserved full-test drafts. Live production smoke initializes/checks the actual D1 bank without calling paid AI providers.
