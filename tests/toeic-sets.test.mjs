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
 const remaining=(await h.bank.publicToeicExamSets(h.raw)).sets
 assert.equal(remaining.some(row=>row.id===rows[0].id||row.part2.id===rows[1].essayPromptId),false)
 assert.equal((await h.bank.listToeicExamSets(h.raw)).length,rows.length-1)
})

test('all 50 photo groups have complete stable parents and use the 30 fixed new email pairs and existing essay IDs',async()=>{
 const h=await fixture(),rows=await h.bank.listToeicExamSets(h.raw)
 const parents=rows.filter(row=>row.id.startsWith('toeic-photo-full-')),original=rows.filter(row=>!row.id.startsWith('toeic-photo-full-'))
 assert.equal(parents.length,50)
 assert.equal(new Set(parents.map(row=>row.picturePromptId)).size,50)
 for(const parent of parents){assert.equal(parent.valid,true);assert.equal(parent.isPublished,true);assert.ok(original.some(row=>row.essayPromptId===parent.essayPromptId));assert.match(parent.email6PromptId,/^toeic-email-6-/);assert.equal(parent.email7PromptId,parent.email6PromptId.replace('email-6-','email-7-'))}
 const first=parents[0],edited=await h.bank.mutateToeicExamSet(h.raw,'update_toeic_exam_set',{...first,title:'Admin keeps this grouping',isPublished:false})
 await h.bank.mutateToeicExamSet(h.raw,'delete_toeic_exam_set',{id:parents[1].id})
 const again=await h.bank.listToeicExamSets(h.raw)
 assert.equal(again.find(row=>row.id===first.id).title,edited.title);assert.equal(again.find(row=>row.id===first.id).isPublished,false)
 assert.equal(again.some(row=>row.id===parents[1].id),false)
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
 assert.equal(new Set(sets.map(set=>set.questions.map(q=>q.imageUrl).sort().join('|'))).size,50)
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
 for(const p of r.data.prompts){assert.match(p.id,/toeic-photo-practice/);const set=JSON.parse(p.content);assert.equal(set.questions.length,5);assert.equal(set.questions[0].exampleAnswer,undefined);assert.equal(set.questions[0].description,undefined)}
 assert.equal(h.state.calls.length,0)
})

