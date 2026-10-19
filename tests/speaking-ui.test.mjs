// Actual Speaking client, browser MediaRecorder, IndexedDB and production CSS.
// Only auth/navigation and remote AI responses are fixtures; no paid API calls.
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const output='test-results/speaking-ui'
await mkdir(output,{recursive:true})
const css=(await Promise.all((await readdir('.next/static/css',{recursive:true})).filter(f=>f.endsWith('.css')).map(f=>readFile(path.join('.next/static/css',f),'utf8')))).join('\n')
const entry=`
import React from 'react'; import {createRoot} from 'react-dom/client';
import {SpeakingClient} from './app/speaking/SpeakingClient';
import {fallbackCatalog} from './src/lib/speaking';
import * as storage from './src/utils/speakingStorage';
window.storage=storage; window.requests=[]; window.microphoneStreams=[]; window.rejectMicrophone=false;
window.owner=localStorage.getItem('fixture-owner') || 'speaking-ui@example.test';
window.changeOwner=email=>{window.owner=email;localStorage.setItem('fixture-owner',email);window.dispatchEvent(new Event('fixture-owner'));};
const nativeMicrophone=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
navigator.mediaDevices.getUserMedia=async options=>{if(window.rejectMicrophone) throw new DOMException('Denied','NotAllowedError'); const stream=await nativeMicrophone(options);window.microphoneStreams.push(stream);return stream;};
// Avoid depending on the CI machine's installed speech voices.
speechSynthesis.speak=utterance=>setTimeout(()=>utterance.onend?.(new Event('end')),20);
const load=()=>JSON.parse(localStorage.getItem('fixture-reports:'+window.owner)||'[]');
const save=reports=>localStorage.setItem('fixture-reports:'+window.owner,JSON.stringify(reports));
const feedback={valid:true,assessmentStatus:'content_only',transcript:'I enjoy reading books because they help me learn new things.',feedback:'Câu trả lời có ý rõ ràng. Hãy thêm ví dụ cụ thể.',strengths:'Có lý do phù hợp.',
 criteria:['fluency','lexical','grammar','pronunciation'].map(id=>({id,label:({fluency:'Trôi chảy',lexical:'Từ vựng',grammar:'Ngữ pháp',pronunciation:'Phát âm'})[id],score:id==='pronunciation'?null:6,max:9,explanation:'Nhận xét từ nội dung thực tế.'})),
 score:null,issues:[{title:'Phát triển ví dụ',explanation:'Đưa thêm một tình huống cụ thể.',suggestion:'For example, I recently read a book about science.'}],modelAnswer:'I enjoy reading books because they introduce me to new ideas.',
 pronunciationNote:'Điểm phát âm và Band tổng cần có phân tích âm thanh.',fluency:{wordsPerMinute:120,fillerCount:0,repetitionCount:0,longPauseCount:1,speechSeconds:6}};
window.fetch=async(url,options={})=>{
 const body=options.body instanceof FormData?Object.fromEntries(options.body.entries()):options.body?JSON.parse(options.body):{};
 window.requests.push({action:body.action||'usage',index:body.itemIndex,clientId:body.clientSubmissionId});
 const respond=(data,status=200)=>Response.json(data,{status});
 if(!options.body)return respond({count:load().length,limit:100});
 if(body.action==='catalog')return respond({catalog:fallbackCatalog(body.examType),source:'fixture'});
 if(body.action==='begin_submission'){
  const reports=load();let report=reports.find(r=>r.clientId===body.clientSubmissionId);
  if(!report){const id=crypto.randomUUID().replaceAll('-','').repeat(2);report={id,clientId:body.clientSubmissionId,examType:body.examType,mode:body.mode,fullTest:body.fullTest,feedbackLang:body.feedbackLang,status:'reserved',createdAt:Date.now(),items:body.items.map((item,i)=>({id:id+':'+i,question:item.question,status:'pending',result:null}))};reports.push(report);save(reports);}
  return respond({id:report.id,count:reports.length,limit:100,report});
 }
 if(body.action==='upload_audio'){const reports=load(),r=reports.find(r=>r.id===body.submissionId);r.items[Number(body.itemIndex)].audioAvailable=true;save(reports);return respond({audioAvailable:true});}
 if(body.action==='submit_audio'){
  if(window.failIndex===Number(body.itemIndex)){window.failIndex=null;return respond({error:'Kết nối tạm gián đoạn. Bản thu vẫn được giữ.'},503);}
  const reports=load(),report=reports.find(r=>r.id===body.submissionId),item=report.items[Number(body.itemIndex)];
  item.result=feedback;item.status='completed';if(report.items.every(i=>i.result))report.status='completed';save(reports);return respond({result:feedback,recordingId:item.id});
 }
 if(body.action==='report')return respond(body.submissionId?{report:load().find(r=>r.id===body.submissionId)}:{reports:load()});
 if(body.action==='chat_history')return respond({messages:[]});
 if(body.action==='chat')return respond({reply:'Hãy bổ sung một ví dụ cụ thể.'});
 return respond({error:'Unknown action'},400);
};
createRoot(document.getElementById('root')).render(<SpeakingClient/>);
`
const stubs={
 'next-auth/react':`import {useState,useEffect} from 'react';export function useSession(){const [email,setEmail]=useState(window.owner);useEffect(()=>{const update=()=>setEmail(window.owner);window.addEventListener('fixture-owner',update);return()=>window.removeEventListener('fixture-owner',update)},[]);return {data:{user:{email}},status:'authenticated'}}export const signIn=()=>{};`,
 'next/navigation':`export const useSearchParams=()=>new URLSearchParams(location.search);`,
}
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'speaking-fixtures',setup(builder){
 builder.onResolve({filter:/^(next-auth\/react|next\/navigation)$/},args=>({path:args.path,namespace:'fixture'}));
 builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:stubs[args.path],loader:'js',resolveDir:process.cwd()}));
 builder.onResolve({filter:/^@\//},args=>{const base=path.resolve(args.path.replace(/^@\//,''));return{path:['.tsx','.ts','/index.ts','/index.tsx'].map(ext=>base+ext).find(f=>existsSync(f))||base}});
}}]})
const server=createServer((request,response)=>{
 if(request.url==='/app.js'){response.setHeader('Content-Type','text/javascript');response.end(bundle.outputFiles[0].text);return}
 if(request.url==='/style.css'){response.setHeader('Content-Type','text/css');response.end(css);return}
 response.setHeader('Content-Type','text/html');response.end('<!doctype html><html lang="vi"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body class="bg-slate-50"><main id="root" class="mx-auto max-w-7xl py-4"></main><script src="/app.js"></script></body></html>')
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']})
let activePage
const url=`http://127.0.0.1:${server.address().port}/speaking`
const submit=page=>page.getByRole('button',{name:/^Nộp bài & Nhận xét/})
const waitReady=async page=>{await page.getByRole('heading',{name:'Phòng Luyện Speaking'}).waitFor();await page.getByRole('button',{name:'Chọn đề',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('select[aria-label="Kỳ thi Speaking"]').disabled)}
const record=async(page,duration=1400)=>{
 await page.getByRole('button',{name:'Bắt đầu thu âm',exact:true}).click();await page.getByRole('button',{name:'Dừng thu âm',exact:true}).waitFor();await page.waitForTimeout(duration);await page.getByRole('button',{name:'Dừng thu âm',exact:true}).click();await page.getByText('Bản thu đã sẵn sàng',{exact:true}).waitFor();
}
const assertLayout=async page=>{
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Page overflow');
 assert.equal(await page.locator('[data-grader-actions] button:visible').evaluateAll(buttons=>buttons.some(b=>b.scrollWidth>b.clientWidth+1)),false,'Clipped submit button');
}
try{
 for(const width of [320,375,1280]){
  const context=await browser.newContext({viewport:{width,height:900},permissions:['microphone']});const page=await context.newPage();activePage=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await waitReady(page);await assertLayout(page);
  assert.equal(await page.evaluate(()=>window.microphoneStreams.length),0,'No microphone until the user starts');
  assert.equal(await page.getByText(/Chọn mục tiêu|Vòng quay|Bắt đầu phiên/).count(),0);
  await record(page,width===375?4300:1400);
  assert.equal(await page.getByLabel('Nghe lại bản thu',{exact:true}).count(),1);
  assert.equal(await page.evaluate(()=>window.requests.filter(r=>['begin_submission','submit_audio'].includes(r.action)).length),0,'No AI before Submit');
  assert.equal(await page.evaluate(()=>window.microphoneStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),true,'Microphone released after stop');
  await page.waitForTimeout(300);await page.reload();await waitReady(page);await page.getByText('Bản thu đã sẵn sàng',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Nghe lại bản thu',{exact:true}).count(),1,'IndexedDB restored Blob');
  await page.evaluate(()=>window.rejectMicrophone=true);await page.getByRole('button',{name:'Thu lại',exact:true}).click();await page.getByRole('alert').filter({hasText:'Chưa được cấp quyền micro'}).waitFor();
  assert.equal(await page.getByLabel('Nghe lại bản thu',{exact:true}).count(),1,'Permission failure keeps existing clip');
  await page.evaluate(()=>{window.rejectMicrophone=false;window.failIndex=0});await page.getByLabel('Ngôn ngữ nhận xét',{exact:true}).selectOption('English');
  await submit(page).click();await page.getByRole('alert').filter({hasText:'Kết nối tạm gián đoạn'}).waitFor();
  assert.equal(await page.getByLabel('Nghe lại bản thu',{exact:true}).count(),1,'Server error keeps playback');
  assert.equal(await page.getByRole('dialog',{name:'Nhận xét bài nói'}).isVisible(),false,'Failed grading is not shown as success');
  await submit(page).click();const dialog=page.getByRole('dialog',{name:'Nhận xét bài nói'});await dialog.waitFor();
  await page.getByText('Đã phân tích nội dung bài nói',{exact:true}).waitFor();assert.equal(await dialog.getByText('Band tham khảo · câu luyện',{exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.action==='begin_submission').length),1,'Retry reuses reservation');
  await dialog.getByLabel('Nghe lại bài đã chấm',{exact:true}).waitFor();assert.equal(await dialog.locator('[data-scored-transcript]').textContent(),'I enjoy reading books because they help me learn new things.');assert.equal(await dialog.locator('[data-scored-transcript]').getAttribute('contenteditable'),null);assert.equal(await dialog.getByRole('textbox').count(),0);await dialog.getByRole('heading',{name:'Điểm yếu & cách sửa',exact:true}).waitFor();await assertLayout(page);await page.screenshot({path:`${output}/result-${width}.png`,fullPage:true});
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Lịch sử',exact:true}).click();await page.getByRole('dialog',{name:'Lịch sử Speaking',exact:true}).getByRole('button',{name:'Xem kết quả',exact:true}).click();await dialog.waitFor();
  await page.evaluate(()=>window.changeOwner('other-user@example.test'));await dialog.waitFor({state:'hidden'});assert.equal(await page.getByLabel('Nghe lại bản thu',{exact:true}).count(),0,'Other account cannot see previous audio');
  await page.getByRole('button',{name:'Lịch sử',exact:true}).click();await page.getByText('Chưa có bài Speaking đã nộp.',{exact:true}).waitFor();await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);await page.screenshot({path:`${output}/speaking-${width}.png`,fullPage:true});await context.close();console.log(`PASS Speaking recording, retry, storage, history, account privacy and layout at ${width}px`);
 }
 const context=await browser.newContext({viewport:{width:375,height:900},permissions:['microphone']});const page=await context.newPage();activePage=page;
 await page.goto(url+'?tab=toeic');await waitReady(page);await page.getByRole('button',{name:'Trọn bộ',exact:true}).click();
 assert.equal(await page.getByLabel('Chọn câu trong bài Speaking',{exact:true}).locator('option').count(),11);
 await record(page);await page.getByRole('button',{name:'Lưu & Câu tiếp theo',exact:true}).click();await record(page);
 await page.getByRole('button',{name:'Câu trước',exact:true}).click();await page.getByText('Bản thu đã sẵn sàng',{exact:true}).waitFor();
 await page.waitForTimeout(300);
 await page.evaluate(async()=>{const draft=await window.storage.loadSpeakingDraft(window.owner),clip=Object.values(draft.clips)[0];for(const q of draft.questions)draft.clips[q.id]={...clip,id:crypto.randomUUID()};draft.index=10;await window.storage.saveSpeakingDraft(draft)});
 await page.reload();await waitReady(page);await page.getByText('Bản thu đã sẵn sàng',{exact:true}).waitFor();
 await page.evaluate(()=>window.failIndex=1);await submit(page).click();await page.getByRole('alert').filter({hasText:'Kết nối tạm gián đoạn'}).waitFor();await submit(page).click();
 const dialog=page.getByRole('dialog',{name:'Nhận xét bài nói'});await dialog.waitFor();await page.getByText(/11\/11 câu đã nhận xét/).waitFor();
 assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.action==='begin_submission').length),1);
 assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.action==='submit_audio'&&r.index==='0').length),1,'Retry skips already completed first question');
 assert.equal(await page.evaluate(()=>window.requests.filter(r=>r.action==='submit_audio').length),12,'Eleven answers plus one failed request');
 await assertLayout(page);await page.screenshot({path:`${output}/toeic-full-mobile.png`,fullPage:true});
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Thi thử',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Dịch đề',exact:true}).count(),0);
 await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).click();await page.getByText('Thời gian chuẩn bị',{exact:true}).waitFor();await page.getByRole('button',{name:'Hủy thao tác',exact:true}).click();
 await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.microphoneStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))),true);
 await context.close();console.log('PASS TOEIC eleven-question practice, partial-result resume and exam preparation cancellation');
}catch(error){if(activePage&&!activePage.isClosed())await activePage.screenshot({path:`${output}/failure.png`,fullPage:true}).catch(()=>{});await writeFile(`${output}/failure.txt`,String(error.stack||error));throw error}
finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
