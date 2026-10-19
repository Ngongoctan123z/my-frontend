// node --experimental-vm-modules tests/grader-submissions.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createGraderHarness } from './helpers/graderHarness.mjs'
import { gradingSamples } from './fixtures/gradingSamples.mjs'

for (const sample of gradingSamples) {
  test(`${sample.name}: real POST + rubric + scoring return the correct score scale`, async () => {
    const harness = await createGraderHarness()
    harness.state.response = sample.provider
    const { response, data } = await harness.grade(sample)
    assert.equal(response.status, 200, JSON.stringify(data))
    assert.equal(data.overallBandFormatted, sample.expected)
    assert.equal(data.scoreScale, Number(sample.expected.split('/')[1]))
    assert.equal(data.assessmentStatus, 'verified')
    assert.equal(data.modelUsed, 'grading-primary')
    assert.ok(Array.isArray(data.corrections))
    assert.equal(harness.state.calls.length, 1)
    const call = harness.state.calls[0]
    assert.equal(call.options.maxRetries, 0)
    assert.equal(call.payload.response_format.type, 'json_object')
    assert.ok(call.payload.messages[1].content.includes(sample.essay))
    assert.ok(call.payload.messages[1].content.includes(sample.prompt), 'AI must receive the submitted source prompt unchanged')
    if (sample.chartExtra) assert.ok(call.payload.messages[1].content.includes(sample.chartExtra))
    assert.equal(Number(harness.sqlite.prepare("SELECT value FROM system_config WHERE key = 'TOTAL_API_REQUESTS'").get().value), 1)
    assert.equal(harness.sqlite.prepare('SELECT count FROM api_usage').get().count, 1)
  })
}

test('TOEIC full test submits email and essay concurrently on the first use', async () => {
  const harness = await createGraderHarness()
  const samples = gradingSamples.filter(sample => sample.type.startsWith('TOEIC_'))
  harness.state.handler = call => samples.find(sample => call.payload.messages[1].content.includes(sample.essay)).provider
  const results = await Promise.all(samples.map(sample => harness.grade(sample)))
  assert.deepEqual(results.map(result => result.response.status), [200, 200], JSON.stringify(results.map(result => result.data)))
  assert.deepEqual(results.map(result => result.data.overallBandFormatted), ['4/4', '5/5'])
  assert.equal(new Set(harness.state.calls.map(call => call.apiKey)).size, 2)
  assert.equal(harness.sqlite.prepare('SELECT count FROM api_usage').get().count, 2)
})

test('TOPIK full test submits all 4 questions concurrently on the first use', async () => {
  const harness = await createGraderHarness()
  const samples = gradingSamples.filter(sample => sample.type.startsWith('TOPIK_'))
  harness.state.handler = call => samples.find(sample => call.payload.messages[1].content.includes(sample.essay)).provider
  const results = await Promise.all(samples.map(sample => harness.grade(sample)))
  assert.deepEqual(results.map(result => result.response.status), [200, 200, 200, 200], JSON.stringify(results.map(result => result.data)))
  assert.deepEqual(results.map(result => result.data.overallBandFormatted), samples.map(sample => sample.expected))
  assert.equal(new Set(harness.state.calls.map(call => call.apiKey)).size, 4)
  assert.equal(harness.sqlite.prepare('SELECT count FROM api_usage').get().count, 4)
})

test('invalid model JSON is retried on the next key and counts both attempts', async () => {
  const harness = await createGraderHarness()
  const sample = gradingSamples[0]
  harness.state.handler = () => harness.state.calls.length === 1 ? '{invalid' : sample.provider
  const { response, data } = await harness.grade(sample)
  assert.equal(response.status, 200, JSON.stringify(data))
  assert.deepEqual(harness.state.calls.map(call => call.apiKey), harness.keys.slice(0, 2))
  assert.equal(Number(harness.sqlite.prepare("SELECT value FROM system_config WHERE key = 'TOTAL_API_REQUESTS'").get().value), 2)
})

test('429 on all provider keys returns Retry-After and consumes at most one ring', async () => {
  const harness = await createGraderHarness()
  harness.state.handler = () => { throw { status: 429, headers: { 'retry-after': '30' } } }
  const { response, data } = await harness.grade(gradingSamples[0])
  assert.equal(response.status, 429, JSON.stringify(data))
  assert.ok(Number(response.headers.get('retry-after')) > 0)
  assert.equal(harness.state.calls.length, 5)
  const again = await harness.grade(gradingSamples[0])
  assert.equal(again.response.status, 429)
  assert.equal(harness.state.calls.length, 5)
})

test('authentication and invalid submissions are rejected before provider calls', async () => {
  const harness = await createGraderHarness()
  harness.state.email = null
  assert.equal((await harness.grade(gradingSamples[0])).response.status, 401)
  harness.state.email = 'grader-test@example.test'
  assert.equal((await harness.grade({ ...gradingSamples[0], essay: '' })).response.status, 400)
  assert.equal((await harness.grade({ ...gradingSamples[0], type: 'INVALID' })).response.status, 400)
  assert.equal(harness.state.calls.length, 0)
})

test('concurrent submissions at the daily limit admit exactly one remaining slot', async () => {
  const harness = await createGraderHarness()
  harness.state.response = gradingSamples[0].provider
  harness.sqlite.prepare('UPDATE user SET plan = ?').run('free')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
  harness.sqlite.prepare('INSERT INTO api_usage VALUES (?, ?, ?)').run(harness.state.email, today, 6)
  const responses = await Promise.all(Array.from({ length: 4 }, () => harness.grade(gradingSamples[0])))
  assert.deepEqual(responses.map(result => result.response.status).sort(), [200, 429, 429, 429])
  assert.equal(harness.sqlite.prepare('SELECT count FROM api_usage').get().count, 7)
  assert.equal(harness.state.calls.length, 1)
})

test('TOPIK 53 accepts legacy imageDescription and validates malformed chart data', async () => {
  const harness = await createGraderHarness()
  const sample = gradingSamples.find(sample => sample.type === 'TOPIK_53')
  harness.state.response = sample.provider
  const { chartExtra, ...legacy } = sample
  const { response } = await harness.grade({ ...legacy, imageDescription: chartExtra })
  assert.equal(response.status, 200)
  assert.ok(harness.state.calls[0].payload.messages[1].content.includes(chartExtra))
  const malformed = await harness.grade({ ...legacy, chartExtra: { invalid: true } })
  assert.equal(malformed.response.status, 400)
  assert.equal(harness.state.calls.length, 1)
})
