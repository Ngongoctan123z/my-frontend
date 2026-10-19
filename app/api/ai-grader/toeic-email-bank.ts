import { toeicEmailBank, type ToeicEmailType } from '@/src/data/toeicEmails'
import type { SpeakingD1, D1Statement } from '../speaking/store'
const marker='TOEIC_EMAIL_BANK_60_V1'
export async function ensureToeicEmailBank(db:SpeakingD1){
 if(await db.prepare('SELECT value FROM system_config WHERE key=?').bind(marker).first())return
 const rows=toeicEmailBank(),now=Date.now(),statements:D1Statement[]=[]
 for(let offset=0;offset<rows.length;offset+=10){const chunk=rows.slice(offset,offset+10)
  statements.push(db.prepare(`INSERT INTO prompt(id,type,content,imageUrl,createdAt)
   SELECT column1,column2,column3,NULL,column4 FROM (VALUES ${chunk.map(()=>'(?,?,?,?)').join(',')})
   WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?) ON CONFLICT(id) DO NOTHING`)
   .bind(...chunk.flatMap(row=>[row.id,row.type,row.content,now]),marker))
 }
 statements.push(db.prepare('INSERT INTO system_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(marker,'1'))
 await db.batch(statements)
}
export async function emailPracticePrompts(db:SpeakingD1,type:ToeicEmailType,done:string[]=[]){
 await ensureToeicEmailBank(db)
 const {results}=await db.prepare('SELECT id,content FROM prompt WHERE type=? ORDER BY createdAt,id').bind(type).all()
 const unfinished=results.filter(row=>!done.includes(row.content)),pool=unfinished.length?unfinished:results
 const remaining=[...pool],selected=[]
 while(remaining.length&&selected.length<3)selected.push(remaining.splice(Math.floor(Math.random()*remaining.length),1)[0])
 return {source:'database',totalPrompts:results.length,text:selected[0]?.content||'',prompts:selected}
}
