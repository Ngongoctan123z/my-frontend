// Actual React components; all services and browser speech events are local fixtures.
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {createServer} from 'node:http'
import {readFile,readdir,mkdir} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
const output='test-results/phase2-ui';await mkdir(output,{recursive:true})
const names=(await readdir('.next/static/css',{recursive:true})).filter(name=>name.endsWith('.css'))
const css=(await Promise.all(names.map(name=>readFile(path.join('.next/static/css',name),'utf8')))).join('\n')
const entry=`
import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {ToeicPictureBankAdmin} from './src/components/admin/ToeicPictureBankAdmin';
import {ToeicEmailBankAdmin} from './src/components/admin/ToeicEmailBankAdmin';
import {WritingBankAdmin} from './src/components/admin/WritingBankAdmin';
import {buildWritingBank} from './src/data/writing-bank/catalog';
const writing=buildWritingBank();
const writingSet=set=>({...set,questions:Object.fromEntries(Object.entries(set.children).map(([key,id])=>{const row=writing.questions.find(q=>q.id===id);return[key,row.type==='TOPIK_53'?{...JSON.parse(row.content),content:JSON.parse(row.content).text,id:row.id,imageUrl:row.imageUrl}:row]}))});
import {toeicEmailBank} from './src/data/toeicEmails';
import {ToeicExamSetsAdmin} from './src/components/admin/ToeicExamSetsAdmin';
import {ChatWidget} from './src/components/chat/ChatWidget';
import {SpeakingRecorder} from './src/components/speaking/SpeakingRecorder';
import {toeicPhotoPracticeSets} from './src/data/toeicPhotoBank';
import {fallbackToeicExamSets} from './src/lib/toeicExamSets';
import {buildSpeakingSet} from './src/lib/speaking';
window.requests=[];const photos=toeicPhotoPracticeSets();
const prompts=[...photos.map(set=>({id:set.id,type:'TOEIC_PICTURE',content:JSON.stringify(set)})),...toeicEmailBank()];
const original=fallbackToeicExamSets()[0];for(const [id,type,content] of [['email6','TOEIC_RESPOND',original.part1.content],['email7','TOEIC_RESPOND',original.email7.content],['essay','TOEIC_ESSAY',original.part2.content]])prompts.push({id,type,content});
window.fetch=async(url,options={})=>{let body=options.body?JSON.parse(options.body):{};window.requests.push({url,body,method:options.method||'GET'});
 if(String(url).includes('translate_a'))return Response.json(['Xin chào']);
 if(String(url)==='/api/chat')return Response.json([]);
 if(String(url).includes('/api/admin')){
  const query=new URL(url,location.origin).searchParams;
  if(query.get('type')==='writing_catalog')return Response.json({sets:writing.sets.filter(s=>s.exam===query.get('exam'))});
  if(query.get('type')==='writing_set')return Response.json({set:writingSet(writing.sets.find(s=>s.id===query.get('id')))});
  if(String(url).includes('type=prompts'))return Response.json(prompts);
  const rows=JSON.parse(localStorage.getItem('linked-fixture')||'[]');
  if(!options.method)return Response.json(rows);
  if(window.failSave)return Response.json({error:'D1 save fixture failed'},{status:503});
  if(body.action==='add_toeic_exam_set'){const row={...body.payload,id:'server-linked-1',valid:true};rows.push(row);localStorage.setItem('linked-fixture',JSON.stringify(rows));return Response.json(row)}
  const index=rows.findIndex(row=>row.id===body.payload.id);rows[index]={...rows[index],...body.payload,valid:true};localStorage.setItem('linked-fixture',JSON.stringify(rows));return Response.json(rows[index]);
 }
 throw new Error('Unexpected service '+url);
};
function RecorderFixture(){const[clip,setClip]=useState();return <SpeakingRecorder question={buildSpeakingSet('IELTS_SPEAKING','PART_2',undefined,undefined,()=>0)[0]} clip={clip} strict={false} autoStart={false} canRecord={true} busy={false} processing='' footer={<span>Local fixture</span>} onLogin={()=>{}} onComplete={next=>{window.savedClip=next;setClip(next)}} onClear={()=>setClip(undefined)} onActiveChange={()=>{}} onStartExam={()=>{}} onAutoError={()=>{}}/>}
const mode=new URL(location.href).searchParams.get('mode');createRoot(document.getElementById('root')).render(React.createElement({writing:WritingBankAdmin,emails:ToeicEmailBankAdmin,photos:ToeicPictureBankAdmin,sets:ToeicExamSetsAdmin,tools:ChatWidget,recorder:RecorderFixture}[mode]));
`
const stubs={
 'next-auth/react':`export const useSession=()=>({data:{user:{email:'fixture@example.invalid'}},status:'authenticated'});export const signIn=()=>{};`,
 'next/navigation':`export const usePathname=()=>location.pathname;`,
 'next/dynamic':`import React from 'react';export default function dynamic(loader){const C=React.lazy(()=>loader().then(component=>({default:component})));return props=>React.createElement(React.Suspense,{fallback:null},React.createElement(C,props))}`,
}
const bundle=await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,jsx:'automatic',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/^(next-auth\/react|next\/navigation|next\/dynamic)$/},args=>({path:args.path,namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},args=>({contents:stubs[args.path],loader:'js',resolveDir:process.cwd()}));b.onResolve({filter:/^@\//},args=>{const base=path.resolve(args.path.slice(2));return {path:['.tsx','.ts','/index.ts','/index.tsx'].map(ext=>base+ext).find(p=>existsSync(p))||base}})}}]})
const server=createServer(async(req,res)=>{if(req.url.startsWith('/exam-media/topik/')){res.setHeader('Content-Type','image/webp');res.end(await readFile('public'+req.url));return}if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text)}else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css)}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><main id="root" class="mx-auto max-w-6xl p-3"></main><script src="/app.js"></script>')}})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({proxy:process.env.EXAM_TEST_PROXY?{server:process.env.EXAM_TEST_PROXY,bypass:"127.0.0.1,localhost"}:undefined});let active
const open=async(mode,width=375)=>{const page=await browser.newPage({viewport:{width,height:900},ignoreHTTPSErrors:!!process.env.EXAM_TEST_PROXY});active=page;page.on('pageerror',error=>{page.fixtureErrors??=[];page.fixtureErrors.push(error.message)});await page.goto('http://127.0.0.1:'+server.address().port+'/?mode='+mode);return page}
const layout=async page=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(page.fixtureErrors||[],[])}
try{
 for(const width of [320,375,1280]){
  const page=await open('writing',width)
  for(const [exam,label] of [['TOPIK','TOPIK II PBT'],['HSK_5','HSK 5 · 2.0'],['HSK_6','HSK 6 · 2.0']]){
   await page.getByRole('button',{name:label,exact:true}).click()
   await page.getByText(label+' · 50 bộ đang có đầy đủ câu thành phần',{exact:true}).waitFor()
   await page.getByLabel('Tìm bộ TOPIK hoặc HSK').fill(exam==='TOPIK'?'topik-practice-50':exam==='HSK_5'?'hsk5-practice-50':'hsk6-practice-50')
   await page.getByRole('button').filter({hasText:'Xem đầy đủ đề & nguồn →'}).click()
   const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.locator('article').first().waitFor();assert.equal(await dialog.locator('article').count(),exam==='TOPIK'?4:1)
   if(exam==='TOPIK'){const image=dialog.locator('img');await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.complete&&img.naturalWidth?true:new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject}));assert.ok(await image.evaluate(img=>img.naturalWidth)>100)}
   if(exam==='HSK_5'){assert.equal(await dialog.locator('img').count(),1);assert.ok((await dialog.textContent()).includes('91'))}
   if(exam==='HSK_6')assert.ok((await dialog.textContent()).length>1000)
   assert.ok(await dialog.getByRole('link').count()>0);await layout(page)
   await page.screenshot({path:output+'/writing-'+exam+'-'+width+'.png'});await page.keyboard.press('Escape')
  }
  await page.close()
 }
 console.log('PASS 150 Writing sets, final-set search, linked questions, real chart loading and source previews at 320/375/1280px')
 for(const width of [320,375,1280]){
  const page=await open('photos',width)
  await page.getByRole('button',{name:/TOEIC Writing · Bộ ảnh 01/}).click()
  const dialog=page.getByRole('dialog');assert.equal(await dialog.locator('article').count(),5)
  assert.equal(await dialog.getByText('Câu mẫu tham khảo',{exact:true}).count(),5)
  assert.equal(await dialog.getByRole('link',{name:'Unsplash',exact:true}).count(),5)
  for(const image of await dialog.locator('img').all()){await image.scrollIntoViewIfNeeded();assert.ok(await image.evaluate(img=>img.complete?img.naturalWidth>0:new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),20000);img.onload=()=>{clearTimeout(timer);resolve(true)};img.onerror=()=>{clearTimeout(timer);resolve(false)}})),'Real photo did not load')}
  await dialog.locator('article').first().scrollIntoViewIfNeeded()
  await layout(page);await page.screenshot({path:output+'/photos-'+width+'.png'})
  await page.keyboard.press('Escape');await page.getByLabel('Tìm bộ ảnh TOEIC').fill('Bộ ảnh 50')
  assert.equal(await page.getByRole('button',{name:/Xem đủ 5 ảnh/}).count(),1)
  await page.close()
 }
 console.log('PASS 50-set photo bank, five real images/examples/credits, search and mobile dialogs')
 {
  const page=await open('sets');await page.getByRole('button',{name:'Ghép đề',exact:true}).click()
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Tên bộ đề',{exact:true}).fill('Saved linked exam')
  await dialog.getByLabel('Câu 1–5 · Bộ 5 ảnh',{exact:false}).selectOption('toeic-photo-practice-01')
  await dialog.getByLabel('Câu 6 · Email thứ nhất',{exact:false}).selectOption('email6')
  await dialog.getByLabel('Câu 7 · Email thứ hai',{exact:false}).selectOption('email7')
  await dialog.getByLabel('Câu 8 · Bài luận',{exact:false}).selectOption('essay')
  await page.evaluate(()=>window.failSave=true);await dialog.getByRole('button',{name:'Lưu bộ đề',exact:true}).click();await dialog.getByRole('alert').waitFor()
  assert.equal(await dialog.getByLabel('Tên bộ đề',{exact:true}).inputValue(),'Saved linked exam')
  await page.evaluate(()=>window.failSave=false);await dialog.getByRole('button',{name:'Lưu bộ đề',exact:true}).click()
  await page.getByText('ID: server-linked-1',{exact:true}).waitFor();await page.reload();await page.getByText('ID: server-linked-1',{exact:true}).waitFor()
  await page.getByRole('button',{name:'Sửa liên kết',exact:true}).click();await page.getByRole('dialog').getByLabel('Tên bộ đề',{exact:true}).fill('Edited linked exam')
  await page.getByRole('dialog').getByRole('button',{name:'Lưu bộ đề',exact:true}).click();await page.getByRole('heading',{name:'Edited linked exam'}).waitFor()
  assert.equal(await page.evaluate(()=>window.requests.find(r=>r.body.action==='update_toeic_exam_set').body.payload.id),'server-linked-1')
  await layout(page);await page.screenshot({path:output+'/linked-admin.png',fullPage:true});await page.close()
 }
 console.log('PASS explicit linked admin child IDs, failed-save retention, server ID edits and reload')
 for(const width of [320,375,1280]){
  const page=await open('emails',width)
  await page.getByText('30 câu 6 · 30 câu 7.',{exact:false}).waitFor()
  for(const number of [6,7]){
   await page.getByRole('button',{name:'Câu '+number+' · 30 email',exact:true}).click()
   await page.getByLabel('Tìm email TOEIC').fill('toeic-email-'+number+'-30')
   const card=page.getByRole('button').filter({hasText:'Xem email và yêu cầu →'});assert.equal(await card.count(),1);await card.click()
   const dialog=page.getByRole('dialog');const text=await dialog.textContent();for(const field of ['From:','Subject:','Directions:','10 minutes'])assert.ok(text.includes(field),field)
   await layout(page);await page.screenshot({path:output+'/email-'+number+'-'+width+'.png'});await page.keyboard.press('Escape');await page.getByLabel('Tìm email TOEIC').fill('')
  }
  await page.close()
 }
 console.log('PASS all 60 separate emails, position filters, source directions, search and mobile previews')

 for(const width of [320,375,1280]){
  const page=await open('tools',width)
  for(const [label,title] of [['Máy tính Casio Online','Máy tính khoa học'],['Dịch thuật nhanh','Dịch thuật nhanh'],['Hỗ trợ & Chat với Admin','Hỗ trợ VNDocs']]){
   const trigger=page.getByRole('button',{name:label,exact:true});await trigger.click();const panel=page.getByRole('dialog',{name:title,exact:true});await panel.waitFor()
   if(title==='Máy tính khoa học'){for(const value of ['7','+','8','='])await panel.getByRole('button',{name:value,exact:true}).click();assert.ok((await panel.textContent()).includes('15'))}
   if(title==='Dịch thuật nhanh'){await panel.getByLabel('Văn bản cần dịch').fill('Hello');await panel.getByRole('button',{name:'Dịch ngay',exact:true}).click();await panel.getByText('Xin chào',{exact:true}).waitFor()}
   if(title==='Hỗ trợ VNDocs')await panel.getByLabel('Tin nhắn hỗ trợ').fill('Draft only; do not send')
   await layout(page);await page.screenshot({path:output+'/'+label+'-'+width+'.png'})
   await page.keyboard.press('Escape');await panel.waitFor({state:'detached'})
  }
  assert.equal(await page.evaluate(()=>window.requests.some(r=>r.url==='/api/chat'&&r.method==='POST')),false)
  await page.close()
 }
 console.log('PASS actual calculator, translation, support draft, responsive panels and Escape close')
 {
  const page=await browser.newPage({viewport:{width:375,height:900}});active=page
  await page.clock.install();await page.goto('http://127.0.0.1:'+server.address().port+'/?mode=tools')
  const hint=page.getByText('giữ để xoá',{exact:true});await hint.waitFor();await page.clock.runFor(2100);assert.equal(await hint.count(),0)
  await page.reload();assert.equal(await hint.count(),0);await page.clock.runFor(299000);assert.equal(await hint.count(),0);await page.clock.runFor(1000);assert.equal(await hint.count(),1)
  await page.clock.runFor(2100);assert.equal(await hint.count(),0);await page.close()
 }
 console.log('PASS hold hint shows for two seconds, survives reload and returns after five minutes')
 {
  const page=await browser.newPage({viewport:{width:375,height:900}});active=page;await page.clock.install()
  await page.addInitScript(()=>{
   window.voiced=true;window.stoppedRecognition=false
   Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>{window.trackStopped=true}}]})}})
   window.MediaRecorder=class{static isTypeSupported(){return true}constructor(){this.state='inactive';this.mimeType='audio/webm'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable({data:new Blob([new Uint8Array(3000)])});queueMicrotask(()=>this.onstop())}}
   window.AudioContext=class{constructor(){this.sampleRate=48000;this.state='running'}resume(){return Promise.resolve()}close(){this.state='closed';return Promise.resolve()}createMediaStreamSource(){return {connect(){}}}createAnalyser(){return {fftSize:1024,frequencyBinCount:512,getByteTimeDomainData(buffer){for(let i=0;i<buffer.length;i++)buffer[i]=window.voiced?128+(i%2?20:-20):128},getByteFrequencyData(buffer){buffer.fill(0);if(window.voiced)for(let i=4;i<70;i++)buffer[i]=100}}}}
   window.SpeechRecognition=class{constructor(){window.recognition=this;this.results=[]}start(){}stop(){window.stoppedRecognition=true}abort(){}emit(text,final=true,index=this.results.length){const row=[{transcript:text}];row.isFinal=final;this.results[index]=row;this.onresult({resultIndex:index,results:this.results})}}
  })
  await page.goto('http://127.0.0.1:'+server.address().port+'/?mode=recorder');await page.getByRole('button',{name:'Bắt đầu thu âm',exact:true}).click();await page.clock.runFor(500)
  await page.evaluate(()=>window.recognition.emit('um I I',false));await page.waitForFunction(()=>document.querySelector('[data-live-speaking-text]')?.textContent.includes('um I I'))
  await page.evaluate(()=>{window.recognition.emit('um I I',true,0);window.voiced=false});await page.clock.runFor(2200)
  assert.equal((await page.locator('[data-pause-dots]').textContent()).trim(),'.');await page.clock.runFor(1000);assert.equal((await page.locator('[data-pause-dots]').textContent()).trim(),'. .')
  await page.evaluate(()=>{window.voiced=true;window.recognition.emit('enjoy reading',true,1)});await page.clock.runFor(500)
  await page.getByRole('button',{name:'Dừng thu âm',exact:true}).click();await page.getByText('Bản thu đã sẵn sàng',{exact:true}).waitFor()
  const evidence=await page.evaluate(()=>({delivery:window.savedClip.delivery,stopped:window.stoppedRecognition,track:window.trackStopped}))
  assert.equal(evidence.delivery.segments.length,2);assert.equal(evidence.delivery.segments[0].text,'um I I');assert.ok(evidence.delivery.pauses[0].durationMs>=2500);assert.equal(evidence.stopped,true);assert.equal(evidence.track,true)
  await layout(page);await page.screenshot({path:output+'/live-speaking.png',fullPage:true});await page.close()
 }
 console.log('PASS live interim/final words, preserved um/repetition, 1.5s + 1s dots, frozen evidence and resource cleanup')
} catch(error){if(active&&!active.isClosed())await active.screenshot({path:output+'/failure.png',fullPage:true});throw error}
finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
