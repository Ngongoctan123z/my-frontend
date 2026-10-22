import test from 'node:test'
import assert from 'node:assert/strict'
import { learnerPrompt, learnerPromptContent, learnerSharedExam, learnerHistoryPrompt, learnerGradingResult } from '../src/lib/publicWritingPrompt.ts'
import { createGraderHarness } from './helpers/graderHarness.mjs'
import { gradingSamples } from './fixtures/gradingSamples.mjs'

const secret = 'PRIVATE_CONTEXT_MUST_STAY_ON_SERVER_8362'
test('student projection removes private fields from structured prompts and the shared RSC payload', () => {
  const content = JSON.stringify({ title: 'Chart task', text: 'Describe this chart.', imageDescription: secret, context: secret, data: secret, source: { title: 'Statistics office', url: 'https://example.invalid/source', note: secret } })
  const row = { id: 'chart-1', content, imageUrl: '/chart.webp', creatorId: 'private-owner@example.invalid', imageDescription: secret, examType: 'TOPIK_53', expiresAt: new Date(), requireEmail: true }
  const prompt = learnerPrompt(row), shared = learnerSharedExam(row)
  for (const result of [prompt, shared]) { assert.ok(!JSON.stringify(result).includes(secret)); assert.ok(!JSON.stringify(result).includes('private-owner')) }
  assert.ok(prompt.content.includes('Describe this chart.')); assert.equal(prompt.imageUrl, '/chart.webp')
  assert.equal(shared.requireEmail, true); assert.equal(shared.id, row.id)
  assert.equal(learnerPromptContent(shared.content), shared.content, 'projection must be idempotent')
})
test('HSK picture tasks and TOEIC images retain instructions/keywords without captions or model answers', () => {
  const hsk = JSON.stringify({ title: 'HSK 5', part1: [{ id: 91, words: '今天 / 他 / 学习', answer: secret }], part2: { id: 99, keywords: ['学习'], requirement: 'Write 80 characters.', answer: secret }, part3: { id: 100, imageUrl: '/photo.webp', description: secret, requirement: 'Write about the picture.', context: secret } })
  const safe = JSON.parse(learnerPromptContent(hsk)); assert.equal(safe.part3.imageUrl, '/photo.webp'); assert.equal(safe.part1[0].words, '今天 / 他 / 学习'); assert.ok(!JSON.stringify(safe).includes(secret))
  const toeic = JSON.stringify({ title: 'Photos', questions: [{ id: 1, imageUrl: '/photo.webp', keywords: ['people', 'table'], description: secret, exampleAnswer: secret }] })
  const photos = JSON.parse(learnerPromptContent(toeic)); assert.deepEqual(photos.questions[0].keywords, ['people', 'table']); assert.ok(!JSON.stringify(photos).includes(secret))
  assert.ok(!learnerHistoryPrompt(hsk + '\n\nMiêu tả tranh: ' + secret).includes(secret))
})
test('legacy Context sections are hidden and feedback source snapshots cannot restore internal data', () => {
  assert.equal(learnerPromptContent('Describe the graph.\n\nContext: ' + secret), 'Describe the graph.')
  assert.equal(learnerPromptContent('Describe the graph.\n\n**[Context for AI]:** ' + secret), 'Describe the graph.')
  assert.equal(learnerPromptContent('```json\n{"text":"Describe the graph.","context":"' + secret + '"}\n```'), 'Describe the graph.')
  assert.equal(learnerPromptContent('{"unrecognizedInternalField":"' + secret + '"}'), '')
  const result = learnerGradingResult({ detailedFeedback: 'Review your comparison.', imageDescription: secret, sourcePrompts: { TOPIK_53: { id: 'chart', content: '{"text":"Describe it","context":"' + secret + '"}', imageDescription: secret } } })
  assert.equal(result.detailedFeedback, 'Review your comparison.'); assert.ok(!JSON.stringify(result).includes(secret))
})
test('public IELTS prompt omits private chart context while server grading restores the stored reference', async () => {
  const h = await createGraderHarness()
  h.sqlite.prepare('INSERT INTO prompt(id,type,content,imageUrl,createdAt) VALUES(?,?,?,?,?)').run('private-chart','IELTS_TASK_1',JSON.stringify({text:'Summarize the chart shown below.',context:secret}),'/chart.webp',Date.now())
  const publicResponse = await h.post({ action: 'generate_prompt_batch', type: 'IELTS_TASK_1' })
  assert.equal(publicResponse.response.status,200); assert.ok(!JSON.stringify(publicResponse.data).includes(secret))
  const prompt = publicResponse.data.prompts[0], sample = gradingSamples.find(row => row.type === 'TOEIC_ESSAY')
  h.state.handler = () => ({criteria:Object.fromEntries(['taskAchievement','coherenceCohesion','lexicalResource','grammaticalRange'].map(key=>[key,{score:6,feedback:'Clear comparison.',reasoning:'Learner response assessed.',evidence:[]}])),detailedFeedback:'Review the key comparisons.',corrections:[]})
  const graded = await h.post({ action:'grade_essay', type:'IELTS_TASK_1', prompt:prompt.content, imageUrl:prompt.imageUrl, essay:sample.essay, feedbackLang:'English', imageDescription:'forged reference' })
  assert.equal(graded.response.status,200,JSON.stringify(graded.data))
  assert.ok(JSON.stringify(h.state.calls[0].payload.messages).includes(secret)); assert.ok(!JSON.stringify(graded.data).includes(secret))
})
test('public HSK and TOPIK set payloads contain no private image context', async () => {
  const h = await createGraderHarness()
  for (const exam of ['TOPIK','HSK_5']) {
    const catalog = await h.post({action:'get_writing_catalog',exam}), id = catalog.data.sets[0].id
    const response = await h.post({action:'get_writing_set',exam,id}); assert.equal(response.response.status,200)
    const data = JSON.stringify(response.data)
    assert.ok(!data.includes('imageDescription')); assert.ok(!data.includes('"description"')); assert.ok(!data.includes('exampleAnswer'))
    if(exam==='HSK_5') assert.ok(JSON.parse(response.data.set.questions.HSK_5.content).part3.imageUrl)
  }
})
