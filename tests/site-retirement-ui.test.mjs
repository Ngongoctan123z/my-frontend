// Actual Header, Footer, Home and SEO editor. Only auth/navigation/network are fixtures.
import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {createServer} from 'node:http'
import {readFile,readdir,mkdir} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
const output='test-results/site-retirement-ui';await mkdir(output,{recursive:true})
const css=(await Promise.all((await readdir('.next/static/css',{recursive:true})).filter(f=>f.endsWith('.css')).map(f=>readFile(path.join('.next/static/css',f),'utf8')))).join('\n')
const entry=`import React from 'react';import {createRoot} from 'react-dom/client';import {Header} from './src/components/common/Header';import {Footer} from './src/components/common/Footer';import {HomeClient} from './app/HomeClient';import {SeoTab} from './src/components/admin/SeoTab';window.savedSeo=null;window.fetch=async(url,options={})=>{if(options.method==='POST'){window.savedSeo=JSON.parse(options.body).payload;return Response.json({success:true})}return Response.json({SEO_TITLE:'VNDocs - Trang đề thi vào 10 và THPT',SEO_DESCRIPTION:'Kho đề thi THPT',SEO_OG_IMAGE:'https://fixture.invalid/old.png','SEO_ROUTE_/exams/vao-10/toan':JSON.stringify({title:'Old exam SEO'}),'SEO_ROUTE_/ai-grader':JSON.stringify({title:'Writing Practice'})})};const seo=new URLSearchParams(location.search).get('panel')==='seo';createRoot(document.getElementById('root')).render(seo?<main className="p-3"><SeoTab/></main>:<><Header/><main className="px-3"><HomeClient language={location.pathname==='/en'?'en':'vi'}/></main><Footer/></>);`
const stubs={
 'next/link':`import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>} `,
 'next/image':`import React from 'react';export default function Image({priority,fill,...props}){return <img {...props}/>} `,
 'next/navigation':`export const usePathname=()=>location.pathname;`,
 'next-auth/react':`export const useSession=()=>({data:null,status:'unauthenticated'});`,
 AuthButton:`import React from 'react';export const AuthButton=()=> <button>Sign in</button>;`,
}
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"','process.env.NEXT_PUBLIC_API_URL':'"https://fixture.invalid"'},plugins:[{name:'fixtures',setup(b){
 b.onResolve({filter:/^(next\/link|next\/image|next\/navigation|next-auth\/react)$/},a=>({path:a.path,namespace:'fixture'}));b.onResolve({filter:/\/auth\/AuthButton$/},()=>({path:'AuthButton',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:stubs[a.path],loader:'tsx',resolveDir:process.cwd()}));b.onResolve({filter:/^@\//},a=>{const base=path.resolve(a.path.slice(2));return{path:['.tsx','.ts','/index.ts','/index.tsx'].map(e=>base+e).find(f=>existsSync(f))||base}})
}}]})
const server=createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return}if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css);return}res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/app.js"></script>')})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch();const origin='http://127.0.0.1:'+server.address().port
try{
 for(const width of [320,375,1280])for(const route of ['/', '/en']){
  const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+route)
  await page.getByRole('heading',{name:route==='/en'?'Practice Writing and Speaking':'Luyện Writing và Speaking',exact:true}).waitFor()
  const hrefs=await page.locator('a[href^="/"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));assert.ok(hrefs.includes('/speaking'));assert.ok(hrefs.some(h=>h.endsWith('/ai-grader')));for(const exam of ['ielts','toeic','topik','hsk'])assert.ok(hrefs.includes((route==='/en'?'/en':'')+'/ai-grader/'+exam),'Homepage language matches its direct exam links');assert.ok(!hrefs.some(h=>/\/tai-lieu|\/exams|\/tools/.test(h)))
  await page.getByRole('button',{name:'Menu',exact:true}).click();const drawer=page.locator('.fixed.top-0.left-0.bottom-0');await drawer.getByRole('link',{name:'IELTS & TOEIC Speaking',exact:true}).waitFor();assert.equal(await drawer.getByRole('link',{name:'IELTS & TOEIC Speaking',exact:true}).getAttribute('href'),'/speaking')
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Focused homepage fits viewport');assert.deepEqual(errors,[]);await page.screenshot({path:output+'/nav-'+width+'-'+(route==='/en'?'en':'vn')+'.png',fullPage:true});await page.close();console.log('PASS Writing/Speaking navigation and drawer at '+width+'px '+route)
 }
 const page=await browser.newPage({viewport:{width:1280,height:950}});await page.goto(origin+'/?panel=seo');await page.getByRole('button',{name:'Lưu Toàn Bộ Cấu Hình SEO',exact:true}).waitFor();assert.equal(await page.locator('input[name="SEO_TITLE"]').inputValue(),'');assert.equal(await page.getByText('/exams/vao-10/toan',{exact:true}).count(),0);assert.equal(await page.getByText('Kho Đề Thi & Tài Liệu',{exact:true}).count(),0)
 await page.getByRole('button',{name:'Lưu Toàn Bộ Cấu Hình SEO',exact:true}).click();await page.waitForFunction(()=>window.savedSeo!==null);const saved=await page.evaluate(()=>window.savedSeo);assert.equal(saved['SEO_ROUTE_/exams/vao-10/toan'],'');assert.equal(saved.SEO_TITLE,'');assert.equal(JSON.parse(saved['SEO_ROUTE_/ai-grader']).title,'Writing Practice');await page.close();console.log('PASS old exam SEO is hidden/cleared while Writing SEO is preserved')
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}

