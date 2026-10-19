import test from 'node:test'
import assert from 'node:assert/strict'
import { createGraderHarness } from './helpers/graderHarness.mjs'
async function fixture(){const h=await createGraderHarness();const bank=await h.loadModule('app/api/ai-grader/toeic-sets.ts');return {...h,bank,raw:h.db.$client}}
test('TOEIC set membership survives reordered and unrelated prompts',async()=>{
 const h=await fixture(),first=await h.bank.publicToeicExamSets(h.raw),set=first.sets[0]
 assert.ok(first.sets.length>=2);assert.ok(set.picturePromptId);assert.notEqual(set.part1.id,set.email7.id)
 h.sqlite.prepare('INSERT INTO prompt(id,type,content,createdAt) VALUES(?,?,?,?)').run('new-email','TOEIC_RESPOND','Unrelated email',Date.now()+99999)
 h.sqlite.prepare('UPDATE prompt SET createdAt=0 WHERE id=?').run(set.part1.id)
 const again=(await h.bank.publicToeicExamSets(h.raw)).sets.find(row=>row.id===set.id)
 assert.equal(again.part1.id,set.part1.id);assert.equal(again.email7.content,set.email7.content);assert.equal(again.part2.id,set.part2.id)
 assert.equal(again.pictures.questions.length,5)
})
test('TOEIC set rejects wrong types and duplicate emails; saved IDs are server IDs',async()=>{
 const h=await fixture(),set=(await h.bank.listToeicExamSets(h.raw))[0]
 const body={...set,title:'Linked example',isPublished:true}
 delete body.id
 for(const mutation of [b=>b.email7PromptId=b.email6PromptId,b=>b.essayPromptId=b.picturePromptId,b=>b.picturePromptId='missing']){
  const value={...body};mutation(value);await assert.rejects(h.bank.mutateToeicExamSet(h.raw,'add_toeic_exam_set',value))
 }
 const saved=await h.bank.mutateToeicExamSet(h.raw,'add_toeic_exam_set',body)
 assert.match(saved.id,/^[a-f\d-]{36}$/);assert.equal(saved.email6PromptId,body.email6PromptId)
 const updated=await h.bank.mutateToeicExamSet(h.raw,'update_toeic_exam_set',{...saved,title:'Edited title',isPublished:false})
 assert.equal(updated.id,saved.id);assert.equal((await h.bank.publicToeicExamSets(h.raw)).sets.some(row=>row.id===saved.id),false)
})
test('deleted and broken TOEIC linked sets stay absent instead of being silently reseeded',async()=>{
 const h=await fixture(),rows=await h.bank.listToeicExamSets(h.raw)
 await h.bank.mutateToeicExamSet(h.raw,'delete_toeic_exam_set',{id:rows[0].id})
 h.sqlite.prepare('DELETE FROM prompt WHERE id=?').run(rows[1].essayPromptId)
 assert.equal((await h.bank.publicToeicExamSets(h.raw)).sets.length,0)
 assert.equal((await h.bank.listToeicExamSets(h.raw)).length,rows.length-1)
})
test('public TOEIC route returns the four exact child IDs without consuming AI or quota',async()=>{
 const h=await fixture(),r=await h.post({action:'get_paired_full_test',exam:'TOEIC'})
 assert.equal(r.response.status,200);assert.equal(r.data.source,'database')
 for(const row of r.data.sets){const stored=h.sqlite.prepare('SELECT * FROM writing_exam_set WHERE id=?').get(row.id);assert.equal(row.picturePromptId,stored.picturePromptId);assert.equal(row.part1.id,stored.email6PromptId);assert.equal(row.email7.id,stored.email7PromptId);assert.equal(row.part2.id,stored.essayPromptId)}
 assert.equal(h.state.calls.length,0);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n,0)
})

test('50 five-picture sets contain 250 distinct word/example tasks with licensed reviewed photographs',async()=>{
 const h=await fixture(),lib=await h.loadModule('src/data/toeicPhotoBank.ts'),parser=await h.loadModule('src/data/toeicWriting.ts')
 const sets=lib.toeicPhotoPracticeSets();assert.equal(sets.length,50)
 const exercises=new Set(),photos=new Set()
 for(const set of sets){const parsed=parser.parseToeicPictures(JSON.stringify(set));assert.equal(parsed.questions.length,5);assert.equal(new Set(parsed.questions.map(q=>q.imageUrl)).size,5)
  for(const q of parsed.questions){assert.ok(q.exampleAnswer);assert.match(q.source.licenseUrl,/unsplash.com\/license$/);photos.add(q.imageUrl);exercises.add(q.imageUrl+'|'+q.keywords.join('|'))}
 }
 assert.equal(photos.size,50);assert.equal(exercises.size,250)
})
test('photo seeding is atomic, idempotent and never overwrites edited or resurrects deleted questions',async()=>{
 const h=await fixture(),bank=await h.loadModule('app/api/ai-grader/toeic-photo-bank.ts')
 await bank.ensureToeicPhotoBank(h.raw)
 assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM prompt WHERE type='TOEIC_PICTURE'").get().n,50)
 const id='toeic-photo-practice-01';h.sqlite.prepare('UPDATE prompt SET content=? WHERE id=?').run('admin-edited-content',id)
 h.sqlite.prepare('DELETE FROM prompt WHERE id=?').run('toeic-photo-practice-02')
 await bank.ensureToeicPhotoBank(h.raw)
 assert.equal(h.sqlite.prepare('SELECT content FROM prompt WHERE id=?').get(id).content,'admin-edited-content')
 assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM prompt WHERE type='TOEIC_PICTURE'").get().n,49)
})
test('public practice API seeds all 50 sets and hides model examples until after practice',async()=>{
 const h=await fixture(),r=await h.post({action:'generate_prompt_batch',type:'TOEIC_PICTURE'})
 assert.equal(r.response.status,200);assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM prompt WHERE type='TOEIC_PICTURE'").get().n,50)
 assert.equal(r.data.prompts.length,3)
 for(const p of r.data.prompts){assert.match(p.id,/toeic-photo-practice/);const set=JSON.parse(p.content);assert.equal(set.questions.length,5);assert.equal(set.questions[0].exampleAnswer,undefined)}
 assert.equal(h.state.calls.length,0)
})
