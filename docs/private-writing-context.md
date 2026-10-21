# Learner prompts and private grading reference data

Shared exam pages in both languages pass an explicit learner projection to the
client component. Creator IDs, image descriptions, chart reference data and
other internal fields are not serialized into its RSC props. Structured HSK and
TOEIC tasks render their actual instructions, pictures and required words rather
than displaying the original JSON object. Legacy `Context:` sections are removed
from learner text and old history previews.

Public Writing APIs return the same learner projection. TOEIC reference captions
and model sentences remain private; TOPIK chart data and HSK picture descriptions
are excluded. Grading resolves the original database prompt on the server using
the selected prompt ID or its public content and image. HSK full submissions send
their prompt ID because their composed grading text differs from the question
JSON. Shared links store the canonical reference on the server and submissions
continue to use that stored exam and the assigning account's existing allowance.

The 150-set seed is generated as `app/api/ai-grader/writing-seed.generated.ts` and
imported only by the server. The former public JSON asset is deleted during data
preparation and must return 404 after deployment. D1's stored question rows and
their private reference data are preserved. Administrative question editing
continues to use authenticated endpoints.

Tests check learner projections, real shared-page client props in both languages,
legacy histories, API response privacy, and that server grading still receives a
stored reference caption. Shared learner browser tests include private sentinel
data and must never display it. The built-Worker smoke check covers the removed
seed URL in addition to the existing route and authentication checks.
