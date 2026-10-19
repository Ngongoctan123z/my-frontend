import {mkdir,writeFile} from 'node:fs/promises'
const retired=['/tai-lieu','/exams/vao-10/toan/ha-noi/2026/old','/tools','/en/tools','/en/tools/casio','/en/tools/convert','/en/tools/compress','/en/tools/lock','/en/tools/remove-pages','/en/tools/merge-files','/ai-grader/tai-lieu-tong-hop','/favorites','/documents','/de-thi','/vao-10','/thpt']
const active=['/en','/en/ai-grader','/en/ai-grader/ielts','/en/ai-grader/hsk','/speaking']
const tasks=['https://vndocs.net','https://www.vndocs.net'].flatMap(origin=>[...retired.map(path=>({url:origin+path,expected:'gone'})),...active.map(path=>({url:origin+path,expected:'active'}))])
const results=[]
let next=0
async function inspect(item){
 try{
  const r=await fetch(item.url,{redirect:'manual',headers:{'User-Agent':'VNDocs-SEO-Audit/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)})
  const html=(r.headers.get('content-type')||'').includes('text/html')?await r.text():''
  const row={...item,status:r.status,robots:r.headers.get('x-robots-tag'),location:r.headers.get('location'),title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||null,canonical:html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1]||null,oldNavigation:/href="(?:https:\/\/(?:www\.)?vndocs.net)?\/(?:en\/)?(?:tools|tai-lieu|exams)(?:[\/?"])/i.test(html),cache:r.headers.get('cf-cache-status')}
  results.push(row);console.log(JSON.stringify(row))
 }catch(error){const row={...item,error:error.message};results.push(row);console.log(JSON.stringify(row))}
}
await Promise.all(Array.from({length:4},async()=>{while(next<tasks.length){const item=tasks[next++];await inspect(item)}}))
await mkdir('test-results',{recursive:true});await writeFile('test-results/seo-index-audit.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2))
console.log('AUDIT_SUMMARY '+JSON.stringify({total:results.length,gone410:results.filter(r=>r.status===410).length,active200:results.filter(r=>r.expected==='active'&&r.status===200).length,other:results.filter(r=>r.status!==410&&r.expected==='gone')}))
