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
    assert.equal(data.assessmentStatus,sample.type.startsWith('TOEIC')?'practice_estimate':'verified')
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

test('invalid model JSON switches to the next configured model and counts both attempts', async () => {
  const harness = await createGraderHarness()
  const sample = gradingSamples[0]
  harness.state.handler = () => harness.state.calls.length === 1 ? '{invalid' : sample.provider
  const { response, data } = await harness.grade(sample)
  assert.equal(response.status, 200, JSON.stringify(data))
  assert.deepEqual(harness.state.calls.map(call => call.apiKey), harness.keys.slice(0, 2))
  assert.deepEqual(harness.state.calls.map(call => call.payload.model), ['grading-primary', 'grading-fallback'])
  assert.equal(data.modelUsed, 'grading-fallback')
  assert.equal(Number(harness.sqlite.prepare("SELECT value FROM system_config WHERE key = 'TOTAL_API_REQUESTS'").get().value), 2)
})

test('429 on all configured models returns Retry-After and consumes one bounded ring per model', async () => {
  const harness = await createGraderHarness()
  harness.state.handler = () => { throw { status: 429, headers: { 'retry-after': '30' } } }
  const { response, data } = await harness.grade(gradingSamples[0])
  assert.equal(response.status, 429, JSON.stringify(data))
  assert.ok(Number(response.headers.get('retry-after')) > 0)
  assert.equal(harness.state.calls.length, 10)
  const again = await harness.grade(gradingSamples[0])
  assert.equal(again.response.status, 429)
  assert.equal(harness.state.calls.length, 10)
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

test('TOEIC pictures grade the exact five original sentences and sum task marks', async () => {
  const h=await createGraderHarness(), data=await h.loadModule('src/data/toeicWriting.ts')
  const prompt=JSON.stringify(data.TOEIC_PICTURE_SETS[0]), answers=[
    'The people are sitting around a table.', 'There are chairs inside the cafe.', 'The books is on shelves.', 'This is unrelated.', 'The laptop is open.',
  ].map((answer,index)=>({id:index+1,answer})), essay=JSON.stringify(answers)
  h.state.response={pictureTasks:[3,2,1,0,3].map((score,index)=>({id:index+1,score,feedback:'Evidence-based feedback for the actual sentence.',correctedSentence:'Suggested correction only.'})),overallBand:999,detailedFeedback:'Five sentences checked.'}
  const r=await h.grade({type:'TOEIC_PICTURE',prompt,essay,feedbackLang:'English'})
  assert.equal(r.response.status,200,JSON.stringify(r.data));assert.equal(r.data.overallBandFormatted,'9/15');assert.equal(r.data.assessmentStatus,'reference_based')
  assert.deepEqual(r.data.pictureTasks.map(t=>t.answer),answers.map(a=>a.answer))
  assert.deepEqual(r.data.pictureTasks.map(t=>t.score),[3,2,1,0,3])
  assert.ok(h.state.calls[0].payload.messages[1].content.includes(prompt));assert.ok(h.state.calls[0].payload.messages[1].content.includes(essay))
  assert.ok(h.state.calls[0].payload.messages[0].content.includes('Inflections'))
  assert.equal(h.sqlite.prepare('SELECT count FROM api_usage').get().count,1)
})
test('TOEIC pictures reject missing/malformed answers before quota and reject invented task scores', async () => {
  const h=await createGraderHarness(), data=await h.loadModule('src/data/toeicWriting.ts'), prompt=JSON.stringify(data.TOEIC_PICTURE_SETS[0])
  const answers=Array.from({length:5},(_,i)=>({id:i+1,answer:'One sentence.'}))
  for(const essay of ['not json',JSON.stringify(answers.slice(0,4)),JSON.stringify(answers.map((r,i)=>({...r,id:i===0?5:r.id}))),JSON.stringify(answers.map((r,i)=>({...r,answer:i===0?'':r.answer})))])assert.equal((await h.grade({type:'TOEIC_PICTURE',prompt,essay})).response.status,400)
  assert.equal(h.state.calls.length,0);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n,0)
  h.state.response={pictureTasks:answers.map(r=>({...r,score:4,feedback:'Invalid high score.'}))}
  assert.equal((await h.grade({type:'TOEIC_PICTURE',prompt,essay:JSON.stringify(answers)})).response.status,503)
  assert.equal(h.state.calls.length,2)
})
test('TOEIC complete writing has five pictures, two distinct emails and one essay, without invented 200 conversion', async () => {
  const h=await createGraderHarness(), data=await h.loadModule('src/data/toeicWriting.ts'), scores=await h.loadModule('src/lib/examScores.ts')
  const samples=gradingSamples.filter(s=>s.type.startsWith('TOEIC_'))
  h.state.handler=call=>call.payload.messages[1].content.includes('Five sentences')?{pictureTasks:Array.from({length:5},(_,i)=>({id:i+1,score:3,feedback:'Correct sentence for this picture.'}))}:call.payload.messages[1].content.includes(samples[1].essay)?samples[1].provider:samples[0].provider
  const sections=[{type:'TOEIC_PICTURE',prompt:JSON.stringify(data.TOEIC_PICTURE_SETS[0]),essay:JSON.stringify(Array.from({length:5},(_,i)=>({id:i+1,answer:'Five sentences fixture.'})))},samples[0],{...samples[0],prompt:'A second, different email request.'},samples[1]]
  const results=[]
  for(const section of sections){const r=await h.grade(section);assert.equal(r.response.status,200,JSON.stringify(r.data));results.push(r.data)}
  const total=scores.toeicWritingRawScore(results)
  assert.equal(total.scoreScale,28);assert.equal(total.overallBand,28);assert.equal(total.overallBandFormatted,'28/28')
  assert.equal(h.state.calls.length,4);assert.equal(new Set(h.state.calls.map(c=>c.apiKey)).size,4)
})

test('Complete TOEIC totals reject missing, duplicate-scale and invalid task marks',async()=>{
 const h=await createGraderHarness(),scores=await h.loadModule('src/lib/examScores.ts')
 const valid=[15,4,4,5].map(scoreScale=>({scoreScale,overallBand:0}))
 assert.equal(scores.toeicWritingRawScore(valid).overallBand,0)
 for(const rows of [valid.slice(1),[...valid,{scoreScale:4,overallBand:0}],valid.map((row,i)=>i===0?{scoreScale:4,overallBand:0}:row),valid.map((row,i)=>i===1?{...row,overallBand:4.5}:row),valid.map((row,i)=>i===1?{...row,overallBand:5}:row)])assert.throws(()=>scores.toeicWritingRawScore(rows))
})



test('malformed and invalid-schema outputs never consume daily grading quota or leak provider details', async () => {
  for (const output of ['{invalid-provider-secret', { criteria: {}, corrections: [] }]) {
    const h = await createGraderHarness()
    h.state.response = output
    const { response, data } = await h.grade(gradingSamples[0])
    assert.equal(response.status, 503, JSON.stringify(data))
    assert.equal(data.code, 'AI_OUTPUT_INVALID')
    assert.equal(data.retryable, true)
    assert.equal(response.headers.get('content-type').includes('application/json'), true)
    assert.equal(h.state.calls.length, 2, 'Each invalid model is attempted once, without repeatedly calling the first model')
    assert.equal(h.sqlite.prepare('SELECT count FROM api_usage').get().count, 0)
    assert.equal(JSON.stringify(data).includes('provider-secret'), false)
  }
})

test('configured ACTIVE models participate in grading fallback after a GRADING model fails', async () => {
  const h = await createGraderHarness()
  h.sqlite.prepare('UPDATE system_config SET value=? WHERE key=?').run('grading-primary', 'GRADING_GROQ_MODEL')
  h.sqlite.prepare('INSERT INTO system_config VALUES (?, ?)').run('ACTIVE_GROQ_MODEL', 'admin-fallback,grading-primary')
  h.state.handler = call => call.payload.model === 'grading-primary' ? '{invalid' : gradingSamples[0].provider
  const result = await h.grade(gradingSamples[0])
  assert.equal(result.response.status, 200, JSON.stringify(result.data))
  assert.equal(result.data.modelUsed, 'admin-fallback')
  assert.deepEqual(h.state.calls.map(call => call.payload.model), ['grading-primary', 'admin-fallback'])
  assert.equal(h.sqlite.prepare('SELECT count FROM api_usage').get().count, 1)
})

test('truncated output falls through to another model without accepting an incomplete grade', async () => {
  const h = await createGraderHarness()
  h.state.handler = () => {
    h.state.finishReason = h.state.calls.length === 1 ? 'length' : 'stop'
    return gradingSamples[0].provider
  }
  const result = await h.grade(gradingSamples[0])
  assert.equal(result.response.status, 200, JSON.stringify(result.data))
  assert.equal(result.data.modelUsed, 'grading-fallback')
  assert.equal(h.state.calls.length, 2)
})

test('concurrent success and provider failure retain exactly the successful daily reservation', async () => {
  const h = await createGraderHarness()
  const sample = gradingSamples[0], failedEssay = sample.essay + ' unique failed attempt'
  h.state.handler = call => call.payload.messages[1].content.includes(failedEssay) ? '{invalid' : sample.provider
  const results = await Promise.all([h.grade(sample), h.grade({ ...sample, essay: failedEssay })])
  assert.deepEqual(results.map(result => result.response.status).sort(), [200, 503])
  assert.equal(h.sqlite.prepare('SELECT count FROM api_usage').get().count, 1)
})

test('single wrapped JSON object parses without altering quoted braces; ambiguous or truncated data is rejected', async () => {
  const h = await createGraderHarness(), scoring = await h.loadModule('app/api/ai-grader/scoring.ts')
  const original = { feedback: 'Keep {this} and "quoted" words intact.', nested: { score: 6 } }
  for (const text of [JSON.stringify(original), '```json\n' + JSON.stringify(original) + '\n```', 'Result:\n' + JSON.stringify(original)]) {
    assert.deepEqual(JSON.parse(JSON.stringify(scoring.parseModelJson(text))), original)
  }
  for (const text of ['[]', 'null', '[{"score":6}]', '{"score":6} {"score":7}', '{"score":6', '{"score":6,}']) assert.throws(() => scoring.parseModelJson(text))
})

test('malformed admin calibration falls back to valid task defaults instead of breaking Writing', async () => {
  const h = await createGraderHarness()
  h.sqlite.prepare('INSERT INTO system_config VALUES (?, ?)').run('GRADING_CALIBRATION', '{broken')
  h.state.response = gradingSamples[0].provider
  const result = await h.grade(gradingSamples[0])
  assert.equal(result.response.status, 200, JSON.stringify(result.data))
  assert.equal(result.data.overallBandFormatted, gradingSamples[0].expected)
  assert.ok(h.state.calls[0].payload.messages[0].content.includes('strict_schema'), 'The grading contract must be serialized instead of [object Object]')
})

test('invalid request JSON returns a JSON 400 before authentication, quota or provider work', async () => {
  const h = await createGraderHarness(), route = await h.loadModule('app/api/ai-grader/route.ts')
  const response = await route.POST(new Request('http://test.local/api/ai-grader', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' }))
  assert.equal(response.status, 400)
  assert.equal((await response.json()).code, 'INVALID_REQUEST_JSON')
  assert.equal(h.state.calls.length, 0)
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n, 0)
})
