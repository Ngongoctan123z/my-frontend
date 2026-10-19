// Production checks: public question catalogs and anonymous auth guards.
// Catalog requests also initialize the idempotent D1 question bank.
// No microphone upload, user submission, provider call or paid grading is made.
import assert from 'node:assert/strict'

const origin = 'https://vndocs.net'
async function request(path, body) {
  return fetch(origin + path, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000), redirect: 'error' })
}
let lastError
for (let attempt = 1; attempt <= 24; attempt++) {
  try {
    const [ielts,toeic,audio,admin,pictures,linked] = await Promise.all([
      request('/api/speaking',{action:'catalog',examType:'IELTS_SPEAKING'}),
      request('/api/speaking',{action:'catalog',examType:'TOEIC_SPEAKING'}),
      request('/api/speaking/audio/'+encodeURIComponent('0'.repeat(64)+':0')),
      request('/api/admin?type=speaking_prompts'),
      request('/api/ai-grader',{action:'generate_prompt_batch',type:'TOEIC_PICTURE'}),
      request('/api/ai-grader',{action:'get_paired_full_test',exam:'TOEIC'}),
    ])
    assert.equal(audio.status,401,'Private audio route must reject anonymous playback')
    assert.equal(admin.status,401,'Speaking administration must reject anonymous requests')
    for (const [exam,response] of [['IELTS',ielts],['TOEIC',toeic]]) {
      assert.equal(response.status,200,exam+' public catalog status')
      const data=await response.json()
      assert.equal(data.source,'database',exam+' must load its D1 question bank')
      assert.ok(data.catalog && typeof data.catalog==='object')
      console.log(exam+' catalog: D1, '+Object.values(data.catalog).flat().length+' published prompts')
    }
    assert.equal(pictures.status,200,'TOEIC Writing picture question bank status')
    const data=await pictures.json(), set=JSON.parse(data.prompts?.[0]?.content || '{}')
    assert.ok(data.totalPrompts>=50,'At least 50 real-photo practice sets must be in D1')
    assert.equal(set.questions?.length,5,'Five picture tasks must be available')
    assert.ok(set.questions.every((q,i)=>q.id===i+1 && q.keywords?.length===2 && q.imageUrl))
    const linkedData=await linked.json()
    assert.equal(linkedData.source,'database','Full Writing sets must use explicit D1 child IDs')
    assert.ok(linkedData.sets.length>0)
    for(const row of linkedData.sets){assert.ok(row.picturePromptId && row.part1.id && row.email7.id && row.part2.id);assert.notEqual(row.part1.id,row.email7.id)}
    console.log('PASS deployed D1 catalogs, TOEIC picture bank, private audio and admin auth guards')
    process.exit(0)
  } catch (error) {
    lastError=error
    console.log(`Waiting for the new Cloudflare deployment (${attempt}/24): ${error.message}`)
    if(attempt<24)await new Promise(resolve=>setTimeout(resolve,15_000))
  }
}
throw lastError
