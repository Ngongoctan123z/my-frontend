import { toeicPhotoPracticeSets } from '@/src/data/toeicPhotoBank'
import type { SpeakingD1, D1Statement } from '../speaking/store'
const seedKey='TOEIC_PHOTO_PRACTICE_50_V1'
export async function ensureToeicPhotoBank(db:SpeakingD1) {
  if(await db.prepare('SELECT value FROM system_config WHERE key=?').bind(seedKey).first())return
  const rows=toeicPhotoPracticeSets(),now=Date.now(),statements:D1Statement[]=[]
  // Six statements total, <=41 parameters per statement, one atomic D1 batch.
  // The marker prevents deleted examples from silently coming back on reload.
  for(let offset=0;offset<rows.length;offset+=10){
    const chunk=rows.slice(offset,offset+10)
    statements.push(db.prepare(`INSERT INTO prompt(id,type,content,imageUrl,createdAt)
      SELECT column1,column2,column3,NULL,column4 FROM (VALUES ${chunk.map(()=>'(?,?,?,?)').join(',')})
      WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?) ON CONFLICT(id) DO NOTHING`)
      .bind(...chunk.flatMap((row,index)=>[row.id,'TOEIC_PICTURE',JSON.stringify(row),now+offset+index]),seedKey))
  }
  statements.push(db.prepare('INSERT INTO system_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(seedKey,'1'))
  await db.batch(statements)
}
