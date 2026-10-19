import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {createGraderHarness} from './helpers/graderHarness.mjs'
const seed=JSON.parse(await readFile('public/exam-data/writing-bank-v1.json','utf8'))
async function fixture(){const h=await createGraderHarness();return {...h,bank:await h.loadModule('app/api/ai-grader/writing-bank.ts'),raw:h.db.$client}}
test('150 complete native-format sets contain 300 distinct questions, full-length HSK 6 and 400 different HSK 5 ordering sentences',()=>{
 assert.equal(seed.sets.length,150);assert.equal(seed.questions.length,300)
 assert.equal(new Set(seed.questions.map(q=>q.id)).size,300)
 const ordering=new Set(),photos=new Set()
 for(const exam of ['TOPIK','HSK_5','HSK_6'])assert.equal(seed.sets.filter(s=>s.exam===exam).length,50)
 for(const type of ['TOPIK_51','TOPIK_52','TOPIK_53','TOPIK_54','HSK_5','HSK_6']){const rows=seed.questions.filter(q=>q.type===type);assert.equal(rows.length,50);assert.equal(new Set(rows.map(q=>q.content)).size,50)}
 for(const row of seed.questions){
  if(row.type==='HSK_5'){const value=JSON.parse(row.content);assert.deepEqual(value.part1.map(q=>q.id),[91,92,93,94,95,96,97,98]);assert.equal(value.part2.keywords.length,5);assert.match(value.part3.imageUrl,/^https:\/\/images.unsplash.com\/photo-/);photos.add(value.part3.imageUrl);for(const item of value.part1)ordering.add(item.words)}
  if(row.type==='HSK_6'){const length=row.content.split('\n\n').slice(2).join('').replace(/\s/g,'').length;assert.ok(length>=900&&length<=1200,row.id);assert.match(row.content,/400/)}
 }
 assert.equal(ordering.size,400);assert.equal(photos.size,50)
})
test('50 unchanged chart panels have unique file hashes and verifiable published PDF attribution',async()=>{
 const charts=JSON.parse(await readFile('src/data/writing-bank/topikCharts.json','utf8'))
 assert.equal(charts.length,50);assert.equal(new Set(charts.map(c=>c.sha256)).size,50)
 for(const chart of charts){assert.equal(createHash('sha256').update(await readFile('public'+chart.imageUrl)).digest('hex'),chart.sha256);assert.ok(chart.verifiedData.length>50);assert.match(chart.source.documentUrl,/mods.go.kr/);assert.ok(chart.source.pdfPage);assert.ok(chart.source.license)}
})
test('atomic D1 seed respects the binding limit and preserves subsequent admin edits/deletions',async()=>{
 const h=await fixture(),counts=[]
 const instrumented={prepare(query){const statement=h.raw.prepare(query),bind=statement.bind;statement.bind=function(...params){counts.push(params.length);return bind.apply(this,params)};return statement},batch:statements=>h.raw.batch(statements)}
 await h.bank.ensureWritingBank(instrumented)
 assert.ok(Math.max(...counts)<=76);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt').get().n,450)
 h.sqlite.prepare('UPDATE prompt SET content=? WHERE id=?').run('admin edit','hsk6-practice-01-body')
 h.sqlite.prepare('DELETE FROM prompt WHERE id=?').run('topik-practice-02-51')
 await h.bank.ensureWritingBank(h.raw)
 assert.equal(h.sqlite.prepare('SELECT content FROM prompt WHERE id=?').get('hsk6-practice-01-body').content,'admin edit')
 assert.equal((await h.bank.writingCatalog(h.raw,'TOPIK')).totalSets,49)
 assert.equal(await h.bank.getWritingSet(h.raw,'TOPIK','topik-practice-02'),null)
})
test('a failed seed batch rolls back all rows and marker; the next attempt can recover',async()=>{
 const h=await fixture()
 const bad={...seed,questions:seed.questions.map((row,i)=>i===200?{...row,id:null}:row)}
 // Force a real SQLite failure midway through the transaction, rather than mocking batch success.
 h.sqlite.exec("CREATE TRIGGER reject_bad_seed BEFORE INSERT ON prompt WHEN NEW.id IS NULL BEGIN SELECT RAISE(ABORT,'invalid seed'); END")
 await assert.rejects(h.bank.ensureWritingBank(h.raw,async()=>bad))
 assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt').get().n,0)
 assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM system_config WHERE key='TOPIK_HSK_150_SETS_V1'").get().n,0)
 await h.bank.ensureWritingBank(h.raw);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt').get().n,450)
})
test('public API returns all 50 exact linked sets per exam without AI calls or quota usage',async()=>{
 const h=await fixture();h.state.email=null
 for(const exam of ['TOPIK','HSK_5','HSK_6']){
  const catalog=await h.post({action:'get_writing_catalog',exam});assert.equal(catalog.response.status,200);assert.equal(catalog.data.totalSets,50)
  const last=catalog.data.sets.at(-1),result=await h.post({action:'get_writing_set',exam,id:last.id});assert.equal(result.response.status,200)
  for(const [type,id] of Object.entries(last.children)){assert.equal(result.data.set.questions[type].id,id);const row=h.sqlite.prepare('SELECT * FROM prompt WHERE id=?').get(id);assert.equal(row.type,type);assert.equal(result.data.set.questions[type].content,type==='TOPIK_53'?JSON.parse(row.content).text:row.content)}
  if(exam==='TOPIK'){const q=result.data.set.questions.TOPIK_53;assert.ok(q.imageUrl&&q.imageDescription&&q.source.documentUrl)}
 }
 assert.equal(h.state.calls.length,0);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n,0)
})
test('broken or wrongly typed children are excluded without silently substituting a different prompt',async()=>{
 const h=await fixture();await h.bank.ensureWritingBank(h.raw)
 h.sqlite.prepare('UPDATE prompt SET type=? WHERE id=?').run('TOPIK_54','topik-practice-01-51')
 assert.equal(await h.bank.getWritingSet(h.raw,'TOPIK','topik-practice-01'),null)
 const r=await h.post({action:'get_writing_set',exam:'TOPIK',id:'topik-practice-01'});assert.equal(r.response.status,404)
 assert.equal((await h.bank.writingCatalog(h.raw,'TOPIK')).totalSets,49)
 assert.equal((await h.post({action:'get_writing_catalog',exam:'BAD'})).response.status,400)
})
test('practice selection reaches question 50 and compares full HSK 6 passages, not their common directions',async()=>{
 const h=await fixture();await h.bank.ensureWritingBank(h.raw)
 const rows=seed.questions.filter(q=>q.type==='HSK_6')
 const result=await h.bank.writingPracticePrompts(h.raw,'HSK_6',rows.slice(0,49).map(q=>q.content))
 assert.equal(result.totalPrompts,50);assert.equal(result.prompts.length,1);assert.equal(result.prompts[0].id,'hsk6-practice-50-body');assert.equal(result.prompts[0].content,rows[49].content)
 const common=rows[0].content.slice(0,100),again=await h.bank.writingPracticePrompts(h.raw,'HSK_6',[common]);assert.equal(again.prompts.length,3)
})
test('missing asset binding returns an explicit retryable failure without writing a completion marker',async()=>{
 const h=await fixture();h.state.assetsDisabled=true
 const failed=await h.post({action:'get_writing_catalog',exam:'TOPIK'});assert.equal(failed.response.status,503);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt').get().n,0)
 h.state.assetsDisabled=false
 const retry=await h.post({action:'get_writing_catalog',exam:'TOPIK'});assert.equal(retry.response.status,200);assert.equal(retry.data.totalSets,50)
})
