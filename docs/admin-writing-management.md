# Unified Writing management

The single Writing entry is `/quan-ly-he-thong-123?tab=writing`. Four exam cards retain the familiar IELTS, TOEIC, TOPIK and HSK layout. TOEIC photo/email banks and the category-scoped question editor are opened within that screen. HSK5/6 are separate levels within the HSK card. `/quan-ly-de-thi-123` redirects into the same authenticated screen, preserving set/picture searches; old `tab=toeic-photos`, `toeic-emails`, `topik-hsk` and `prompts` links remain supported.

The protected `writing_overview` endpoint counts actual parent-child references. Different numbers of available questions are not broken relations: shared question IDs and standalone questions are valid. Only absent, incorrectly typed or malformed required components flag a stored set. HSK levels are never paired together. Counts include valid hidden sets as complete; hidden totals are displayed separately.

IELTS still uses the existing learner's automatic pairing. The overview labels this explicitly, instead of claiming saved pairs. `ielts_preview_sets` provides up to30 examples using real question IDs without the signed-in admin's practice-history filter. Examples are labelled as previews, not stored exam sets. Both new endpoints only read D1 and retain the existing admin authorization; they never seed, repair, rebalance or delete questions.

The question editors retain the existing add/delete workflows, forms and callbacks. Child loads refresh the overview after any existing bank initialization; failures retain the last known counts and display a retryable error.
