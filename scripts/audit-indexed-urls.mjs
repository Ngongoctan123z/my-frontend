import {PAGE_SEO,upgradeSavedPageSeo,pageLanguage,pageUrl,languageAlternates} from '../src/lib/pageSeo.ts'
import {mkdir,writeFile} from 'node:fs/promises'
const retired=['/tai-lieu','/exams/vao-10/toan/ha-noi/2026/old','/tools','/en/tools','/en/tools/casio','/en/tools/convert','/en/tools/compress','/en/tools/lock','/en/tools/remove-pages','/en/tools/merge-files','/ai-grader/tai-lieu-tong-hop','/favorites','/documents','/de-thi','/vao-10','/thpt']
for(const path of ['/tai-lieu','/tai-lieu-mien-phi','/tai-lieu-mien-phi/ielts','/ai-grader/tai-lieu-tong-hop'])for(const prefix of ['', '/en'])if(!retired.includes(prefix+path))retired.push(prefix+path)
retired.push('/api/og?slug=vao-10/toan/ha-noi/2026','/api/og?title='+encodeURIComponent('VNDocs - Trang đề thi vào lớp 10 và THPT'))
const active=Object.keys(PAGE_SEO).filter(path=>PAGE_SEO[path].index!==false)
const noindex=Object.keys(PAGE_SEO).filter(path=>PAGE_SEO[path].index===false)
function decode(value){return value?.replaceAll('&amp;','&').replaceAll('&#x27;',"'").replaceAll('&quot;','"')}
function bilingual(html,r,path){
 const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0])
 const alternates=Object.fromEntries(links.filter(tag=>/rel="alternate"/i.test(tag)).map(tag=>[tag.match(/hrefLang="([^"]+)"/i)?.[1],decode(tag.match(/href="([^"]+)"/i)?.[1])]))
 return {metaRobots:html.match(/<meta[^>]*name="robots"[^>]*content="([^"]+)"/i)?.[1],ogUrl:decode(html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i)?.[1]),language:html.match(/<html[^>]*lang="([^"]+)"/i)?.[1],contentLanguage:r.headers.get('content-language'),description:decode(html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)?.[1]),ogLocale:html.match(/<meta[^>]*property="og:locale"[^>]*content="([^"]+)"/i)?.[1],alternates}
}
const tasks=['https://vndocs.net','https://www.vndocs.net'].flatMap(origin=>[...retired.map(path=>({url:origin+path,expected:'gone'})),...active.map(path=>({url:origin+path,expected:'active',path})),...noindex.map(path=>({url:origin+path,expected:'noindex',path}))])
const results=[]
const infrastructure=[]
let next=0
async function inspect(item){
 try{
  const r=await fetch(item.url,{redirect:'manual',headers:{'User-Agent':'VNDocs-SEO-Audit/1.0','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)})
  const html=(r.headers.get('content-type')||'').includes('text/html')?await r.text():''
  const row={...item,status:r.status,robots:r.headers.get('x-robots-tag'),location:r.headers.get('location'),title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||null,canonical:html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1]||null,oldNavigation:/href="(?:https:\/\/(?:www\.)?vndocs.net)?\/(?:en\/)?(?:tools|tai-lieu|exams)(?:[\/?"])/i.test(html),cache:r.headers.get('cf-cache-status'),...(item.expected!=='gone'?bilingual(html,r,item.path):{})}
  row.title=decode(row.title)
  if(item.expected!=='gone'){
   row.usesDefaultCopy=row.title===PAGE_SEO[item.path].title&&row.description===PAGE_SEO[item.path].description
   const upgraded=upgradeSavedPageSeo(item.path,row)
   row.legacyCopy=upgraded.title!==row.title||upgraded.description!==row.description
  }
  results.push(row);console.log(JSON.stringify(row))
 }catch(error){const row={...item,error:error.message};results.push(row);console.log(JSON.stringify(row))}
}
await Promise.all(Array.from({length:4},async()=>{while(next<tasks.length){const item=tasks[next++];await inspect(item)}}))
for(const origin of ['https://vndocs.net','https://www.vndocs.net']){
 for(const file of ['/robots.txt','/sitemap.xml']){
  try{
   const response=await fetch(origin+file,{redirect:'manual',signal:AbortSignal.timeout(20000)}),body=await response.text()
   const issues=[]
   if(response.status!==200)issues.push('Expected HTTP 200')
   if(file==='/robots.txt'){
    if(!body.includes('Sitemap: https://vndocs.net/sitemap.xml'))issues.push('Missing canonical sitemap directive')
    if(/^Disallow:\s*\/\s*$/m.test(body))issues.push('Public site is blocked')
   }else{
    const urls=[...body.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>decode(match[1]))
    if(urls.length!==active.length||new Set(urls).size!==urls.length||active.some(path=>!urls.includes(pageUrl(path))))issues.push('Sitemap differs from canonical indexable registry')
   }
   infrastructure.push({url:origin+file,status:response.status,issues})
  }catch(error){infrastructure.push({url:origin+file,issues:[error.message]})}
 }
}
console.log('SEO_INFRASTRUCTURE '+JSON.stringify(infrastructure))
await mkdir('test-results',{recursive:true});await writeFile('test-results/seo-index-audit.json',JSON.stringify({checkedAt:new Date().toISOString(),results,infrastructure},null,2))
console.log('AUDIT_SUMMARY '+JSON.stringify({total:results.length,gone410:results.filter(r=>r.status===410).length,active200:results.filter(r=>r.expected==='active'&&r.status===200).length,other:results.filter(r=>r.status!==410&&r.expected==='gone')}))

if(process.argv.includes('--verify')){
 const failures=results.filter(row=>{
  if(row.expected==='gone')return row.status!==410||!row.robots?.includes('noindex')
  if(row.expected==='noindex')return row.status!==200||!row.metaRobots?.includes('noindex')||row.canonical!==pageUrl(row.path)||row.ogUrl!==pageUrl(row.path)
  const lang=pageLanguage(row.path),alternates=languageAlternates(row.path)
  return row.status!==200||row.oldNavigation||row.canonical!==pageUrl(row.path)||row.ogUrl!==pageUrl(row.path)||row.metaRobots?.includes('noindex')||row.language!==lang||row.contentLanguage!==lang||row.ogLocale!==(lang==='en'?'en_US':'vi_VN')||!row.title||!row.description||row.legacyCopy||(process.argv.includes('--expect-default-copy')&&!row.usesDefaultCopy)||Object.entries(alternates).some(([key,url])=>row.alternates?.[key]!==url)||(!alternates.en&&row.alternates?.en)
 })
 if(failures.length||infrastructure.some(row=>row.issues.length)){console.error('SEO_AUDIT_FAILURE '+JSON.stringify({pages:failures,infrastructure:infrastructure.filter(row=>row.issues.length)}));process.exitCode=1}else console.log('PASS live bilingual SEO, indexing and sitemap audit on apex and www: '+results.length+' URLs')
}


