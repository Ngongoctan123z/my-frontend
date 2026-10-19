import { parseToeicPictures } from '@/src/data/toeicWriting'
import type { SpeakingD1, D1Statement } from '../speaking/store'
const marker='TOEIC_PHOTO_FULL_LINKS_V1'

// Add stable full-exam parents for the new photo groups. Emails 6/7 and essay 8
// stay together exactly as already approved in an existing published parent;
// they are referenced by ID, never randomly sampled or copied into new prompts.
export async function ensurePhotoFullSets(db:SpeakingD1){
 if(await db.prepare('SELECT value FROM system_config WHERE key=?').bind(marker).first())return
 const candidates=await db.prepare(`SELECT s.*,p.content AS pictureContent
  FROM writing_exam_set s JOIN prompt p ON p.id=s.picturePromptId AND p.type='TOEIC_PICTURE'
  JOIN prompt e6 ON e6.id=s.email6PromptId AND e6.type='TOEIC_RESPOND'
  JOIN prompt e7 ON e7.id=s.email7PromptId AND e7.type='TOEIC_RESPOND'
  JOIN prompt e ON e.id=s.essayPromptId AND e.type='TOEIC_ESSAY'
  WHERE s.isPublished=1 AND s.id NOT LIKE 'toeic-photo-full-%'
  AND s.email6PromptId<>s.email7PromptId AND e6.content<>e7.content
  AND length(trim(e6.content))>0 AND length(trim(e7.content))>0 AND length(trim(e.content))>0
  ORDER BY s.createdAt,s.id`).all()
 const groups=candidates.results.filter(row=>{try{parseToeicPictures(row.pictureContent);return true}catch{return false}})
 if(!groups.length)return
 const pictures=await db.prepare("SELECT id,content FROM prompt WHERE type='TOEIC_PICTURE' AND id LIKE 'toeic-photo-practice-%' ORDER BY id").all()
 const now=Date.now()
 const rows=pictures.results.flatMap(row=>{
  const match=/^toeic-photo-practice-(\d{2})$/.exec(row.id)
  if(!match||Number(match[1])<1||Number(match[1])>50)return []
  try{
   const picture=parseToeicPictures(row.content),group=groups[(Number(match[1])-1)%groups.length]
   return [{id:'toeic-photo-full-'+match[1],title:picture.title.replace('Bộ ảnh','Bộ đề')+' · Câu 1–8',picturePromptId:row.id,
    email6PromptId:group.email6PromptId,email7PromptId:group.email7PromptId,essayPromptId:group.essayPromptId}]
  }catch{return []}
 })
 const statements:D1Statement[]=[]
 for(let offset=0;offset<rows.length;offset+=10){
  const chunk=rows.slice(offset,offset+10)
  statements.push(db.prepare(`INSERT INTO writing_exam_set(id,title,picturePromptId,email6PromptId,email7PromptId,essayPromptId,isPublished,createdAt)
   SELECT column1,column2,column3,column4,column5,column6,1,column7 FROM (VALUES ${chunk.map(()=>'(?,?,?,?,?,?,?)').join(',')})
   WHERE NOT EXISTS(SELECT 1 FROM system_config WHERE key=?) ON CONFLICT(id) DO NOTHING`)
   .bind(...chunk.flatMap(row=>[row.id,row.title,row.picturePromptId,row.email6PromptId,row.email7PromptId,row.essayPromptId,now]),marker))
 }
 statements.push(db.prepare('INSERT INTO system_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING').bind(marker,'1'))
 await db.batch(statements)
}
