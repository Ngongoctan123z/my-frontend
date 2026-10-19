// Actual legacy exam administration; only network/auth fixtures are substituted.
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {createServer} from 'node:http'
import {readFile,readdir,mkdir} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
const output='test-results/exams-2026-ui';await mkdir(output,{recursive:true})
const records=JSON.parse(await readFile('src/data/exams2026.json','utf8'))
const css=(await Promise.all((await readdir('.next/static/css',{recursive:true})).filter(f=>f.endsWith('.css')).map(f=>readFile(path.join('.next/static/css',f),'utf8')))).join('\n')
const entry=`import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {Admin} from './src/views/Admin';window.legacyCalls=[];window.fetch=async(url,options={})=>{window.legacyCalls.push({url:String(url),method:options.method||'GET'});return Response.json({message:'Fixture legacy backend unavailable'},{status:503})};createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><Admin/></QueryClientProvider>);`
const unrelated={UploadExamForm:'export default function UploadExamForm(){return null}',EditExamModal:'export default function EditExamModal(){return null}',DocumentAdminTab:'export function DocumentAdminTab(){return null}',AiConfigAdminTab:'export function AiConfigAdminTab(){return null}'}
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fixtures',setup(builder){
 builder.onResolve({filter:/next\/link$/},()=>({path:'link',namespace:'fixture'}));builder.onResolve({filter:/NotificationContext$/},()=>({path:'notify',namespace:'fixture'}));builder.onResolve({filter:new RegExp('/('+Object.keys(unrelated).join('|')+')$')},a=>({path:a.path.split('/').at(-1),namespace:'fixture'}));
 builder.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='link'?`import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>} `:a.path==='notify'?'export const useNotify=()=>({notify(){}})':unrelated[a.path],loader:'tsx',resolveDir:process.cwd()}));
 builder.onResolve({filter:/^@\//},a=>{const base=path.resolve(a.path.slice(2));return{path:['.tsx','.ts','/index.ts','/index.tsx'].map(e=>base+e).find(f=>existsSync(f))||base}})
}}]})
const server=createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return}if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);return}res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><main id="root" class="mx-auto max-w-7xl p-3"></main><script src="/app.js"></script>')})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch();const url='http://127.0.0.1:'+server.address().port+'/quan-tri-he-thong-123'
try{
 for(const width of [320,375,1280]){
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(url);await page.getByRole('heading',{name:'Đăng nhập Admin',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Kho PDF đề thi 2026',exact:true}).count(),0,'Existing admin login stays in place')
  await page.evaluate(()=>localStorage.setItem('adminToken','fixture-only-token'));await page.reload();await page.getByRole('heading',{name:'Kho PDF đề thi 2026',exact:true}).waitFor()
  assert.equal(await page.getByRole('button',{name:'Danh sách đề',exact:true}).count(),1)
  assert.equal(await page.getByRole('link',{name:'Mở PDF',exact:true}).count(),Math.min(15,records.length));assert.equal(await page.evaluate(()=>window.legacyCalls.length),0,'Archive opens without a legacy backend request')
  const first=page.getByRole('link',{name:'Mở PDF',exact:true}).first();assert.ok((await first.getAttribute('href')).startsWith('https://vndocs.net/exam-papers/2026/'))
  await page.getByRole('link',{name:'Xem trang đề',exact:true}).first().getAttribute('href').then(href=>assert.ok(href.startsWith('/exams/')))
  await page.getByText('Tiêu đề & mô tả SEO',{exact:true}).first().click();assert.ok((await page.locator('article').first().innerText()).includes('2026'))
  if(records.length>15){const before=await first.getAttribute('href');await page.getByRole('button',{name:'Trang sau',exact:true}).click();assert.notEqual(await first.getAttribute('href'),before);await page.getByRole('button',{name:'Trang trước',exact:true}).click()}
  await page.getByLabel('Loại đề PDF 2026').selectOption('THPT');assert.equal(await page.locator('article').count(),Math.min(15,records.filter(r=>r.examType==='THPT').length));await page.getByLabel('Loại đề PDF 2026').selectOption('')
  await page.getByLabel('Tìm PDF 2026').fill('khong-co-de-nay');assert.equal(await page.locator('article').count(),0);await page.getByLabel('Tìm PDF 2026').fill('')
  await page.getByRole('button',{name:'Đề tải lên trước đây',exact:true}).click();await page.getByText('Lỗi: Fixture legacy backend unavailable',{exact:true}).waitFor();await page.getByRole('button',{name:/^Đề 2026 \(/}).click();await page.getByRole('heading',{name:'Kho PDF đề thi 2026',exact:true}).waitFor()
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Admin fits viewport');assert.deepEqual(errors,[]);await page.screenshot({path:output+'/admin-'+width+'.png',fullPage:true});await page.close();console.log('PASS exam archive in /quan-tri-he-thong-123: auth, PDFs, SEO, pagination and layout at '+width+'px')
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
