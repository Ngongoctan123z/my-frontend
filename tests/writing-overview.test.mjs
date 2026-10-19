import test from 'node:test'
import assert from 'node:assert/strict'
import {createGraderHarness} from './helpers/graderHarness.mjs'

async function fixture({seed=false}={}) {
  const harness=await createGraderHarness()
  const overview=await harness.loadModule('app/api/admin/writing-overview.ts')
  const raw=harness.db.$client
  if(seed) {
    const writing=await harness.loadModule('app/api/ai-grader/writing-bank.ts')
    const toeic=await harness.loadModule('app/api/ai-grader/toeic-sets.ts')
    await writing.ensureWritingBank(raw)
    await toeic.ensureToeicExamSets(raw)
  }
  return {...harness,overview,raw}
}

test('overview is read-only even before initial bank setup and never creates tables or seed markers',async()=>{
  const h=await fixture()
  const before=h.sqlite.prepare('SELECT COUNT(*) n FROM system_config').get().n
  h.sqlite.exec('PRAGMA query_only=ON')
  const result=await h.overview.writingOverview(h.raw)
  for(const category of Object.values(result.categories)) {
    assert.equal(category.totalSets,0)
    assert.equal(category.brokenSets,0)
  }
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt').get().n,0)
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM system_config').get().n,before)
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='writing_exam_set'").get().n,0)
  assert.equal(h.state.calls.length,0)
})

test('all 150 TOPIK/HSK sets and native TOEIC stored memberships are counted from their exact IDs',async()=>{
  const h=await fixture({seed:true})
  h.sqlite.exec('PRAGMA query_only=ON')
  const {categories}=await h.overview.writingOverview(h.raw)
  assert.equal(categories.TOPIK.completeSets,50)
  assert.equal(categories.TOPIK.totalSets,50)
  assert.equal(categories.TOPIK.brokenSets,0)
  for(const type of ['TOPIK_51','TOPIK_52','TOPIK_53','TOPIK_54'])assert.equal(categories.TOPIK.componentCounts[type],50)
  assert.equal(categories.HSK.totalSets,100)
  assert.equal(categories.HSK.completeSets,100)
  assert.equal(categories.HSK.brokenSets,0)
  assert.equal(categories.HSK.relationMode,'independent')
  for(const type of ['HSK_5','HSK_6'])assert.equal(categories.HSK.levels[type].completeSets,50)
  const toeic=h.sqlite.prepare('SELECT * FROM writing_exam_set').all()
  assert.equal(categories.TOEIC.completeSets,toeic.length)
  assert.equal(categories.TOEIC.brokenSets,0)
  for(const row of toeic) {
    const stored=categories.TOEIC.sets.find(set=>set.id===row.id)
    assert.equal(stored.children.TOEIC_PICTURE,row.picturePromptId)
    assert.equal(stored.children.TOEIC_EMAIL_6,row.email6PromptId)
    assert.equal(stored.children.TOEIC_EMAIL_7,row.email7PromptId)
    assert.equal(stored.children.TOEIC_ESSAY,row.essayPromptId)
  }
})

test('surplus standalone prompts and shared child IDs are valid and never become count-difference errors',async()=>{
  const h=await fixture({seed:true})
  const insert=h.sqlite.prepare('INSERT INTO prompt(id,type,content,createdAt) VALUES(?,?,?,?)')
  for(let i=0;i<29;i++)insert.run('topik-extra-'+i,'TOPIK_54','Standalone essay '+i,i)
  for(let i=0;i<3;i++)insert.run('hsk5-extra-'+i,'HSK_5','Legacy HSK5 '+i,i)
  for(let i=0;i<11;i++)insert.run('hsk6-extra-'+i,'HSK_6','Legacy HSK6 '+i,i)
  insert.run('toeic-unlinked-essay','TOEIC_ESSAY','A standalone TOEIC essay',1)
  const {categories}=await h.overview.writingOverview(h.raw)
  assert.equal(categories.TOPIK.componentCounts.TOPIK_54,79)
  assert.equal(categories.TOPIK.brokenSets,0)
  assert.equal(categories.TOPIK.completeSets,50)
  assert.equal(categories.TOPIK.unlinkedPrompts,29)
  assert.equal(categories.HSK.componentCounts.HSK_5,53)
  assert.equal(categories.HSK.componentCounts.HSK_6,61)
  assert.equal(categories.HSK.levels.HSK_5.unlinkedPrompts,3)
  assert.equal(categories.HSK.levels.HSK_6.unlinkedPrompts,11)
  assert.equal(categories.HSK.brokenSets,0)
  assert.equal(categories.TOEIC.brokenSets,0)
  assert.ok(categories.TOEIC.unlinkedPrompts>=1)
  assert.ok(categories.TOEIC.completeSets>categories.TOEIC.componentCounts.TOEIC_ESSAY)
})

