# AI grader key rotation

The shared `/api/ai-grader` endpoint uses the admin `GROQ_API_KEY` list
(comma separated, trimmed and deduplicated), falling back to the environment
configuration when the admin setting is absent. TOPIK, TOEIC, HSK and IELTS
all use this endpoint.

Each authenticated account has a persistent cursor. With five available keys,
one account uses `1, 2, 3, 4, 5, 1, ...`. New accounts receive successive starting
slots, so the second account starts at key 2. Account identity comes from the
server session. Multiple tabs and Worker instances share the same database state.

State uses namespaced rows in the existing `system_config` table; no migration
or additional Cloudflare binding is needed. Cursor claims use atomic SQLite
UPSERT statements, and first-time account allocation uses a D1 batch transaction.
Account emails and key values are hashed for state identifiers. Changing the
admin key list creates a new ring; cooldowns remain attached to the affected key.

A rate-limited key is skipped across all accounts until its `Retry-After`
expires (60 seconds by default). Rejected credentials receive a five-minute
cooldown. Each model tries each eligible key at most once before moving to the
next model. Safety failures stop immediately. Exhausted key pools return HTTP
429 with a `Retry-After` header; failed models return HTTP 503.

Admin usage counters now count provider attempts, including failed attempts,
using atomic increments. A retry for invalid grading JSON continues from the
account's current cursor. Daily usage is also reserved atomically: simultaneous
first-time TOEIC/TOPIK full-test submissions cannot race on the same usage row,
and concurrent requests cannot exceed the account's existing daily allowance.
Rubrics, quota limits and session authentication are unchanged.

The route preserves the scale computed by the scoring code (TOPIK 51/52: 10,
53: 30, 54: 50). TOPIK 53 accepts the client's `chartExtra` description and the
legacy `imageDescription` field; both go through the existing input validation.

Run the regression suite with Node 22.13 or newer (Node 24 recommended):

```sh
npm run test:api-rotation
npm run test:grader-submissions
```

The suites use in-memory SQLite and mock provider responses. The submission
suite executes the real route, rubric, scoring functions and D1-store adapter;
external Next/Auth/Groq/Drizzle dependencies are test doubles. It covers original
sample essays for all eight TOEIC/TOPIK/HSK task types and full-test submissions.
It does not run the Next.js server or a browser, call Groq or consume live API
quota. Rotating keys does not remove quota limits shared by keys belonging to
the same provider organization.