test('60 original email questions are persisted as 30 independent Q6 and 30 independent Q7 stimuli',async()=>{
 const h=await fixture(),data=await h.loadModule('src/data/toeicEmails.ts'),bank=await h.loadModule('app/api/ai-grader/toeic-email-bank.ts')
 const rows=data.toeicEmailBank();assert.equal(rows.length,60);assert.equal(new Set(rows.map(row=>row.content)).size,60)
 for(const row of rows){assert.equal(row.requirements.length,3);for(const label of ['From:','To:','Subject:','Directions:','10 minutes'])assert.ok(row.content.includes(label))}
 await bank.ensureToeicEmailBank(h.raw)
 for(const type of ['TOEIC_EMAIL_6','TOEIC_EMAIL_7'])assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt WHERE type=?').get(type).n,30)
 h.sqlite.prepare('UPDATE prompt SET content=? WHERE id=?').run('admin-edited-email','toeic-email-6-01')
 h.sqlite.prepare('DELETE FROM prompt WHERE id=?').run('toeic-email-7-01')
 await bank.ensureToeicEmailBank(h.raw)
 assert.equal(h.sqlite.prepare('SELECT content FROM prompt WHERE id=?').get('toeic-email-6-01').content,'admin-edited-email')
 assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM prompt WHERE id=?').get('toeic-email-7-01').n,0)
})
test('Q6/Q7 public catalogs never draw from the other question position or call providers',async()=>{
 const h=await fixture();h.state.email=null
 for(const number of [6,7]){const r=await h.post({action:'generate_prompt_batch',type:'TOEIC_EMAIL_'+number});assert.equal(r.response.status,200);assert.equal(r.data.totalPrompts,30);assert.equal(r.data.prompts.length,3);assert.ok(r.data.prompts.every(row=>row.id.startsWith('toeic-email-'+number+'-')))}
 assert.equal(h.state.calls.length,0);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM api_usage').get().n,0)
})
test('both email aliases grade the exact new stimulus and preserve native 0–4 marks without a short-length cap',async()=>{
 const h=await fixture(),data=await h.loadModule('src/data/toeicEmails.ts')
 const examples={6:['I want to practise presenting. Please provide a projector. When does the workshop begin?',['I want to practise presenting.','Please provide a projector.','When does the workshop begin?']],7:['I can attend because I am free. Please offer a recording to absent staff. Are materials provided?',['I can attend because I am free.','Please offer a recording to absent staff.','Are materials provided?']]}
 for(const number of [6,7]){const task=data.toeicEmailBank().find(row=>row.type==='TOEIC_EMAIL_'+number),[essay,quotes]=examples[number]
  h.state.response={holisticScore:4,criteria:Object.fromEntries(['taskFulfillment','organization','grammar','vocabulary'].map(key=>[key,{score:4,evidence:[],feedback:'Diagnostic only.'}])),requirementChecks:task.requirements.map((requirement,i)=>({requirement,status:'met',evidence:quotes[i]})),corrections:[],detailedFeedback:'Controlled provider fixture.'}
  const r=await h.grade({type:task.type,prompt:task.content,essay,feedbackLang:'English'});assert.equal(r.response.status,200,JSON.stringify(r.data));assert.equal(r.data.overallBand,4);assert.equal(r.data.scoreScale,4);assert.equal(r.data.questionNumber,number);assert.equal(r.data.assessmentStatus,'practice_estimate');assert.equal(r.data.requirementChecks.length,3)
  assert.ok(h.state.calls.at(-1).payload.messages[1].content.includes(task.content))
 }
})
test('email completeness caps reflect actual missing tasks and exact response evidence',async()=>{
 const h=await fixture(),scoring=await h.loadModule('app/api/ai-grader/scoring.ts')
 const response={holisticScore:4,criteria:Object.fromEntries(['taskFulfillment','organization','grammar','vocabulary'].map(key=>[key,{score:4}])),requirementChecks:[1,2,3].map(n=>({requirement:'Requirement '+n,status:'met',evidence:'Yes.'})),corrections:[]}
 for(const [missing,max] of [[0,4],[1,3],[2,2],[3,1]]){const parsed=structuredClone(response);parsed.requirementChecks.forEach((row,i)=>{if(i<missing){row.status='missing';row.evidence=''}});assert.equal(scoring.postProcessResult(parsed,'TOEIC_RESPOND','Yes.',99).overallBand,max)}
 const invented=structuredClone(response);invented.requirementChecks[0].evidence='Never said this';assert.throws(()=>scoring.postProcessResult(invented,'TOEIC_RESPOND','Yes.'),/invented/)
 for(const score of [undefined,null,4.5,5,-1,'4']){const parsed=structuredClone(response);parsed.holisticScore=score;assert.throws(()=>scoring.postProcessResult(parsed,'TOEIC_RESPOND','Yes.'),/holistic/)}
})
test('TOEIC essay holistic marks are not averaged, calibrated or mechanically capped below 250 words',async()=>{
 const h=await fixture(),scoring=await h.loadModule('app/api/ai-grader/scoring.ts')
 const parsed={holisticScore:4,criteria:Object.fromEntries(['reasonsAndExamples','organization','grammar','vocabulary'].map(key=>[key,{score:5}])),corrections:[]}
 const r=scoring.postProcessResult(parsed,'TOEIC_ESSAY','The score comes from the rubric rather than an arbitrary word-count formula.',99)
 assert.equal(r.overallBand,4);assert.equal(r.scoreScale,5);assert.ok(r.criteriaNote)
})