test('a missing TOPIK child or chart produces one explicit broken parent without substituting another ID',async()=>{
  const h=await fixture({seed:true})
  h.sqlite.prepare('DELETE FROM prompt WHERE id=?').run('topik-practice-01-51')
  h.sqlite.prepare('UPDATE prompt SET imageUrl=NULL WHERE id=?').run('topik-practice-02-53')
  const category=(await h.overview.writingOverview(h.raw)).categories.TOPIK
  assert.equal(category.totalSets,50)
  assert.equal(category.completeSets,48)
  assert.equal(category.brokenSets,2)
  const missing=category.sets.find(set=>set.id==='topik-practice-01')
  assert.equal(missing.status,'broken')
  assert.equal(missing.children.TOPIK_51,'topik-practice-01-51')
  assert.ok(missing.issues.some(issue=>issue.includes('topik-practice-01-51')))
  assert.ok(category.sets.find(set=>set.id==='topik-practice-02').issues.some(issue=>issue.includes('biểu đồ')))
})

test('wrongly typed and malformed stored parents are shown as broken instead of silently disappearing',async()=>{
  const h=await fixture({seed:true})
  h.sqlite.prepare('UPDATE prompt SET type=? WHERE id=?').run('HSK_5','hsk6-practice-01-body')
  for(const [id,content] of [['hsk6-practice-02','null'],['hsk6-practice-03','{bad'],['hsk6-practice-04','[]']])h.sqlite.prepare('UPDATE prompt SET content=? WHERE id=?').run(content,id)
  const result=await h.overview.writingOverview(h.raw)
  assert.equal(result.categories.HSK.levels.HSK_6.totalSets,50)
  assert.equal(result.categories.HSK.levels.HSK_6.brokenSets,4)
  assert.equal(result.categories.HSK.levels.HSK_5.brokenSets,0)
  assert.ok(result.categories.HSK.sets.find(set=>set.id==='hsk6-practice-01').issues.some(issue=>issue.includes('sai loại')))
})

test('hidden TOEIC sets remain valid; missing IDs, duplicate emails and malformed photos identify actual issues',async()=>{
  const h=await fixture({seed:true})
  const rows=h.sqlite.prepare('SELECT * FROM writing_exam_set ORDER BY id LIMIT 4').all()
  h.sqlite.prepare('UPDATE writing_exam_set SET isPublished=0 WHERE id=?').run(rows[0].id)
  h.sqlite.prepare('UPDATE writing_exam_set SET email7PromptId=email6PromptId WHERE id=?').run(rows[1].id)
  h.sqlite.prepare('UPDATE writing_exam_set SET essayPromptId=? WHERE id=?').run('deleted-essay-id',rows[2].id)
  h.sqlite.prepare('INSERT INTO prompt(id,type,content,createdAt) VALUES(?,?,?,?)').run('bad-pictures','TOEIC_PICTURE','{}',0)
  h.sqlite.prepare('UPDATE writing_exam_set SET picturePromptId=? WHERE id=?').run('bad-pictures',rows[3].id)
  const category=(await h.overview.writingOverview(h.raw)).categories.TOEIC
  assert.equal(category.hiddenSets,1)
  assert.equal(category.sets.find(set=>set.id===rows[0].id).status,'hidden')
  assert.equal(category.sets.find(set=>set.id===rows[0].id).issues.length,0)
  assert.equal(category.brokenSets,3)
  assert.ok(category.sets.find(set=>set.id===rows[1].id).issues.some(issue=>issue.includes('hai email')))
  assert.ok(category.sets.find(set=>set.id===rows[2].id).issues.some(issue=>issue.includes('deleted-essay-id')))
  assert.ok(category.sets.find(set=>set.id===rows[3].id).issues.some(issue=>issue.includes('năm ảnh')))
})

