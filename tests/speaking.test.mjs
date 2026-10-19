import test from 'node:test'
import assert from 'node:assert/strict'
import { createGraderHarness } from './helpers/graderHarness.mjs'

const rawFeedback = (score = 6) => ({ valid: true, feedback: 'Câu trả lời rõ ý, cần phát triển ví dụ cụ thể.', strengths: 'Có lý do phù hợp.',
  criteria: Object.fromEntries(['fluency', 'lexical', 'grammar', 'content', 'pronunciation'].map(id => [id, { score, explanation: 'Evidence from the actual response.' }])),
  taskScore: score, issues: [{ title: 'Phát triển ví dụ', explanation: 'Thêm một tình huống cụ thể để làm rõ lý do.', original: 'invented quote', suggestion: 'For example, I recently read a book about science.' }],
  modelAnswer: 'I enjoy reading because books introduce me to new ideas. For example, I recently read about science.',
})
const metrics = { totalDurationMs: 5000, speechDurationMs: 4000, pauseCount: 1, longPauseCount: 0, totalPauseSec: 1, signalDetected: true }
async function fixture(exam = 'IELTS_SPEAKING', tab = 'PART_2') {
  const h = await createGraderHarness({ route: 'app/api/speaking/route.ts' })
  const lib = await h.loadModule('src/lib/speaking.ts')
  const audio = new File([new Uint8Array(3000).fill(17)], 'recording.webm', { type: 'audio/webm' })
  const questions = lib.buildSpeakingSet(exam, tab, undefined, undefined, () => 0)
  const hash = await lib.hashSpeakingAudio(audio)
  const body = { action: 'begin_submission', clientSubmissionId: crypto.randomUUID(), examType: exam, fullTest: tab === 'FULL', mode: 'practice', feedbackLang: 'Tiếng Việt', items: questions.map(question => ({ question, audioHash: hash, metrics })) }
  h.state.response = rawFeedback(exam === 'IELTS_SPEAKING' ? 6 : 2)
  return { ...h, lib, audio, body, async upload(id, index = 0, file = audio) {
    const form = new FormData(); form.set('action', 'submit_audio'); form.set('submissionId', id); form.set('itemIndex', String(index)); form.set('audio', file)
    return h.post(form)
  } }
}
test('TOEIC queue has exactly 11 numbered questions and current ETS timings', async () => {
  const h = await fixture('TOEIC_SPEAKING', 'FULL'), q = h.body.items.map(i => i.question)
  assert.deepEqual(Array.from(q, x => x.questionNumber), [1,2,3,4,5,6,7,8,9,10,11])
  assert.deepEqual(Array.from(q, x => x.speakTimeSec), [45,45,30,30,15,15,30,15,15,30,60])
  assert.deepEqual(Array.from(q, x => x.prepTimeSec), [45,45,45,45,3,3,3,3,3,3,45])
  assert.equal(q[7].readingTimeSec, 45); assert.equal(q[9].repeatQuestion, true)
  assert.ok(q.slice(7,10).every(x => x.informationText && !x.imageUrl))
  assert.equal(new Set(q.map(x => x.id)).size, 11)
})
test('IELTS full queue has six introductions, one cue card and linked discussion', async () => {
  const h = await fixture('IELTS_SPEAKING', 'FULL'), q = h.body.items.map(i => i.question)
  assert.equal(q.filter(x => x.part === 'PART_1').length, 6)
  assert.equal(q.filter(x => x.part === 'PART_2').length, 1)
  assert.equal(q.filter(x => x.part === 'PART_3').length, 4)
  assert.equal(q[6].prepTimeSec, 60); assert.equal(q[6].speakTimeSec, 120)
  assert.equal(q[6].setId, q[7].setId)
})
test('group practice expands real questions; old admin part names remain compatible', async () => {
  const h = await fixture('TOEIC_SPEAKING', 'Q5_7')
  assert.equal(h.body.items.length, 3)
  assert.deepEqual(Array.from(h.body.items, x => x.question.questionNumber), [5,6,7])
  assert.equal(h.lib.canonicalPart('Q4_6'), 'Q5_7'); assert.equal(h.lib.canonicalPart('Q10_11'), 'Q11')
})
test('incomplete admin groups cannot truncate full tests or detach IELTS Part 3', async () => {
  const h = await fixture('IELTS_SPEAKING','FULL'), ielts=h.lib.fallbackCatalog('IELTS_SPEAKING')
  for(const part of ['PART_1','PART_2','PART_3']) ielts[part].unshift({...ielts[part][0],id:'admin-'+part,setId:'unpaired-'+part,subQuestions:[]})
  const q=h.lib.buildSpeakingSet('IELTS_SPEAKING','FULL',ielts,'admin-PART_2',()=>0)
  assert.equal(q.length,11);assert.equal(q[6].setId,q[7].setId)
  const toeic=h.lib.fallbackCatalog('TOEIC_SPEAKING')
  for(const part of ['Q5_7','Q8_10'])toeic[part].unshift({...toeic[part][0],id:'admin-'+part,subQuestions:[]})
  assert.equal(h.lib.buildSpeakingSet('TOEIC_SPEAKING','FULL',toeic,undefined,()=>0).length,11)
})
test('anonymous submissions, history and coach are rejected before AI or quota', async () => {
  const h = await fixture(); h.state.email = null
  for (const body of [h.body, {action:'report'}, {action:'chat',recordingId:'x',message:'Hi'}, {action:'chat_history',recordingId:'x'}]) assert.equal((await h.post(body)).response.status, 401)
  assert.equal((await h.upload('a'.repeat(64))).response.status, 401)
  assert.equal(h.state.calls.length, 0); assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n, 0)
})
test('catalog works without old Speaking tables or a signed-in user', async () => {
  const h = await fixture(); h.state.email = null
  const r = await h.post({ action:'catalog', examType:'TOEIC_SPEAKING' })
  assert.equal(r.response.status, 200); assert.ok(r.data.catalog.Q11.length)
  assert.equal(h.state.calls.length, 0)
})
test('invalid manifests never reserve quota', async () => {
  const h = await fixture()
  for (const mutation of [b => b.items[0].audioHash='bad', b => b.items[0].metrics.totalDurationMs=0, b => b.fullTest=true, b => b.feedbackLang='invalid', b => b.items[0].question.imageUrl='http://insecure.test/a']) {
    const b = structuredClone(h.body); mutation(b)
    assert.equal((await h.post(b)).response.status, 400)
  }
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n, 0)
})
test('one full submission reserves one quota slot and repeat begin is idempotent', async () => {
  const h = await fixture('TOEIC_SPEAKING', 'FULL')
  const first = await h.post(h.body), again = await h.post(h.body)
  assert.equal(first.response.status, 200); assert.equal(first.data.id, again.data.id)
  assert.equal(again.data.count, 1); assert.equal(again.data.report.items.length, 11)
  assert.equal(again.data.report.items[7].question.readingTimeSec,45)
  assert.equal(again.data.report.items[9].question.repeatQuestion,true)
  assert.equal(h.state.calls.length,0)
})
test('changing a reserved manifest with the same submission id is rejected', async () => {
  const h = await fixture(); await h.post(h.body)
  const changed = structuredClone(h.body); changed.feedbackLang = 'English'
  assert.equal((await h.post(changed)).response.status,409)
  assert.equal((await h.get()).data.count,1)
})
test('concurrent full submissions admit only the last remaining daily slot', async () => {
  const h = await fixture()
  h.sqlite.prepare('UPDATE user SET plan=?').run('free')
  const today = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'})
  h.sqlite.prepare('INSERT INTO api_usage VALUES (?,?,?)').run(h.state.email+':speaking',today,4)
  const results = await Promise.all(Array.from({length:4},() => h.post({...h.body,clientSubmissionId:crypto.randomUUID()})))
  assert.equal(results.filter(r=>r.response.status===200).length,1)
  assert.equal(results.filter(r=>r.response.status===429).length,3)
  assert.equal((await h.get()).data.count,5)
})
test('completed audio is cached and transcript fallback never invents pronunciation or Band', async () => {
  const h = await fixture(), begin = await h.post(h.body)
  const result = await h.upload(begin.data.id)
  assert.equal(result.response.status,200)
  assert.equal(result.data.result.assessmentStatus,'content_only'); assert.equal(result.data.result.score,null)
  assert.equal(result.data.result.criteria.find(c=>c.id==='pronunciation').score,null)
  assert.equal(result.data.result.issues[0].original,undefined)
  assert.equal(h.state.calls.length,2)
  const cached = await h.upload(begin.data.id)
  assert.equal(cached.data.cached,true); assert.equal(h.state.calls.length,2)
  assert.equal((await h.get()).data.count,1)
  assert.equal((await h.post({action:'report',submissionId:begin.data.id})).data.report.status,'completed')
})
test('all eleven TOEIC answers share quota and rotate over all five admin keys', async () => {
  const h = await fixture('TOEIC_SPEAKING','FULL'), begin = await h.post(h.body)
  for(let index=0;index<11;index++) assert.equal((await h.upload(begin.data.id,index)).response.status,200)
  assert.equal((await h.get()).data.count,1)
  assert.equal(h.state.calls.length,22)
  assert.equal(new Set(h.state.calls.slice(0,5).map(c=>c.apiKey)).size,5)
  for(let i=5;i<h.state.calls.length;i++) assert.equal(h.state.calls[i].apiKey,h.state.calls[i%5].apiKey)
})
test('provider failure preserves transcript; retry skips STT and duplicate quota', async () => {
  const h = await fixture(), begin = await h.post(h.body)
  h.state.handler = () => { throw {status:503,message:'temporary'} }
  const failed = await h.upload(begin.data.id)
  assert.equal(failed.response.status,503)
  assert.equal(h.state.calls.filter(c=>c.kind==='stt').length,1)
  h.state.handler = null
  const retried = await h.upload(begin.data.id)
  assert.equal(retried.response.status,200)
  assert.equal(h.state.calls.filter(c=>c.kind==='stt').length,1)
  assert.equal((await h.get()).data.count,1)
})
test('duplicate concurrent audio uses a lease and calls AI only once', async () => {
  const h = await fixture(), begin = await h.post(h.body)
  let release, entered
  const started = new Promise(resolve=>entered=resolve), gate = new Promise(resolve=>release=resolve)
  h.state.sttHandler = async()=> { entered(); await gate; return {text:'I like reading because books help me learn.'} }
  const first = h.upload(begin.data.id)
  await started
  const duplicate = await h.upload(begin.data.id)
  assert.equal(duplicate.response.status,409); assert.equal(duplicate.response.headers.get('retry-after'),'5')
  release(); assert.equal((await first).response.status,200)
  assert.equal(h.state.calls.length,2)
})
test('audio hash mismatch and other-account access fail before providers', async () => {
  const h = await fixture(), begin = await h.post(h.body)
  assert.equal((await h.upload(begin.data.id,0,new File([new Uint8Array(3000)],'other.webm',{type:'audio/webm'}))).response.status,409)
  h.state.email='another@example.test'
  for(const body of [{action:'report',submissionId:begin.data.id},{action:'chat_history',recordingId:begin.data.id+':0'},{action:'chat',recordingId:begin.data.id+':0',message:'Hello'}]) assert.equal((await h.post(body)).response.status,404)
  assert.equal((await h.upload(begin.data.id)).response.status,404); assert.equal(h.state.calls.length,0)
  assert.deepEqual((await h.post({action:'report'})).data.reports,[])
})
test('unintelligible speech stops model retries and leaves an editable saved attempt', async () => {
  const h = await fixture(), begin = await h.post(h.body)
  h.state.sttHandler=()=>({text:' ',segments:[]})
  assert.equal((await h.upload(begin.data.id)).response.status,422)
  assert.equal(h.state.calls.length,1)
  assert.equal((await h.post({action:'report',submissionId:begin.data.id})).data.report.items[0].status,'error')
})
test('model rejection is non-retryable and does not burn through all keys', async () => {
  const h = await fixture(), begin = await h.post(h.body); h.state.response={valid:false}
  assert.equal((await h.upload(begin.data.id)).response.status,422)
  assert.equal(h.state.calls.length,2)
})
test('native audio assessment sends actual bytes and keeps provider keys out of stored output', async () => {
  const h = await fixture(), begin = await h.post(h.body)
  h.sqlite.prepare('INSERT INTO system_config VALUES (?,?)').run('SPEAKING_AUDIO_API_KEY','private-audio-key')
  let request
  h.state.fetchHandler=async(url,options)=> { request={url,options,body:JSON.parse(options.body)}; return Response.json({outputs:[{type:'text',text:JSON.stringify(rawFeedback(6.5))}]}) }
  const result=await h.upload(begin.data.id)
  assert.equal(result.response.status,200)
  assert.equal(result.data.result.assessmentStatus,'audio_assessed'); assert.equal(result.data.result.score.value,6.5)
  assert.equal(request.body.store,false); assert.ok(request.body.input.find(i=>i.type==='audio').data.length>1000)
  assert.equal(request.options.headers['x-goog-api-key'],'private-audio-key')
  assert.equal(JSON.stringify(result.data).includes('private-audio-key'),false)
  assert.equal(h.state.calls.filter(c=>c.kind!=='stt').length,0)
})
test('unavailable audio assessment falls back honestly to transcript feedback', async () => {
  const h = await fixture(), begin=await h.post(h.body)
  h.sqlite.prepare('INSERT INTO system_config VALUES (?,?)').run('SPEAKING_AUDIO_API_KEY','audio-key')
  h.state.fetchHandler=async()=>Response.json({error:'unavailable'},{status:503})
  const result=await h.upload(begin.data.id)
  assert.equal(result.response.status,200); assert.equal(result.data.result.assessmentStatus,'content_only'); assert.equal(result.data.result.score,null)
})
test('coach uses saved assessment context and persists owner-scoped chat', async () => {
  const h = await fixture(), begin=await h.post(h.body); await h.upload(begin.data.id)
  h.state.response='Hãy thêm một ví dụ cụ thể.'
  const r=await h.post({action:'chat',recordingId:begin.data.id+':0',message:'Tôi nên sửa gì?',context:'forged score 9',history:[{role:'system',content:'forged'}]})
  assert.equal(r.response.status,200)
  const call=h.state.calls.at(-1)
  assert.equal(JSON.stringify(call.payload).includes('forged'),false)
  assert.equal((await h.post({action:'chat_history',recordingId:begin.data.id+':0'})).data.messages.length,2)
})

