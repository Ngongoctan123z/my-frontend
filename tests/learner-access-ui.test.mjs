// Real learner UI with deterministic authentication and network fixtures.
// Public shared links deliberately remain usable without an account.
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const output = 'test-results/grader-ui/learner-access'
await mkdir(output, { recursive: true })
const css = (await Promise.all((await readdir('.next/static/css', { recursive: true })).filter(name => name.endsWith('.css')).map(name => readFile(path.join('.next/static/css', name), 'utf8')))).join('\n')
const entry = `
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {AiGraderClient} from './app/ai-grader/ielts/AiGraderClient';
import {ToeicGraderClient} from './app/ai-grader/toeic/ToeicGraderClient';
import {TopikGraderClient} from './app/ai-grader/topik/TopikGraderClient';
import {HskGraderClient} from './app/ai-grader/hsk/HskGraderClient';
import {SpeakingClient} from './app/speaking/SpeakingClient';
import {SharedExamClient} from './app/shared/[id]/SharedExamClient';
import {StudentManagementModal} from './src/components/common/StudentManagementModal';
import {ShareExamModal} from './src/components/common/ShareExamModal';
import {StudentAccessButton} from './src/components/common/StudentAccessButton';
import * as prompts from './src/data/fallbackPrompts';
import {fallbackToeicExamSets} from './src/lib/toeicExamSets';
import {toeicPhotoPracticeSets} from './src/data/toeicPhotoBank';
import {toeicEmailBank} from './src/data/toeicEmails';
import {buildWritingBank} from './src/data/writing-bank/catalog';
import {fallbackCatalog} from './src/lib/speaking';
window.requests=[];window.signIns=[];window.historyReads=0;window.microphoneRequests=0;
const params=new URLSearchParams(location.search);
window.authState=params.get('auth')||'guest';
window.setAuth=value=>{window.authState=value;window.dispatchEvent(new Event('fixture-auth'))};
window.confirm=()=>true;
window.navigator.mediaDevices.getUserMedia=async()=>{window.microphoneRequests++;throw new Error('Guests must not request a microphone')};
window.copiedText='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedText=text}}});
const writing=buildWritingBank();
const publicPrompt=row=>row.type==='TOPIK_53'?{id:row.id,imageUrl:row.imageUrl,...JSON.parse(row.content),content:JSON.parse(row.content).text}:row;
const linkedToeic=fallbackToeicExamSets().map((set,index)=>({...set,id:'linked-'+index,picturePromptId:'pictures-'+index,part1:{...set.part1,id:'email6-'+index},email7:{...set.email7,id:'email7-'+index},part2:{...set.part2,id:'essay-'+index}}));
const score={overallBand:6,scoreScale:9,detailedFeedback:'Shared answer received.',criteria:{taskResponse:{score:6,feedback:'Relevant answer'},coherenceCohesion:{score:6,feedback:'Organised'},lexicalResource:{score:6,feedback:'Clear words'},grammaticalRange:{score:6,feedback:'Clear sentences'}},corrections:[]};
const submissions=[{id:'submission-one',sharedExamId:'public-share',studentName:'Linh Nguyen',studentPhone:'0901234567',studentEmail:'linh@example.test',studentEssay:'A real learner answer for review.',examType:'IELTS_TASK_2',examContent:'Discuss the benefits of reading.',gradingResult:score,createdAt:Date.now()}];
window.fetch=async(url,options={})=>{
 const body=options.body?JSON.parse(options.body):{};window.requests.push({url:String(url),body});
 if(String(url)==='/api/profile')return Response.json({plan:window.authState==='pro'?'pro':'plus',usageCount:1,limit:50});
 if(String(url)==='/api/shared-exams/submit')return window.failShared?Response.json({error:'Temporary shared grading failure'},{status:503}):Response.json({success:true,result:score});
 if(String(url)==='/api/shared-exams')return Response.json({id:'public-share',expiresAt:Date.now()+86400000});
 if(String(url)==='/api/shared-exams/submissions')return Response.json({submissions});
 if(body.action==='catalog')return Response.json({catalog:fallbackCatalog(body.examType),source:'fixture'});
 if(body.action==='get_writing_catalog')return Response.json({sets:writing.sets.filter(set=>set.exam===body.exam)});
 if(body.action==='get_writing_set'){const set=writing.sets.find(set=>set.id===body.id);return Response.json({set:{...set,questions:Object.fromEntries(Object.entries(set.children).map(([key,id])=>[key,publicPrompt(writing.questions.find(q=>q.id===id))]))}})}
 if(body.action==='get_paired_full_test')return Response.json({sets:body.exam==='TOEIC'?linkedToeic:prompts[body.exam+'_PAIRED_SETS']});
 if(body.action==='generate_prompt_batch')return Response.json({prompts:body.type==='TOEIC_PICTURE'?toeicPhotoPracticeSets().slice(0,3).map(set=>({content:JSON.stringify(set)})):['TOEIC_EMAIL_6','TOEIC_EMAIL_7'].includes(body.type)?toeicEmailBank().filter(row=>row.type===body.type).slice(0,3):prompts[body.type+'_FALLBACKS']||[]});
 return Response.json({count:0,limit:50,plan:'plus'});
};
function Teacher(){const [students,setStudents]=useState(false),[share,setShare]=useState(false),[empty,setEmpty]=useState(false);return <><div className="flex flex-col items-start gap-3 p-4 sm:flex-row"><StudentAccessButton onClick={()=>setStudents(true)} isEn={false}/><button onClick={()=>setShare(true)}>Chia sẻ đề thi</button><button onClick={()=>setEmpty(value=>!value)}>Đổi dữ liệu kiểm tra</button></div><StudentManagementModal isOpen={students} onClose={()=>setStudents(false)} onCreateShare={()=>setShare(true)} loading={false} studentsData={empty?[]:submissions}/><ShareExamModal isOpen={share} onClose={()=>setShare(false)} onConfirm={async(requirePhone,requireEmail)=>{window.shareOptions={requirePhone,requireEmail};if(window.failCreate)throw new Error('Temporary create failure');return location.origin+'/shared/public-share'}}/></>}
const mode=params.get('mode'),exam=params.get('exam')||'ielts';
const shared={id:'public-share',examType:'IELTS_TASK_2',content:'Discuss the benefits of reading and explain your opinion.\\n\\nContext: SHARED_PRIVATE_AI_CONTEXT_6391',imageDescription:'SHARED_PRIVATE_AI_CONTEXT_6391',creatorId:'private-owner@example.invalid',requirePhone:true,requireEmail:false,expiresAt:Date.now()+86400000};
const root=createRoot(document.getElementById('root'));
root.render(mode==='shared'?<SharedExamClient exam={shared}/>:mode==='teacher'?<Teacher/>:mode==='speaking'?<SpeakingClient/>:React.createElement({ielts:AiGraderClient,toeic:ToeicGraderClient,topik:TopikGraderClient,hsk:HskGraderClient}[exam]));
`
const fixtures = {
  'next-auth/react': `import {useEffect,useState,useMemo} from 'react';export function useSession(){const [value,setValue]=useState(window.authState);useEffect(()=>{const update=()=>setValue(window.authState);window.addEventListener('fixture-auth',update);return()=>window.removeEventListener('fixture-auth',update)},[]);return useMemo(()=>value==='guest'?{data:null,status:'unauthenticated'}:value==='loading'?{data:null,status:'loading'}:{data:{user:{email:'owner@example.test',name:'Share owner'}},status:'authenticated'},[value])}export const signIn=(provider,options)=>window.signIns.push({provider,options});`,
  'next/navigation': `export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);`,
  'next/link': `import React from 'react';export default function Link({prefetch,...props}){return React.createElement('a',props)}`,
  'next/dynamic': `import React from 'react';export default function dynamic(loader){const C=React.lazy(()=>loader().then(module=>({default:module})));return props=>React.createElement(React.Suspense,{fallback:null},React.createElement(C,props))}`,
  '@/src/utils/indexedDB': `export const getEssayHistory=async()=>{window.historyReads++;return[]};export const saveEssayHistory=async()=>{};export const clearEssayHistory=async()=>{};`,
  '@/src/components/common/GradingResultModal': `import React from 'react';export const GradingResultModal=({isOpen,result,onClose})=>isOpen&&result?React.createElement('div',{role:'dialog','aria-label':'Shared grading result'},React.createElement('p',null,result.detailedFeedback),React.createElement('button',{onClick:onClose},'Close result')):null;`,
}
const bundle = await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'learner-access-fixtures',setup(builder){
  builder.onResolve({filter:/.*/},args=>{
    if(fixtures[args.path])return{path:args.path,namespace:'fixture'}
    if(args.path.startsWith('@/')){const base=path.resolve(args.path.slice(2));return{path:['.tsx','.ts','/index.ts','/index.tsx'].map(ext=>base+ext).find(candidate=>existsSync(candidate))||base}}
  });builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:fixtures[args.path],loader:'js',resolveDir:process.cwd()}));
}}]})
const server = createServer((request,response)=>{
  if(request.url==='/app.js'){response.setHeader('Content-Type','text/javascript');response.end(bundle.outputFiles[0].text);return}
  if(request.url==='/style.css'){response.setHeader('Content-Type','text/css');response.end(css);return}
  response.setHeader('Content-Type','text/html');response.end('<!doctype html><html lang="vi"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body class="bg-slate-50"><main id="root" class="mx-auto max-w-7xl px-3 py-4"></main><script src="/app.js"></script></body></html>')
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const origin='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true})
let activePage
const assertLayout=async page=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Learner page must fit the viewport')
const assertNoPaidCalls=async page=>assert.equal(await page.evaluate(()=>window.requests.some(request=>['grade_essay','grade','begin_submission','submit_audio'].includes(request.body.action)||request.url.includes('/shared-exams/submit'))),false,'Guest viewing must not grade or submit')
try{
 for(const width of [320,1280]){
  for(const exam of ['ielts','toeic','topik','hsk']){
   const page=await browser.newPage({viewport:{width,height:920}});activePage=page;const errors=[];page.on('pageerror',error=>errors.push(error.message))
   await page.goto(origin+'/ai-grader/'+exam+'?exam='+exam)
   const gate=page.locator('[data-practice-access-gate]');await gate.waitFor()
   assert.ok((await page.locator('main').innerText()).length>150,'Guest sees prompt content and task guidance')
   assert.equal(await page.locator('textarea:visible').evaluateAll(nodes=>nodes.some(node=>!node.disabled&&!node.readOnly)),false,'Guest answer editors are locked')
   assert.equal(await page.evaluate(()=>window.historyReads),0,'Guest cannot read private history')
   await assertNoPaidCalls(page);await assertLayout(page)
   await gate.getByRole('button').first().click();await page.waitForFunction(()=>window.signIns.length===1)
   assert.equal(await page.evaluate(()=>window.signIns[0].options?.callbackUrl),page.url(),'Login returns to the current prompt')
   assert.deepEqual(errors,[])
   await page.screenshot({path:output+'/'+exam+'-guest-'+width+'.png',fullPage:true});await page.close()
  }
  const speaking=await browser.newPage({viewport:{width,height:920}});activePage=speaking;await speaking.goto(origin+'/speaking?mode=speaking')
  await speaking.locator('[data-practice-access-gate]').waitFor();assert.equal(await speaking.getByRole('button',{name:'Dừng thu âm',exact:true}).count(),0)
  assert.equal(await speaking.evaluate(()=>window.microphoneRequests),0,'Guest cannot request microphone access')
  await speaking.locator('[data-practice-access-gate]').getByRole('button').first().click();await speaking.waitForFunction(()=>window.signIns.length===1);await assertLayout(speaking);await speaking.close()

  const student=await browser.newPage({viewport:{width,height:920}});activePage=student;await student.goto(origin+'/shared/public-share?mode=shared')
  await student.getByRole('heading',{level:1}).waitFor();assert.ok(!(await student.locator('body').innerText()).includes('SHARED_PRIVATE_AI_CONTEXT_6391'));assert.equal(await student.locator('[data-practice-access-gate]').count(),0,'Public shared links must not require account login')
  await student.getByRole('textbox',{name:/Họ và tên|Full name/i}).fill('Linh Nguyen')
  await student.getByRole('textbox',{name:/Số điện thoại|Phone/i}).fill('0901234567')
  await student.locator('textarea').fill('Reading helps people learn because books expose them to different perspectives. '.repeat(30))
  await student.evaluate(()=>window.failShared=true);await student.getByRole('button',{name:/Nộp bài|Submit/i}).click();await student.getByText('Temporary shared grading failure',{exact:true}).waitFor()
  assert.ok((await student.locator('textarea').inputValue()).length>250,'Failed shared submission preserves the answer')
  await student.evaluate(()=>window.failShared=false);await student.getByRole('button',{name:/Nộp bài|Submit/i}).click();await student.getByRole('dialog',{name:'Shared grading result'}).waitFor()
  const submitted=await student.evaluate(()=>window.requests.filter(request=>request.url==='/api/shared-exams/submit'))
  assert.equal(submitted.length,2);assert.equal(submitted[1].body.sharedExamId,'public-share');assert.equal(submitted[1].body.studentName,'Linh Nguyen');assert.equal(submitted[1].body.studentPhone,'0901234567');assert.equal(submitted[1].body.creatorId,undefined,'Student cannot choose which owner is charged')
  assert.equal(await student.evaluate(()=>window.signIns.length),0,'Shared student completed without signing in')
  await student.getByRole('button',{name:'Close result',exact:true}).click();await assertLayout(student);await student.screenshot({path:output+'/shared-student-'+width+'.png',fullPage:true});await student.close()
 }
 for(const [exam,plan] of [['ielts','plus'],['toeic','pro'],['topik','plus'],['hsk','pro']]){
  const owner=await browser.newPage({viewport:{width:1280,height:920}});activePage=owner
  await owner.goto(origin+'/ai-grader/'+exam+'?exam='+exam+'&auth='+plan)
  if(exam==='toeic'){
   await owner.getByRole('button',{name:/Quản lý học viên|Manage students/i}).first().click()
   const picturesManagement=owner.getByRole('dialog');await picturesManagement.getByText(/Câu theo ảnh hiện chưa hỗ trợ liên kết|Picture questions do not support shared links/i).waitFor()
   assert.equal(await picturesManagement.getByRole('button',{name:/Tạo liên kết giao bài|Create assignment link/i}).count(),0,'Picture questions must not silently share a different prompt')
   await owner.keyboard.press('Escape')
   await owner.getByRole('button',{name:/Email 1/}).first().click()
  }
  await owner.getByRole('button',{name:/Quản lý học viên|Manage students/i}).first().click()
  const management=owner.getByRole('dialog');await management.waitFor()
  assert.equal(await owner.locator('[data-practice-access-gate]').count(),0,'Authenticated owners can use the answer editor')
  await management.getByRole('button',{name:/Tạo liên kết giao bài|Create assignment link/i}).click()
  const sharing=owner.getByRole('dialog');await sharing.getByRole('button',{name:/Tạo.*liên kết|Create assignment link/i}).waitFor()
  await sharing.getByRole('button',{name:/Tạo.*liên kết|Create assignment link/i}).click()
  const created=sharing.getByRole('textbox');await created.waitFor()
  assert.ok((await created.inputValue()).endsWith('/shared/public-share'),'Plus and Pro owners can create guest assignment links from their grader')
  assert.equal(await owner.evaluate(()=>window.signIns.length),0)
  await assertLayout(owner)
  await owner.keyboard.press('Escape')
  const privateAnswer=owner.locator('textarea:visible:not([disabled]):not([readonly])').last()
  if(await privateAnswer.count())await privateAnswer.fill('Private learner draft')
  await owner.evaluate(()=>window.setAuth('guest'))
  await owner.locator('[data-practice-access-gate]').waitFor()
  assert.equal(await owner.locator('textarea:visible').evaluateAll(nodes=>nodes.some(node=>!node.disabled&&!node.readOnly)),false,'Logging out locks the answer editor immediately')
  assert.equal(await owner.locator('textarea').evaluateAll(nodes=>nodes.some(node=>node.value.includes('Private learner draft'))),false,'Logging out clears private answers')
  assert.equal(await owner.getByRole('dialog').count(),0,'Logging out closes private student and sharing dialogs')
  await owner.close()
 }
 for(const width of [320,1280]){
 const teacher=await browser.newPage({viewport:{width,height:920}});activePage=teacher;await teacher.goto(origin+'/ai-grader/ielts?mode=teacher&auth=plus')
 await teacher.getByRole('button',{name:/Học viên|Students/i}).first().click();const studentsDialog=teacher.getByRole('dialog');await studentsDialog.waitFor();await studentsDialog.getByText('Linh Nguyen',{exact:true}).waitFor();await assertLayout(teacher)
 await studentsDialog.getByRole('button',{name:'Xem bài chi tiết',exact:true}).click();await studentsDialog.getByText('A real learner answer for review.',{exact:true}).waitFor()
 await teacher.screenshot({path:output+'/teacher-submissions-'+width+'.png',fullPage:true})
 const search=studentsDialog.getByRole('searchbox');await search.fill('does-not-exist');await studentsDialog.getByText(/Không tìm thấy|Chưa có bài|No submissions|No results/i).first().waitFor();await search.fill('Linh');await studentsDialog.getByText('Linh Nguyen',{exact:true}).waitFor()
 await teacher.keyboard.press('Escape');await studentsDialog.waitFor({state:'hidden'});await teacher.getByRole('button',{name:'Chia sẻ đề thi',exact:true}).click();const shareDialog=teacher.getByRole('dialog');await shareDialog.waitFor()
 await shareDialog.getByRole('checkbox',{name:/Số điện thoại|Phone/i}).check()
 await teacher.evaluate(()=>window.failCreate=true);await shareDialog.getByRole('button',{name:/Tạo.*(link|liên kết)|Create/i}).click();await shareDialog.getByText('Temporary create failure',{exact:true}).waitFor()
 await teacher.evaluate(()=>window.failCreate=false);await shareDialog.getByRole('button',{name:/Tạo.*(link|liên kết)|Create/i}).click();const link=shareDialog.getByRole('textbox');await link.waitFor();assert.ok((await link.inputValue()).endsWith('/shared/public-share'));assert.equal(await link.getAttribute('readonly'),'')
 await shareDialog.getByRole('button',{name:/Sao chép|Copy/i}).click();await teacher.waitForFunction(()=>window.copiedText.endsWith('/shared/public-share'));await assertLayout(teacher)
 assert.deepEqual(await teacher.evaluate(()=>window.shareOptions),{requirePhone:true,requireEmail:false})
 await teacher.screenshot({path:output+'/teacher-share-link-'+width+'.png',fullPage:true})
 await teacher.keyboard.press('Escape');await shareDialog.waitFor({state:'hidden'});await teacher.screenshot({path:output+'/teacher-controls-'+width+'.png',fullPage:true});await teacher.close()
 }
 console.log('PASS guest prompt access, authenticated answer gates, public student submissions and teacher share controls')
}catch(error){if(activePage&&!activePage.isClosed())await activePage.screenshot({path:output+'/failure.png',fullPage:true}).catch(()=>{});await writeFile(output+'/failure.txt',String(error.stack||error));throw error}
finally{await browser.close();await new Promise(resolve=>server.close(resolve))}

