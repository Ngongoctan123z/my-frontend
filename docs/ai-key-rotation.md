# Provider/model key rotation

Writing and Speaking share a rotation implementation, not one global rate-limit
ban. The admin key lists remain the source of credentials. The provider/model
selection used by each request is responsible for supplying compatible models;
rotation never silently replaces the saved admin configuration.

## Separate rate limits from invalid credentials

A provider 429 cools only that **provider + model + credential** combination.
Other accounts honor the same cooldown for that combination, while a Whisper
limit cannot disable Writing chat models or a different Whisper model. If every
key is limited on the first model, the request still tries the next configured
model. A first model that was already cooled down before the request also cannot
hide a healthy fallback.

Authentication failures (401, or 403 without a model-access error) cool the
credential across models on the same provider for five minutes. Explicit model
permission errors, unavailable/decommissioned models and invalid structured
output move to the next model without exhausting every credential on the same
failure. Safety failures and caller errors with `retryable: false` stop the
request immediately.

Provider error classification handles outer and nested SDK error status/code
fields. Retry timing accepts `Retry-After` seconds or HTTP dates, SDK retry delay
fields, Gemini RetryInfo and provider retry hints. Timing is bounded between one
second and 24 hours, with a one-minute default when no usable hint is supplied.
When every compatible model is genuinely cooled down, the route can return HTTP
429 with the earliest applicable retry time. Healthy models that fail for other
reasons produce `model_exhausted`, not a false rate-limit message.

Rate limits can be shared by an entire provider organization. Switching between
keys in the same organization does not increase that organization's allowance.
All configured models can still be genuinely unavailable or limited; rotation
cannot guarantee provider capacity or make an invalid credential valid.

## Shared atomic state

Each authenticated account has a persistent key cursor. With five available
keys one account visits `1, 2, 3, 4, 5, 1, ...`; new accounts receive successive
starting slots. Account identity comes from the server session. Multiple tabs
and Worker instances share state in the existing `system_config` table.

Cursor claims use atomic SQLite UPSERT statements. First-time account allocation
uses the existing D1 batch transaction. State identifiers contain hashes rather
than credential values, account emails or model names. Provider namespaces keep
unrelated provider credentials separate even if their configured strings happen
to match. Changed key lists receive a fresh ring.

Version-two health rows distinguish credential authentication cooldowns from
model-specific rate cooldowns. Old `GRADER_KEY_COOLDOWN_*` rows mixed those cases,
so they are not interpreted as credential bans after this update. No rows,
credentials, admin settings or quota records are deleted; no schema migration
or new Cloudflare binding is required.

Every model visits each eligible key at most once per request. Unsupported model
and output-schema errors skip the remaining keys for that model. Provider
attempt accounting still counts failed attempts using atomic increments. The
caller retains its overall request deadline, and storage errors fail visibly
rather than falling back silently to the first credential.

## API compatibility

Existing Groq callers can keep using:

```ts
const rotation = await createKeyRotation(keys, email, store)
await generateWithKeyRotation(rotation, models, generate, countAttempt)
```

Other providers explicitly choose their namespace:

```ts
const rotation = await createKeyRotation(keys, email, store, { provider: 'gemini' })
```

The prior fourth-argument clock function remains supported for deterministic
checks; an optional fifth argument accepts provider options in that form.
`next(excluded, model)` and `availability(excluded, model)` inspect model-specific
rate health. Omitting the model inspects credential authentication health only.
`coolDown(key, milliseconds, model)` records a rate cooldown; omitting the model
records a credential cooldown. `generateWithKeyRotation` supplies these arguments
automatically. Provider callbacks may throw an error whose code is
`AI_OUTPUT_INVALID` to skip to another model after validating structured output.

## Verification

Run with Node 24:

```sh
npm run test:api-rotation
npm run test:grader-submissions
```

Rotation tests execute the actual atomic CASE/UPSERT behavior in in-memory
SQLite. Coverage includes fair/concurrent allocation, Worker recreation,
provider/model isolation, first-model exhaustion, preserved authentication bans,
legacy health rows, retry timing, malformed output, request deadlines, bounded
attempts and safety stops. Tests use provider fixtures and do not consume live
provider quota or establish current production provider availability.
