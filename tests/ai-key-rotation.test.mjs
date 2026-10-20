// Run with Node 22.13+ (Node 24 recommended):
// node --experimental-strip-types --test tests/ai-key-rotation.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'
import {
  claimValueSql, createKeyRotation, generateWithKeyRotation, normalizeApiKeys,
  KeyPoolExhaustedError, retryAfterMilliseconds, classifyProviderError, sha256Hex,
} from '../src/lib/aiKeyRotation.ts'

// SQLite executes the same atomic CASE expression used by the D1 store.
function makeStore() {
  const db = new DatabaseSync(':memory:')
  db.exec('CREATE TABLE system_config (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
  return {
    db,
    async read(key) {
      return db.prepare('SELECT value FROM system_config WHERE key = ?').get(key)?.value
    },
    async initialize(cursor, assignment, size) {
      if (await this.read(cursor) !== undefined) return
      db.exec('BEGIN')
      try {
        db.prepare(`INSERT INTO system_config (key, value) VALUES (?, '0')
          ON CONFLICT (key) DO UPDATE SET value = CASE
            WHEN EXISTS (SELECT 1 FROM system_config WHERE key = ?) THEN system_config.value
            ELSE (CAST(system_config.value AS INTEGER) + 1) % ? END`).run(assignment, cursor, size)
        db.prepare(`INSERT INTO system_config (key, value) VALUES (?,
          (SELECT (CAST(value AS INTEGER) + ? - 1) % ? FROM system_config WHERE key = ?))
          ON CONFLICT DO NOTHING`).run(cursor, size, size, assignment)
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
    async claim(key, initial, candidates) {
      return Number(db.prepare(`INSERT INTO system_config (key, value) VALUES (?, ?)
        ON CONFLICT (key) DO UPDATE SET value = ${claimValueSql(candidates)} RETURNING value`).get(key, String(initial)).value)
    },
    async cooldowns(keys) {
      return new Map(keys.map(key => [key, Number(db.prepare('SELECT value FROM system_config WHERE key = ?').get(key)?.value) || 0]))
    },
    async coolDown(key, until) {
      db.prepare(`INSERT INTO system_config (key, value) VALUES (?, ?)
        ON CONFLICT (key) DO UPDATE SET value = MAX(CAST(system_config.value AS INTEGER), ?)`).run(key, String(until), until)
    },
  }
}

const keys = ['key-1', 'key-2', 'key-3', 'key-4', 'key-5']
const account = 'first@example.test'
const collect = async (rotation, count, model) => {
  const result = []
  for (let i = 0; i < count; i++) result.push(await rotation.next(new Set(), model))
  return result
}

test('5 admin keys rotate in order across 3 cycles and survive Worker recreation', async () => {
  const store = makeStore()
  let rotation = await createKeyRotation(keys, account, store)
  assert.deepEqual(await collect(rotation, 7), [...keys, ...keys.slice(0, 2)])
  rotation = await createKeyRotation(keys, account, store)
  assert.deepEqual(await collect(rotation, 8), [...keys.slice(2), ...keys])
})

test('accounts start on successive keys, then rotate independently; identity is normalized', async () => {
  const store = makeStore()
  const rotations = []
  for (let i = 0; i < 6; i++) rotations.push(await createKeyRotation(keys, `account-${i}`, store))
  assert.deepEqual(await Promise.all(rotations.map(rotation => rotation.next())), [...keys, keys[0]])
  assert.equal(await rotations[0].next(), keys[1])
  assert.equal(await rotations[1].next(), keys[2])
  const sameAccount = await createKeyRotation(keys, ' ACCOUNT-0 ', store)
  assert.equal(await sameAccount.next(), keys[2])
})

test('25 concurrent calls by one account reserve the ring atomically across instances', async () => {
  const store = makeStore()
  const rotations = await Promise.all(Array.from({ length: 25 }, () => createKeyRotation(keys, account, store)))
  const selected = await Promise.all(rotations.map(rotation => rotation.next()))
  assert.deepEqual(selected, Array.from({ length: 5 }, () => keys).flat())
  assert.equal(await rotations[0].next(), keys[0])
  const nextAccount = await createKeyRotation(keys, 'next@example.test', store)
  assert.equal(await nextAccount.next(), keys[1]) // Only one assignment was consumed.
})

test('concurrent accounts receive balanced initial allocations', async () => {
  const store = makeStore()
  const rotations = await Promise.all(Array.from({ length: 25 }, (_, i) => createKeyRotation(keys, `account-${i}`, store)))
  const selected = await Promise.all(rotations.map(rotation => rotation.next()))
  for (const key of keys) assert.equal(selected.filter(selectedKey => selectedKey === key).length, 5)
})

test('duplicate/blank admin keys are removed and changed key lists form a new ring', async () => {
  assert.deepEqual(normalizeApiKeys(' key-1, ,key-2,key-1, key-3 '), keys.slice(0, 3))
  const store = makeStore()
  await (await createKeyRotation(keys, account, store)).next()
  const changed = await createKeyRotation(['new-1', 'new-2', 'new-1', ' '], account, store)
  assert.deepEqual(await collect(changed, 4), ['new-1', 'new-2', 'new-1', 'new-2'])
  await assert.rejects(createKeyRotation([], account, store), /GROQ_API_KEY_MISSING/)
  await assert.rejects(createKeyRotation(keys, '', store), /AI_ACCOUNT_MISSING/)
})

test('429 rotates keys and shares Retry-After only for the affected model across accounts', async () => {
  const store = makeStore()
  let now = 100_000
  const rotation = await createKeyRotation(keys, account, store, () => now)
  const calls = []
  const attempts = []
  const result = await generateWithKeyRotation(rotation, ['model'], async key => {
    calls.push(key)
    if (key === keys[0]) throw { status: 429, headers: new Headers({ 'retry-after': '120' }) }
    return 'graded'
  }, async key => { attempts.push(key) })
  assert.equal(result.result, 'graded')
  assert.deepEqual(calls, keys.slice(0, 2))
  assert.deepEqual(attempts, calls) // Failed calls count too.
  const other = await createKeyRotation(keys, 'other@example.test', store, () => now)
  assert.ok(!(await collect(other, 8, 'model')).includes(keys[0]))
  now += 121_000
  assert.ok((await collect(other, 5, 'model')).includes(keys[0]))
})

test('all rate-limited keys stop with retry timing; no unbounded retry or extra cursor slot', async () => {
  const store = makeStore()
  const rotation = await createKeyRotation(keys, account, store, () => 100_000)
  let calls = 0
  await assert.rejects(generateWithKeyRotation(rotation, ['first', 'second'], async () => {
    calls++
    throw { status: 429, headers: { 'retry-after': '30' } }
  }), error => error instanceof KeyPoolExhaustedError && error.retryAfterSeconds === 30)
  assert.equal(calls, keys.length * 2)
  await assert.rejects(rotation.next(new Set(), 'first'), KeyPoolExhaustedError)
  await assert.rejects(rotation.next(new Set(), 'second'), KeyPoolExhaustedError)
  assert.ok(keys.includes(await rotation.next(new Set(), 'unrelated-writing-model')))
})

test('401 and 403 keys are skipped across models and future Worker instances', async () => {
  const store = makeStore()
  const rotation = await createKeyRotation(keys, account, store)
  const calls = []
  const result = await generateWithKeyRotation(rotation, ['first', 'second'], async key => {
    calls.push(key)
    if (key === keys[0]) throw { status: 401 }
    if (key === keys[1]) throw { status: 403 }
    return 'ok'
  })
  assert.equal(result.usedKey, keys[2])
  assert.deepEqual(calls, keys.slice(0, 3))
  const recreated = await createKeyRotation(keys, account, store)
  assert.deepEqual(await collect(recreated, 4), [keys[3], keys[4], keys[2], keys[3]])
})

test('all invalid keys produce an authentication error after one pass', async () => {
  const rotation = await createKeyRotation(keys, account, makeStore())
  let calls = 0
  await assert.rejects(generateWithKeyRotation(rotation, ['first', 'second'], async () => {
    calls++
    throw { status: 401 }
  }), /API_KEY_INVALID/)
  assert.equal(calls, keys.length)
})

test('transient errors visit all keys before falling back to the next model', async () => {
  const rotation = await createKeyRotation(keys, account, makeStore())
  const calls = []
  await generateWithKeyRotation(rotation, ['first', 'second'], async (key, model) => {
    calls.push([key, model])
    if (model === 'first') throw { status: 500 }
    return 'ok'
  })
  assert.deepEqual(calls, [...keys.map(key => [key, 'first']), [keys[0], 'second']])
})

test('concurrent fallback requests do not retry a key on the same model', async () => {
  const store = makeStore()
  const rotations = await Promise.all(Array.from({ length: 3 }, () => createKeyRotation(keys, account, store)))
  const calls = rotations.map(() => [])
  await Promise.all(rotations.map((rotation, index) => assert.rejects(
    generateWithKeyRotation(rotation, ['first', 'second'], async (key, model) => {
      calls[index].push([key, model])
      await Promise.resolve()
      throw { status: 500 }
    }), /model_exhausted/)))
  for (const requestCalls of calls) {
    assert.equal(requestCalls.length, keys.length * 2)
    for (const model of ['first', 'second']) {
      assert.equal(new Set(requestCalls.filter(call => call[1] === model).map(call => call[0])).size, keys.length)
    }
  }
})

test('missing/decommissioned models move to the next model without burning every key', async () => {
  const rotation = await createKeyRotation(keys, account, makeStore())
  const calls = []
  await generateWithKeyRotation(rotation, ['old', 'current'], async (key, model) => {
    calls.push([key, model])
    if (model === 'old') throw { status: 400, message: 'model_decommissioned' }
    return 'ok'
  })
  assert.deepEqual(calls, [[keys[0], 'old'], [keys[1], 'current']])
})

test('safety failures stop immediately and storage failures never fall back to key 1', async () => {
  const store = makeStore()
  const rotation = await createKeyRotation(keys, account, store)
  let calls = 0
  await assert.rejects(generateWithKeyRotation(rotation, ['first', 'second'], async () => {
    calls++
    throw { message: 'content blocked by safety policy' }
  }), error => error.message.includes('safety'))
  assert.equal(calls, 1)
  await assert.rejects(createKeyRotation(keys, account, { ...store, initialize: async () => { throw new Error('DB down') } }), /DB down/)
})

test('database identifiers contain hashes instead of API keys or email addresses', async () => {
  const store = makeStore()
  const rotation = await createKeyRotation(keys, account, store)
  await rotation.coolDown(keys[0], 1000)
  await rotation.next()
  const names = store.db.prepare('SELECT key FROM system_config').all().map(row => row.key)
  assert.ok(names.every(name => !name.includes('@') && !keys.some(key => name.includes(key))))
})

test('cooldowns never shorten; Retry-After accepts seconds, HTTP dates and bad values', async () => {
  const store = makeStore()
  await store.coolDown('cooldown', 200)
  await store.coolDown('cooldown', 100)
  assert.equal(Number(await store.read('cooldown')), 200)
  assert.equal(retryAfterMilliseconds({ headers: { 'retry-after': '2' } }), 2000)
  const now = Date.parse('2026-10-18T00:00:00Z')
  assert.equal(retryAfterMilliseconds({ headers: { 'retry-after': 'Sun, 18 Oct 2026 00:01:00 GMT' } }, now), 60_000)
  assert.equal(retryAfterMilliseconds({ headers: { 'retry-after': 'bad' } }), 60_000)
  assert.equal(retryAfterMilliseconds({ headers: { 'retry-after': '999999999' } }), 86_400_000)
  assert.throws(() => claimValueSql([0, NaN]), /Invalid/)
})



test('all keys rate-limited on one model still try a healthy configured fallback model', async () => {
  const store = makeStore(), rotation = await createKeyRotation(keys, account, store, () => 100_000)
  const calls = []
  const result = await generateWithKeyRotation(rotation, ['limited', 'healthy'], async (key, model) => {
    calls.push([key, model])
    if (model === 'limited') throw { status: 429, headers: { 'retry-after': '30' } }
    return 'valid writing feedback'
  })
  assert.equal(result.model, 'healthy')
  assert.equal(result.result, 'valid writing feedback')
  assert.deepEqual(calls, [...keys.map(key => [key, 'limited']), [keys[0], 'healthy']])
  const recreated = await createKeyRotation(keys, 'new-account', store, () => 100_000)
  const next = []
  await generateWithKeyRotation(recreated, ['limited', 'healthy'], async (key, model) => { next.push([key, model]); return 'ok' })
  assert.equal(next.length, 1, 'A previously cooled first model does not abort fallback before a provider call')
  assert.equal(next[0][1], 'healthy')
})

test('Speaking transcription rate limits never disable Writing model keys, or vice versa', async () => {
  const store = makeStore(), now = () => 100_000
  const speaking = await createKeyRotation(keys, account, store, now)
  await assert.rejects(generateWithKeyRotation(speaking, ['whisper-large-v3-turbo'], async () => {
    throw { status: 429, headers: { 'retry-after': '45' } }
  }), KeyPoolExhaustedError)
  const writing = await createKeyRotation(keys, account, store, now)
  assert.equal((await generateWithKeyRotation(writing, ['writing-model'], async () => 'writing works')).result, 'writing works')
  await assert.rejects(generateWithKeyRotation(writing, ['writing-model'], async () => {
    throw { status: 429, headers: { 'retry-after': '90' } }
  }), KeyPoolExhaustedError)
  assert.equal((await generateWithKeyRotation(speaking, ['whisper-large-v3'], async () => 'speech works')).result, 'speech works')
  const rawKeys = store.db.prepare('SELECT key FROM system_config').all().map(row => row.key)
  assert.ok(rawKeys.every(key => !key.includes('whisper') && !key.includes('writing-model')))
})

test('provider namespaces isolate rate/auth health even when configured credential strings coincide', async () => {
  const store = makeStore(), now = () => 100_000
  const groq = await createKeyRotation(['shared-token'], account, store, now, { provider: 'groq' })
  await assert.rejects(generateWithKeyRotation(groq, ['model'], async () => { throw { status: 401 } }), /API_KEY_INVALID/)
  const gemini = await createKeyRotation(['shared-token'], account, store, now, { provider: 'gemini' })
  assert.equal((await generateWithKeyRotation(gemini, ['model'], async () => 'ok')).result, 'ok')
  const optionsAsFourth = await createKeyRotation(['shared-token'], account, store, { provider: 'gemini' })
  assert.equal((await generateWithKeyRotation(optionsAsFourth, ['other-model'], async () => 'compatible')).result, 'compatible')
})

test('invalid credentials remain blocked for unrelated models on the same provider', async () => {
  const store = makeStore(), now = () => 100_000
  const first = await createKeyRotation(['bad-key'], account, store, now)
  await assert.rejects(generateWithKeyRotation(first, ['speech'], async () => { throw { status: 401 } }), /API_KEY_INVALID/)
  const second = await createKeyRotation(['bad-key'], 'other-account', store, now)
  let calls = 0
  await assert.rejects(generateWithKeyRotation(second, ['writing'], async () => { calls++; return 'wrong' }), /API_KEY_INVALID/)
  assert.equal(calls, 0)
})

test('legacy ambiguous global rate rows do not keep unrelated models disabled after upgrade', async () => {
  const store = makeStore(), now = () => 100_000
  await store.coolDown('GRADER_KEY_COOLDOWN_' + await sha256Hex('only-key'), 999_999)
  const rotation = await createKeyRotation(['only-key'], account, store, now)
  assert.equal((await generateWithKeyRotation(rotation, ['writing'], async () => 'healthy')).result, 'healthy')
})

test('JSON schema validation failures skip that model without wasting every credential', async () => {
  const rotation = await createKeyRotation(keys, account, makeStore())
  const calls = []
  const result = await generateWithKeyRotation(rotation, ['bad-json', 'valid-json'], async (key, model) => {
    calls.push([key, model])
    if (model === 'bad-json') throw Object.assign(new Error('Invalid grading output'), { code: 'AI_OUTPUT_INVALID' })
    return { score: 6, feedback: 'Valid feedback' }
  })
  assert.deepEqual(calls, [[keys[0], 'bad-json'], [keys[1], 'valid-json']])
  assert.equal(result.result.score, 6)
})

test('retryable:false deadline failures stop the complete key/model traversal immediately', async () => {
  const rotation = await createKeyRotation(keys, account, makeStore())
  let calls = 0
  await assert.rejects(generateWithKeyRotation(rotation, ['first', 'second'], async () => {
    calls++; throw Object.assign(new Error('Request deadline'), { retryable: false })
  }), /Request deadline/)
  assert.equal(calls, 1)
})

test('retry timing chooses the earliest genuinely available provider/model pair', async () => {
  const rotation = await createKeyRotation(['one', 'two'], account, makeStore(), () => 100_000)
  await assert.rejects(generateWithKeyRotation(rotation, ['slow', 'fast'], async (key, model) => {
    throw { status: 429, headers: { 'retry-after': model === 'slow' ? '120' : key === 'one' ? '5' : '10' } }
  }), error => error instanceof KeyPoolExhaustedError && error.retryAfterSeconds === 5)
})

test('nested SDK model/rate errors and RetryInfo are handled without misclassifying credential health', () => {
  assert.equal(classifyProviderError({ error: { code: 429, message: 'RESOURCE_EXHAUSTED' } }), 'rate')
  assert.equal(classifyProviderError({ status: 403, error: { code: 'model_not_found' } }), 'model')
  assert.equal(classifyProviderError({ status: 401, error: { message: 'Invalid API key' } }), 'auth')
  assert.equal(classifyProviderError({ code: 'AI_OUTPUT_INVALID' }), 'model')
  assert.equal(classifyProviderError({ status: 403, error: { code: 'model_permission_denied' } }), 'model')
  assert.equal(classifyProviderError({ status: 400, error: { code: 'json_validate_failed' } }), 'model')
  assert.equal(retryAfterMilliseconds({ response: { headers: { 'Retry-After': '2.5' } } }), 2500)
  assert.equal(retryAfterMilliseconds({ error: { details: [{ retryDelay: '12.5s' }] } }), 12_500)
  assert.equal(retryAfterMilliseconds({ error: { details: [{ retryDelay: { seconds: '3', nanos: 500_000_000 } }] } }), 3500)
  assert.equal(retryAfterMilliseconds({ error: { message: 'Please try again in 1.2s.' } }), 1200)
})
