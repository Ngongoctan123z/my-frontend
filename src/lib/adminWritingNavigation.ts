export type WritingAdminSelection={exam:'IELTS'|'TOEIC'|'TOPIK'|'HSK';view:'sets'|'photos'|'emails'|'questions';promptType?:string}
export function writingAdminSelection(query:URLSearchParams):WritingAdminSelection{
 const category=(query.get('exam')||'').toUpperCase(),hskLevel=category==='HSK_5'||category==='HSK_6',tab=query.get('tab')||''
 const requested=query.get('type')||undefined,inferred=requested?.startsWith('HSK_')?'HSK':requested?.startsWith('TOPIK_')?'TOPIK':requested?.startsWith('TOEIC_')?'TOEIC':requested?.startsWith('IELTS_')?'IELTS':undefined
 let exam:WritingAdminSelection['exam']=['IELTS','TOEIC','TOPIK','HSK'].includes(category)?category as WritingAdminSelection['exam']:hskLevel?'HSK':inferred||'IELTS'
 let view:WritingAdminSelection['view']=['sets','photos','emails','questions'].includes(query.get('view')||'')?query.get('view') as WritingAdminSelection['view']:'sets'
 if(tab==='toeic-photos'){exam='TOEIC';view='photos'}
 if(tab==='toeic-emails'){exam='TOEIC';view='emails'}
 if(tab==='topik-hsk'&&!['IELTS','TOEIC','TOPIK','HSK'].includes(category)&&!hskLevel&&!inferred)exam='TOPIK'
 if(tab==='prompts')view='questions'
 if(exam!=='TOEIC'&&(view==='photos'||view==='emails'))view='sets'
 const explicitLevel=query.get('level')
 const promptType=exam==='HSK'?(explicitLevel==='HSK_5'||explicitLevel==='HSK_6'?explicitLevel:requested==='HSK_6'||category==='HSK_6'?'HSK_6':'HSK_5'):requested
 return {exam,view,promptType}
}