test('IELTS legacy 18/100 pools report dynamic pairing and the learner 30 cap, not 82 broken sets',async()=>{
  const h=await fixture()
  const insert=h.sqlite.prepare('INSERT INTO prompt(id,type,content,createdAt) VALUES(?,?,?,?)')
  for(let i=0;i<18;i++)insert.run('ielts-one-'+i,'IELTS_TASK_1','Chart '+i,i)
  for(let i=0;i<100;i++)insert.run('ielts-two-'+i,'IELTS_TASK_2','Essay '+i,i)
  const category=(await h.overview.writingOverview(h.raw)).categories.IELTS
  assert.equal(category.relationMode,'legacy')
  assert.equal(category.componentCounts.IELTS_TASK_1,18)
  assert.equal(category.componentCounts.IELTS_TASK_2,100)
  assert.equal(category.legacyPairableSets,18)
  assert.equal(category.legacyLearnerSets,30)
  assert.equal(category.totalSets,0)
  assert.equal(category.brokenSets,0)
  assert.equal(category.sets.length,0)
  assert.match(category.note,/ghép tự động/)
})

test('admin overview requires the existing admin authorization and returns no prompt content or config secrets',async()=>{
  const h=await fixture({seed:true})
  const route=await h.loadModule('app/api/admin/route.ts')
  const request=()=>{const req=new Request('https://vndocs.net/api/admin?type=writing_overview');req.nextUrl=new URL(req.url);return req}
  h.state.email=null
  assert.equal((await route.GET(request())).status,401)
  h.state.email='grader-test@example.test'
  assert.equal((await route.GET(request())).status,403)
  h.state.email='admin@vndocs.net'
  h.sqlite.exec('PRAGMA query_only=ON')
  const response=await route.GET(request())
  assert.equal(response.status,200)
  const result=await response.json(),serialized=JSON.stringify(result)
  assert.equal(result.categories.TOPIK.completeSets,50)
  assert.equal(result.categories.HSK.completeSets,100)
  assert.ok(!serialized.includes('test-key-'))
  assert.ok(!serialized.includes('GROQ_API_KEY'))
  assert.ok(!serialized.includes('"content":'))
  assert.equal(h.state.calls.length,0)
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n,0)
})

test('admin IELTS previews are bounded read-only source-ID pairs, independent of personal completion history',async()=>{
  const h=await fixture()
  const insert=h.sqlite.prepare('INSERT INTO prompt(id,type,content,createdAt,imageUrl) VALUES(?,?,?,?,?)')
  // Equal creation timestamps test the stable ID tiebreaker. Insert in reverse order.
  for(let i=40;i>=1;i--)insert.run('task2-'+String(i).padStart(2,'0'),'IELTS_TASK_2','Essay '+i,1,null)
  for(let i=2;i>=1;i--)insert.run('task1-'+i,'IELTS_TASK_1','Chart '+i,1,'/chart-'+i+'.png')
  const route=await h.loadModule('app/api/admin/route.ts')
  const request=()=>{const req=new Request('https://vndocs.net/api/admin?type=ielts_preview_sets');req.nextUrl=new URL(req.url);return req}
  h.state.email=null
  assert.equal((await route.GET(request())).status,401)
  h.state.email='grader-test@example.test'
  assert.equal((await route.GET(request())).status,403)
  h.state.email='admin@vndocs.net'
  const before=await (await route.GET(request())).json()
  assert.equal(before.source,'database')
  assert.equal(before.mode,'preview')
  assert.equal(before.sets.length,30)
  for(const [index,set] of before.sets.entries()) {
    assert.equal(set.title,'Cặp tham khảo #'+(index+1))
    assert.equal(set.part1.id,'task1-'+(index%2+1))
    assert.equal(set.part2.id,'task2-'+String(index+1).padStart(2,'0'))
    assert.equal(set.part1.content,'Chart '+(index%2+1))
    assert.equal(set.part1.imageUrl,'/chart-'+(index%2+1)+'.png')
  }
  for(const set of before.sets)h.sqlite.prepare('INSERT INTO essay_history(email,prompt,essay) VALUES(?,?,?)').run(h.state.email,set.title+' '+set.part1.content+' '+set.part2.content,'Completed essay')
  h.sqlite.exec('PRAGMA query_only=ON')
  const after=await (await route.GET(request())).json()
  assert.deepEqual(after,before)
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='writing_exam_set'").get().n,0)
  assert.equal(h.state.calls.length,0)
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n,0)
})

test('IELTS preview does not invent fallback prompts when either database pool is empty',async()=>{
  const h=await fixture()
  h.sqlite.prepare('INSERT INTO prompt(id,type,content,createdAt) VALUES(?,?,?,?)').run('only-task2','IELTS_TASK_2','Only existing essay',1)
  h.sqlite.exec('PRAGMA query_only=ON')
  const result=await h.overview.ieltsPreviewSets(h.raw)
  assert.equal(result.source,'database')
  assert.equal(result.mode,'preview')
  assert.equal(result.sets.length,0)
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt').get().n,1)
})