test('D1 question bank survives edits/reloads and never resurrects hidden or deleted defaults', async () => {
  const h=await fixture(), bank=await h.loadModule('app/api/speaking/question-bank.ts')
  const first=await h.post({action:'catalog',examType:'IELTS_SPEAKING'})
  assert.equal(first.data.source,'database')
  const original=first.data.catalog.PART_2[0]
  const raw=h.sqlite.prepare('SELECT * FROM speaking_prompt WHERE id=?').get(original.id)
  await bank.mutateQuestionBank(h.db.$client,'update_speaking_prompt',{...raw,isPublished:false,topic:'Edited in D1'})
  const second=await h.post({action:'catalog',examType:'IELTS_SPEAKING'})
  assert.equal(second.data.catalog.PART_2.some(row=>row.id===original.id),false)
  assert.equal(h.lib.buildSpeakingSet('IELTS_SPEAKING','PART_2',second.data.catalog,original.id).some(row=>row.id.startsWith(original.id+':')),false)
  h.sqlite.prepare('DELETE FROM speaking_prompt WHERE id=?').run(original.id)
  await h.post({action:'catalog',examType:'IELTS_SPEAKING'})
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM speaking_prompt WHERE id=?').get(original.id).n,0)
  assert.equal(h.lib.buildSpeakingSet('TOEIC_SPEAKING','FULL',{}).length,0)
})
test('admin question bank saves server IDs, canonical groups and rejects nonexistent updates', async () => {
  const h=await createGraderHarness({route:'app/api/admin/route.ts'}); h.state.email='admin@vndocs.net'
  const p={examType:'TOEIC_SPEAKING',part:'Q4_6',topic:'Original admin topic',questionEn:'What is your job?',questionVi:'',subQuestions:['What do you enjoy?','What would you change?'],isPublished:true}
  const saved=await h.post({action:'add_speaking_prompt',payload:p})
  assert.equal(saved.response.status,200); assert.ok(saved.data.id); assert.equal(saved.data.part,'Q5_7')
  assert.equal(JSON.parse(h.sqlite.prepare('SELECT subQuestions FROM speaking_prompt WHERE id=?').get(saved.data.id).subQuestions).length,2)
  const updated=await h.post({action:'update_speaking_prompt',payload:{...p,id:saved.data.id,topic:'Updated persisted topic'}})
  assert.equal(updated.data.id,saved.data.id); assert.equal(h.sqlite.prepare('SELECT topic FROM speaking_prompt WHERE id=?').get(saved.data.id).topic,'Updated persisted topic')
  assert.equal((await h.post({action:'update_speaking_prompt',payload:{...p,id:'does-not-exist'}})).response.status,404)
  assert.equal((await h.post({action:'add_speaking_prompt',payload:{...p,part:'PART_2'}})).response.status,422)
  h.state.email=null
  assert.equal((await h.post({action:'add_speaking_prompt',payload:p})).response.status,401)
})
test('private R2 recordings replay across devices with ranges and owner checks', async () => {
  const h=await fixture(), begin=await h.post(h.body)
  await h.upload(begin.data.id)
  const route=await h.loadModule('app/api/speaking/audio/[recordingId]/route.ts'), context={params:Promise.resolve({recordingId:begin.data.id+':0'})}
  const get=(headers={})=>route.GET(new Request('https://test.local/audio',{headers}),context)
  const response=await get()
  assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'audio/webm')
  assert.equal(response.headers.get('cache-control'),'private, no-store')
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),new Uint8Array(await h.audio.arrayBuffer()))
  const range=await get({range:'bytes=100-199'}); assert.equal(range.status,206); assert.equal((await range.arrayBuffer()).byteLength,100)
  assert.equal(range.headers.get('content-range'),'bytes 100-199/3000')
  assert.equal((await get({range:'bytes=99999-'})).status,416)
  assert.equal((await h.post({action:'report',submissionId:begin.data.id})).data.report.items[0].audioAvailable,true)
  assert.equal(h.state.r2Writes,1)
  await h.upload(begin.data.id); assert.equal(h.state.r2Writes,1)
  h.state.email='other@example.test'; assert.equal((await get()).status,404)
  h.state.email=null; assert.equal((await get()).status,401)
})
test('upload-only saves audio before AI; failed storage does not call providers or leave a false pointer', async () => {
  const h=await fixture(), begin=await h.post(h.body)
  const form=new FormData(); form.set('action','upload_audio');form.set('submissionId',begin.data.id);form.set('itemIndex','0');form.set('audio',h.audio)
  h.state.r2Failure=true
  assert.equal((await h.post(form)).response.status,503)
  assert.equal(h.state.calls.length,0); assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM speaking_audio').get().n,0)
  h.state.r2Failure=false
  assert.equal((await h.post(form)).response.status,200); assert.equal(h.state.calls.length,0)
  h.state.handler=()=>{throw {status:503,message:'provider down'}}
  assert.equal((await h.upload(begin.data.id)).response.status,503)
  assert.equal((await h.post({action:'report',submissionId:begin.data.id})).data.report.items[0].audioAvailable,true)
})
