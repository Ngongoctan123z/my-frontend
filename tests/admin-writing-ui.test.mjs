// Actual admin components with deterministic D1 responses. No live mutations.
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {createServer} from 'node:http'
import {readFile,readdir,mkdir} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'

const output='test-results/admin-writing-ui'
await mkdir(output,{recursive:true})
const cssNames=(await readdir('.next/static/css',{recursive:true})).filter(name=>name.endsWith('.css'))
const css=(await Promise.all(cssNames.map(name=>readFile(path.join('.next/static/css',name),'utf8')))).join('\n')
const entry=`
import React from 'react';import {createRoot} from 'react-dom/client';
import AdminPage from './app/quan-ly-he-thong-123/page';
import {PromptRelationsTab} from './src/components/admin/PromptRelationsTab';
import {WritingExamsAdmin} from './src/components/admin/WritingExamsAdmin';
import {buildWritingBank} from './src/data/writing-bank/catalog';
import {toeicPhotoPracticeSets} from './src/data/toeicPhotoBank';
import {toeicEmailBank} from './src/data/toeicEmails';
const bank=buildWritingBank(),photos=toeicPhotoPracticeSets(),emails=toeicEmailBank();
const essays=[{id:'essay-1',type:'TOEIC_ESSAY',content:'Write an opinion essay about teamwork.'},{id:'essay-2',type:'TOEIC_ESSAY',content:'Write an opinion essay about public transport.'}];
const prompts=[...bank.questions,...photos.map(set=>({id:set.id,type:'TOEIC_PICTURE',content:JSON.stringify(set)})),...emails,...essays];
for(const [type,count] of [['IELTS_TASK_1',18],['IELTS_TASK_2',100]])for(let i=1;i<=count;i++)prompts.push({id:type.toLowerCase()+'-'+i,type,content:type+' independent question '+i});
for(const [type,count] of [['TOPIK_53',3],['TOPIK_54',30],['HSK_5',3],['HSK_6',11]])for(let i=1;i<=count;i++)prompts.push({...bank.questions.find(row=>row.type===type),id:'unlinked-'+type+'-'+i});
const toeicSets=photos.map((photo,index)=>({id:'toeic-linked-'+String(index+1).padStart(2,'0'),title:'TOEIC linked set '+String(index+1).padStart(2,'0'),picturePromptId:photo.id,email6PromptId:emails.filter(row=>row.type==='TOEIC_EMAIL_6')[index%30].id,email7PromptId:emails.filter(row=>row.type==='TOEIC_EMAIL_7')[index%30].id,essayPromptId:essays[index%2].id,isPublished:true,valid:true}));
const counts=types=>Object.fromEntries(types.map(type=>[type,prompts.filter(row=>row.type===type).length]));
const relation=set=>({id:set.id,title:set.title,status:'complete',published:true,children:set.children,issues:[]});
const stored=(exam,types)=>{const sets=bank.sets.filter(set=>set.exam===exam).map(relation);return{exam,componentCounts:counts(types),completeSets:sets.length,brokenSets:0,hiddenSets:0,totalSets:sets.length,unlinkedPrompts:types.reduce((total,type)=>total+prompts.filter(row=>row.type===type&&row.id.startsWith('unlinked-')).length,0),relationMode:'stored',sets}};
const overview={source:'database',categories:{
 IELTS:{exam:'IELTS',componentCounts:counts(['IELTS_TASK_1','IELTS_TASK_2']),completeSets:0,brokenSets:0,hiddenSets:0,totalSets:0,unlinkedPrompts:118,relationMode:'legacy',legacyPairableSets:18,legacyLearnerSets:30,sets:[],note:'IELTS hiện chọn câu độc lập, chưa lưu liên kết bộ đề cố định.'},
 TOEIC:{exam:'TOEIC',componentCounts:counts(['TOEIC_PICTURE','TOEIC_EMAIL_6','TOEIC_EMAIL_7','TOEIC_RESPOND','TOEIC_ESSAY']),completeSets:50,brokenSets:0,hiddenSets:0,totalSets:50,unlinkedPrompts:0,relationMode:'stored',sets:toeicSets.map(row=>({id:row.id,title:row.title,status:'complete',published:true,children:{TOEIC_PICTURE:row.picturePromptId,TOEIC_EMAIL_6:row.email6PromptId,TOEIC_EMAIL_7:row.email7PromptId,TOEIC_ESSAY:row.essayPromptId},issues:[]}))},
 TOPIK:stored('TOPIK',['TOPIK_51','TOPIK_52','TOPIK_53','TOPIK_54']),
 HSK:{exam:'HSK',componentCounts:counts(['HSK_5','HSK_6']),completeSets:100,brokenSets:0,hiddenSets:0,totalSets:100,unlinkedPrompts:14,relationMode:'independent',sets:bank.sets.filter(set=>set.exam!=='TOPIK').map(relation),levels:{HSK_5:{completeSets:50,brokenSets:0,totalSets:50,unlinkedPrompts:3},HSK_6:{completeSets:50,brokenSets:0,totalSets:50,unlinkedPrompts:11}}}
}};
const loaded=set=>({...set,questions:Object.fromEntries(Object.entries(set.children).map(([key,id])=>{const row=bank.questions.find(question=>question.id===id);if(row.type==='TOPIK_53'){const parsed=JSON.parse(row.content);return[key,{id:row.id,content:parsed.text,imageUrl:row.imageUrl,imageDescription:parsed.imageDescription,source:parsed.source}]}return[key,row]}))});
window.fixtureRequests=[];window.fixtureOverview=overview;
window.fetch=async(url,options={})=>{const target=new URL(String(url),location.origin),type=target.searchParams.get('type');window.fixtureRequests.push({url:String(url),method:options.method||'GET'});
 if(target.pathname==='/api/ai-grader'){const body=JSON.parse(options.body||'{}');if(body.action!=='get_paired_full_test'||body.exam!=='IELTS')throw new Error('Unexpected grader action');const reports=prompts.filter(row=>row.type==='IELTS_TASK_1'),essays=prompts.filter(row=>row.type==='IELTS_TASK_2');return Response.json({sets:Array.from({length:30},(_,index)=>({id:index+1,title:'Bộ '+(index+1),part1:reports[index%reports.length],part2:essays[index]}))})}
 if(target.pathname!=='/api/admin')throw new Error('Unexpected service '+url);
 if(options.method&&options.method!=='GET')throw new Error('Unexpected admin mutation');
 if(type==='writing_overview')return window.failOverview?Response.json({error:'D1 overview fixture failed'},{status:503}):Response.json(window.fixtureOverview);
 if(type==='ielts_preview_sets'){const reports=prompts.filter(row=>row.type==='IELTS_TASK_1'),essays=prompts.filter(row=>row.type==='IELTS_TASK_2');return Response.json({source:'database',mode:'preview',sets:Array.from({length:30},(_,index)=>({id:index+1,title:'Cặp tham khảo #'+(index+1),part1:reports[index%reports.length],part2:essays[index]}))})}
 if(type==='prompts')return Response.json(prompts);
 if(type==='toeic_exam_sets')return Response.json(toeicSets);
 if(type==='writing_catalog')return Response.json({sets:bank.sets.filter(set=>set.exam===target.searchParams.get('exam'))});
 if(type==='writing_set'){const set=bank.sets.find(row=>row.id===target.searchParams.get('id')&&row.exam===target.searchParams.get('exam'));return set?Response.json({set:loaded(set)}):Response.json({error:'Missing linked set'},{status:404})}
 throw new Error('Unexpected admin request '+url);
};
const fixture=new URLSearchParams(location.search).get('fixture');
createRoot(document.getElementById('root')).render(React.createElement(fixture==='admin'?AdminPage:fixture==='exams'?WritingExamsAdmin:PromptRelationsTab));
`
const unrelated=['UsersTab','ModelsTab','SpeakingAdminTab','SeoTab','ChatTab','PaymentsTab']
const stubs={
 'next-auth/react':`export const useSession=()=>({data:{user:{email:'fixture@example.invalid'}},status:'authenticated'});export const signIn=()=>{};`,
 'next/link':`import React from 'react';export default function Link({children,...props}){return React.createElement('a',props,children)}`,
 'next/navigation':`export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({push(){},replace(){},refresh(){}});`,
}
const bundle=await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,jsx:'automatic',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(builder){
 builder.onResolve({filter:/^(next-auth\/react|next\/link|next\/navigation)$/},args=>({path:args.path,namespace:'stub'}))
 builder.onResolve({filter:new RegExp('/('+unrelated.join('|')+')$')},args=>({path:args.path.split('/').at(-1),namespace:'panel'}))
 builder.onLoad({filter:/.*/,namespace:'panel'},args=>({contents:'export function '+args.path+'(){return null}',loader:'js'}))
 builder.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:stubs[args.path],loader:'js',resolveDir:process.cwd()}))
 builder.onResolve({filter:/^@\//},args=>{const base=path.resolve(args.path.slice(2));return{path:['.tsx','.ts','/index.ts','/index.tsx'].map(extension=>base+extension).find(file=>existsSync(file))||base}})
}}]})
const server=createServer(async(req,res)=>{
 if(req.url.startsWith('/exam-media/topik/')){res.setHeader('Content-Type','image/webp');res.end(await readFile('public'+req.url));return}
 if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return}
 if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);return}
 res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><main id="root" class="mx-auto max-w-7xl p-3"></main><script src="/app.js"></script>')
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const browser=await chromium.launch()
let active
const open=async(width=375,query='')=>{const page=await browser.newPage({viewport:{width,height:900}});active=page;page.fixtureErrors=[];page.on('pageerror',error=>page.fixtureErrors.push(error.message));await page.route('https://images.unsplash.com/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9WQAAAAASUVORK5CYII=','base64')}));await page.goto('http://127.0.0.1:'+server.address().port+'/quan-ly-he-thong-123'+query);await page.getByRole('button',{name:'IELTS Writing',exact:true}).waitFor();await page.getByRole('button',{name:'TOPIK Writing',exact:true}).getByText('50 bộ đầy đủ',{exact:true}).waitFor();return page}
const layout=async page=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Page must fit viewport');assert.deepEqual(page.fixtureErrors,[])}
const category=async(page,name)=>{const button=page.getByRole('button',{name:name+' Writing',exact:true});await button.click();await button.getAttribute('aria-pressed').then(value=>assert.equal(value,'true'));return button}
const noFakeDeficit=async page=>{assert.doesNotMatch(await page.locator('body').innerText(),/Lệch\s+\d+\s+đề/,'Raw bank count imbalance is not a broken saved link')}
try{
 for(const width of [320,375,1280]){
  const page=await open(width)
  for(const name of ['IELTS','TOEIC','TOPIK','HSK'])assert.equal(await page.getByRole('button',{name:name+' Writing',exact:true}).count(),1)
  for(const name of ['TOEIC','TOPIK'])await page.getByRole('button',{name:name+' Writing',exact:true}).getByText('50 bộ đầy đủ',{exact:true}).waitFor()
  await page.getByRole('button',{name:'IELTS Writing',exact:true}).getByText('Ghép tự động',{exact:true}).waitFor()
  await noFakeDeficit(page);await layout(page);await page.screenshot({path:output+'/overview-'+width+'.png',fullPage:true})
  await category(page,'TOEIC');await page.getByRole('heading',{name:'Bộ đề TOEIC Writing',exact:true}).waitFor()
  await page.getByLabel('Tìm bộ đề TOEIC').fill('toeic-linked-50');await page.getByText('ID: toeic-linked-50',{exact:true}).waitFor()
  await page.getByRole('button',{name:'Bộ ảnh câu 1–5',exact:true}).click();await page.getByLabel('Tìm bộ ảnh TOEIC').fill('Bộ ảnh 50')
  await page.getByRole('button').filter({hasText:'Xem đủ 5 ảnh'}).click();const photosDialog=page.getByRole('dialog');await photosDialog.waitFor();assert.equal(await photosDialog.locator('article').count(),5);await layout(page);await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'Email câu 6–7',exact:true}).click();await page.getByText('30 câu 6 · 30 câu 7.',{exact:false}).waitFor()
  for(const number of [6,7]){await page.getByRole('button',{name:'Câu '+number+' · 30 email',exact:true}).click();await page.getByLabel('Tìm email TOEIC').fill('toeic-email-'+number+'-30');await page.getByRole('button').filter({hasText:'Xem email và yêu cầu →'}).click();await page.getByRole('dialog').waitFor();assert.match(await page.getByRole('dialog').innerText(),/Directions:/);await page.keyboard.press('Escape')}
  await category(page,'TOPIK');await page.getByLabel('Tìm bộ TOPIK hoặc HSK').fill('topik-practice-50');await page.getByRole('button').filter({hasText:'Xem đầy đủ đề & nguồn →'}).click()
  const topikDialog=page.getByRole('dialog');await topikDialog.waitFor();assert.equal(await topikDialog.locator('article').count(),4)
  for(const number of [51,52,53,54])await topikDialog.getByText('ID: topik-practice-50-'+number,{exact:true}).waitFor()
  const chart=topikDialog.locator('img');await chart.scrollIntoViewIfNeeded();await chart.evaluate(image=>image.complete&&image.naturalWidth?true:new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject}));assert.ok(await chart.evaluate(image=>image.naturalWidth)>100)
  assert.ok(await topikDialog.getByRole('link').count()>0);await layout(page);await page.screenshot({path:output+'/topik-all-four-'+width+'.png'});await page.keyboard.press('Escape')
  await category(page,'HSK')
  for(const level of [5,6]){await page.getByRole('button',{name:'HSK '+level,exact:true}).click();await page.getByLabel('Tìm bộ TOPIK hoặc HSK').fill('hsk'+level+'-practice-50');await page.getByRole('button').filter({hasText:'Xem đầy đủ đề & nguồn →'}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();assert.equal(await dialog.locator('article').count(),1);await dialog.getByText('ID: hsk'+level+'-practice-50-body',{exact:true}).waitFor();if(level===5){assert.equal(await dialog.locator('img').count(),1);for(const number of [91,98,99,100])assert.ok((await dialog.innerText()).includes(String(number)))}else assert.ok((await dialog.innerText()).length>1000);await layout(page);await page.keyboard.press('Escape')}
  await noFakeDeficit(page);await page.screenshot({path:output+'/hsk-independent-'+width+'.png',fullPage:true});await page.close()
 }
 console.log('PASS unified four-card Writing admin, real linked counts, nested TOEIC banks, all four TOPIK child IDs and independent HSK levels at 320/375/1280px')

 for(const [tab,expected,detail] of [['topik-hsk','TOPIK',null],['toeic-photos','TOEIC','Tìm bộ ảnh TOEIC'],['toeic-emails','TOEIC','Tìm email TOEIC'],['prompts','IELTS',null]]){
  const page=await open(375,'?fixture=admin&tab='+tab)
  const nav=page.getByRole('button',{name:'Quản Lý Writing',exact:true});assert.equal(await nav.count(),1)
  await page.waitForFunction(name=>document.querySelector('button[aria-label="'+name+' Writing"]')?.getAttribute('aria-pressed')==='true',expected)
  if(detail)await page.getByLabel(detail).waitFor()
  await page.getByRole('button',{name:'Quản Lý Speaking',exact:true}).click();await page.getByRole('button',{name:'Quản Lý Writing',exact:true}).click();await page.waitForFunction(name=>document.querySelector('button[aria-label="'+name+' Writing"]')?.getAttribute('aria-pressed')==='true',expected);if(detail)await page.getByLabel(detail).waitFor()
  for(const oldLabel of ['TOPIK & HSK · Kho 150 bộ','TOEIC · Email câu 6/7','TOEIC · Bộ ảnh câu 1–5','Kho Đề Writing'])assert.equal(await page.getByRole('button',{name:oldLabel,exact:true}).count(),0)
  await noFakeDeficit(page);await layout(page);await page.close()
 }
 {
  const page=await open(375,'?fixture=exams');await category(page,'TOPIK');await page.getByLabel('Tìm bộ TOPIK hoặc HSK').waitFor();assert.equal(await page.getByRole('button',{name:'TOPIK & HSK · 150 bộ',exact:true}).count(),0);await layout(page);await page.close()
 }
 {
  const page=await open(375,'?fixture=admin&tab=prompts&type=HSK_6')
  await page.getByLabel('Loại đề Writing',{exact:true}).waitFor();assert.equal(await page.getByLabel('Loại đề Writing',{exact:true}).inputValue(),'HSK_6')
  await page.getByRole('button',{name:'HSK 5',exact:true}).click();await page.waitForFunction(()=>document.querySelector('select[aria-label="Loại đề Writing"]')?.value==='HSK_5')
  await page.reload();await page.waitForFunction(()=>document.querySelector('select[aria-label="Loại đề Writing"]')?.value==='HSK_5')
  assert.equal(new URL(page.url()).searchParams.get('type'),null);await layout(page);await page.close()
 }
 console.log('PASS legacy admin deep links and former exam-management component resolve into the same unified Writing screen')
 {
  const page=await open();await category(page,'TOPIK');await page.evaluate(()=>window.failOverview=true);await page.getByRole('button',{name:'Làm mới',exact:true}).click();await page.getByRole('alert').filter({hasText:'D1 overview fixture failed'}).waitFor()
  await page.getByRole('button',{name:'TOPIK Writing',exact:true}).getByText('50 bộ đầy đủ',{exact:true}).waitFor();await page.evaluate(()=>window.failOverview=false);await page.getByRole('button',{name:'Làm mới',exact:true}).click();await page.getByRole('alert').waitFor({state:'detached'})
  await noFakeDeficit(page);await layout(page);assert.equal(await page.evaluate(()=>window.fixtureRequests.some(row=>row.url==='/api/admin'&&row.method!=='GET')),false);await page.close()
 }
 console.log('PASS failed overview refresh keeps prior counts, exposes the D1 error, retries and never sends an admin mutation')
}catch(error){if(active&&!active.isClosed())await active.screenshot({path:output+'/failure.png',fullPage:true});throw error}
finally{await browser.close();await new Promise(resolve=>server.close(resolve))}

