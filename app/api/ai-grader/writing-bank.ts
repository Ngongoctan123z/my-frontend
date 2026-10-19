import type {WritingExam,WritingRow,WritingSetRecord} from '@/src/lib/writingBank'
import {getCloudflareContext} from '@opennextjs/cloudflare'
import type {SpeakingD1,D1Statement} from '../speaking/store'
const marker='TOPIK_HSK_150_SETS_V1'
const parentType=(exam:WritingExam)=>'WRITING_SET_'+exam
type Seed={questions:WritingRow[];sets:WritingSetRecord[]}
let seedRequest:Promise<Seed>|undefined
async function loadWritingSeed():Promise<Seed>{
 if(!seedRequest)seedRequest=(async()=>{
  const assets=((await getCloudflareContext({async:true})).env as unknown as {ASSETS?:{fetch:(request:Request)=>Promise<Response>}}).ASSETS
  if(!assets)throw new Error('Thiếu kho dữ liệu đề đã build.')
  const response=await assets.fetch(new Request('https://assets.invalid/exam-data/writing-bank-v1.json'))
  if(!response.ok)throw new Error('Không đọc được dữ liệu kho đề.')
  const seed=await response.json() as Seed
  if(!Array.isArray(seed.questions)||seed.questions.length!==300||!Array.isArray(seed.sets)||seed.sets.length!==150)throw new Error('Kho đề không đủ dữ liệu.')
  return seed
 })().catch(error=>{seedRequest=undefined;throw error})
 return seedRequest
}
export async function ensureWritingBank(db:SpeakingD1,loadSeed=loadWritingSeed){
 if(await db.prepare('SELECT value FROM system_config WHERE key=?').bind(marker).first())return
 const bank=await loadSeed(),now=Date.now(),rows:WritingRow[]=[...bank.questions,...bank.sets.map(set=>({id:set.id,type:parentType(set.exam),content:JSON.stringify(set)}))],statements:D1Statement[]=[]
 for(let i=0;i<rows.length;i+=15){const chunk=rows.slice(i,i+15)
  statements.push(db.prepare(`INSERT INTO prompt(id,type,content,imageUrl,createdAt)
   SELECT column1,column2,column3,column4,column5 FROM(VALUES ${chunk.map(()=>'(?,?,?,?,?)').join(',')})
   WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?) ON CONFLICT(id) DO NOTHING`)
   .bind(...chunk.flatMap(row=>[row.id,row.type,row.content,row.imageUrl||null,now]),marker))
 }
 statements.push(db.prepare('INSERT INTO system_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(marker,'1'))
 await db.batch(statements)
}
export function publicWritingPrompt(row:WritingRow){
 if(row.type==='TOPIK_53'){
  try{const parsed=JSON.parse(row.content);if(typeof parsed.text==='string'&&typeof parsed.imageDescription==='string')return {id:row.id,content:parsed.text,imageUrl:row.imageUrl||null,imageDescription:parsed.imageDescription,source:parsed.source}}
  catch{}
 }
 return {id:row.id,content:row.content,imageUrl:row.imageUrl||null}
}
const keys:Record<WritingExam,string[]>={TOPIK:['TOPIK_51','TOPIK_52','TOPIK_53','TOPIK_54'],HSK_5:['HSK_5'],HSK_6:['HSK_6']}
async function bankRows(db:SpeakingD1,exam:WritingExam){
 await ensureWritingBank(db)
 const {results}=await db.prepare('SELECT id,type,content,imageUrl FROM prompt WHERE type=? OR type IN ('+keys[exam].map(()=>'?').join(',')+') ORDER BY id').bind(parentType(exam),...keys[exam]).all()
 return results as WritingRow[]
}
function resolveSet(parent:WritingRow,rows:WritingRow[],exam:WritingExam){
 let set:WritingSetRecord
 try{set=JSON.parse(parent.content)}catch{return null}
 if(set.id!==parent.id||set.exam!==exam||!set.children)return null
 const questions:Record<string,ReturnType<typeof publicWritingPrompt>>={}
 for(const key of keys[exam]){const row=rows.find(row=>row.id===set.children[key]&&row.type===key);if(!row)return null;questions[key]=publicWritingPrompt(row)}
 if(exam==='TOPIK'&&!questions.TOPIK_53.imageUrl)return null
 return {...set,questions}
}
export async function writingCatalog(db:SpeakingD1,exam:WritingExam){
 const rows=await bankRows(db,exam)
 const sets=rows.filter(row=>row.type===parentType(exam)).flatMap(row=>{const set=resolveSet(row,rows,exam);return set?[{id:set.id,title:set.title,exam:set.exam,format:set.format,origin:set.origin,children:set.children}]:[]})
 return {source:'database',exam,totalSets:sets.length,sets}
}
export async function getWritingSet(db:SpeakingD1,exam:WritingExam,id:string){
 const rows=await bankRows(db,exam),parent=rows.find(row=>row.id===id&&row.type===parentType(exam))
 return parent?resolveSet(parent,rows,exam):null
}
export async function writingPracticePrompts(db:SpeakingD1,type:string,done:string[]=[]){
 await ensureWritingBank(db)
 const {results}=await db.prepare('SELECT id,type,content,imageUrl FROM prompt WHERE type=? ORDER BY id').bind(type).all()
 const rows=results as WritingRow[],mapped=rows.map(publicWritingPrompt)
 // HSK narratives share directions. The complete source identifies a prompt, not its first sentence.
 const finished=(content:string)=>done.some(text=>typeof text==='string'&&text.length>=80&&(text===content||text.includes(content)))
 const unfinished=mapped.filter(row=>!finished(row.content)),pool=[...(unfinished.length?unfinished:mapped)],selected=[]
 while(pool.length&&selected.length<3)selected.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])
 return {source:'database',totalPrompts:rows.length,text:selected[0]?.content||'',prompts:selected}
}
