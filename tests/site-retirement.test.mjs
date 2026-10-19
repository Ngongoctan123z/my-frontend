import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile,readdir} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {build} from 'esbuild'
import {NextRequest} from 'next/server.js'
const require=createRequire(import.meta.url)
const entry=`export * from './middleware';export * from './src/lib/siteSections';export {default as sitemap} from './app/sitemap';export {default as robots} from './app/robots';export {getSmartRoute} from './src/utils/searchRouting';export {GET as oldOg} from './app/api/og/route';`
const bundle=await build({stdin:{contents:entry,loader:'ts',resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',define:{'process.env.NEXT_PUBLIC_API_URL':'"https://fixture.invalid"'},plugins:[{name:'aliases',setup(b){b.onResolve({filter:/^@\//},a=>({path:process.cwd()+'/'+a.path.slice(2)+'.ts'}))}}]})
const module={exports:{}};new Function('require','module','exports',bundle.outputFiles[0].text)(require,module,module.exports)
const policy=module.exports
const retired=['/tai-lieu','/tai-lieu?year=2026','/exams/vao-10/toan/ha-noi/2026/paper','/exams/thpt/toan/2026','/files/old.pdf','/backend-files/old.pdf','/exam-papers/2026/vao-10-toan-ca-mau-2026-chuyen.pdf','/ai-grader/tai-lieu-tong-hop','/quan-tri-he-thong-123','/tools/casio','/favorites','/documents','/de-thi','/vao-10','/thpt']

test('retired public pages and files return 410/noindex before static or country redirects',async()=>{
 for(const path of retired)for(const prefix of ['', '/en']){
  const response=policy.middleware(new NextRequest('https://vndocs.net'+prefix+path,{headers:{'cf-ipcountry':'US'}}))
  assert.equal(response.status,410,prefix+path);assert.match(response.headers.get('x-robots-tag'),/noindex/);assert.equal(response.headers.get('location'),null)
  const html=await response.text();assert.ok(html.includes('name="robots"'));assert.ok(!html.includes('SearchAction'))
 }
})
test('Writing, Speaking, their media and their administration remain available',()=>{
 for(const path of ['/ai-grader','/ai-grader/ielts','/en/ai-grader/toeic','/speaking','/api/speaking/audio/id','/api/ai-grader','/api/admin','/quan-ly-he-thong-123','/quan-ly-de-thi-123','/exam-media/official/ielts-speaking-sample-tasks.pdf','/exam-data/writing-bank-v1.json','/exams-not-a-section']){
  const response=policy.middleware(new NextRequest('https://vndocs.net'+path));assert.equal(response.headers.get('x-middleware-next'),'1',path)
 }
})
test('active English routing and focused search continue to work',()=>{
 const response=policy.middleware(new NextRequest('https://vndocs.net/',{headers:{'cf-ipcountry':'US'}}));assert.equal(response.headers.get('location'),'https://vndocs.net/en')
 assert.equal(policy.getSmartRoute('luyện nói tiếng Anh'),'/speaking');assert.equal(policy.getSmartRoute('TOEIC'),'/ai-grader/toeic');assert.equal(policy.getSmartRoute('đề thi vào 10'),'/ai-grader')
})
test('sitemap contains only active pages; robots allows Google to discover 410 removals',()=>{
 const map=policy.sitemap();assert.ok(map.some(row=>row.url.endsWith('/speaking')));assert.ok(map.some(row=>row.url.endsWith('/en/ai-grader/hsk')))
 for(const row of map)assert.equal(policy.isRetiredPath(new URL(row.url).pathname),false)
 const disallow=policy.robots().rules[0].disallow;for(const path of ['/tai-lieu','/exams','/files','/exam-papers','/quan-tri-he-thong-123'])assert.ok(!disallow.some(rule=>path.startsWith(rule)))
})
test('archive metadata and generated PDF files are absent from the active release',async()=>{
 assert.deepEqual(JSON.parse(await readFile('src/data/exams2026.json','utf8')),[])
 const files=await readdir('public/exam-papers',{recursive:true}).catch(error=>{if(error.code==='ENOENT')return[];throw error});assert.ok(!files.some(name=>name.endsWith('.pdf')))
})
test('old exam Open Graph URLs are gone without contacting the old exam backend',async()=>{
 const response=await policy.oldOg(new NextRequest('https://vndocs.net/api/og?slug=vao-10/toan/ha-noi/2026'));assert.equal(response.status,410);assert.match(response.headers.get('x-robots-tag'),/noindex/)
})

test('cached Open Graph titles and descriptions from retired sections are gone',async()=>{
 for(const query of ['title='+encodeURIComponent('VNDocs - Trang đề thi vào lớp 10 và THPT'),'description='+encodeURIComponent('Kho tài liệu THPT miễn phí')]){
  const response=await policy.oldOg(new NextRequest('https://vndocs.net/api/og?'+query));assert.equal(response.status,410);assert.match(response.headers.get('x-robots-tag'),/noindex/)
 }
})
