import assert from 'node:assert/strict'
import {build} from 'esbuild'
import {chromium} from '@playwright/test'
import {createServer} from 'node:http'
import {readFile,readdir,mkdir} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
const output='test-results/admin-turnstile';await mkdir(output,{recursive:true})
const css=(await Promise.all((await readdir('.next/static/css',{recursive:true})).filter(file=>file.endsWith('.css')).map(file=>readFile(path.join('.next/static/css',file),'utf8')))).join('\n')
const source=`import React from 'react';import{createRoot}from'react-dom/client';import{CloudflareSystemGate}from'./src/components/admin/CloudflareSystemGate';
window.mode=new URLSearchParams(location.search).get('response')||'ok';window.renders=0;window.removals=0;
sessionStorage.setItem('cf_sys_gate_verified','true');
window.turnstile={render:(container,options)=>{window.renders++;window.options=options;const visual=document.createElement('div');visual.dataset.fixtureWidget='true';visual.textContent='Turnstile fixture';visual.style.width=options.size==='compact'?'150px':'300px';container.append(visual);return 'fixture-widget-'+window.renders},remove:()=>{window.removals++;document.querySelectorAll('[data-fixture-widget]').forEach(node=>node.remove())},reset:()=>{}};
window.fetch=async(url,options)=>{if(url!=='/api/verify-turnstile')throw Error('Unexpected service');if(window.mode==='network')throw Error('Network offline');return Response.json({success:window.mode==='ok'||window.mode==='http-error'}, {status:window.mode==='http-error'?503:200})};
createRoot(document.getElementById('root')).render(<CloudflareSystemGate siteKey="runtime-public-site"><main data-admin-screen>ADMIN_SCREEN_FIXTURE</main></CloudflareSystemGate>);`
const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'alias',setup(b){b.onResolve({filter:/^@\//},args=>{const base=path.resolve(args.path.slice(2));return{path:['.tsx','.ts'].map(ext=>base+ext).find(file=>existsSync(file))||base}})}}]})
const server=createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text)}else if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(css)}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/app.js"></script>')}})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch();let active
try{
 for(const width of [320,1280]){
  for(const response of ['network','denied','http-error','ok']){
   const page=await browser.newPage({viewport:{width,height:800}});active=page;const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/?response='+response)
   await page.waitForFunction(()=>window.renders===1)
   assert.equal(await page.locator('[data-admin-screen]').count(),0,'A sessionStorage flag cannot bypass verification')
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Challenge must fit mobile width')
   assert.equal(await page.evaluate(()=>window.options.sitekey),'runtime-public-site')
   if(width===320)assert.equal(await page.evaluate(()=>window.options.size),'compact')
   await page.evaluate(()=>window.options.callback('issued-token-fixture'))
   if(response==='ok')await page.locator('[data-admin-screen]').waitFor()
   else{
    await page.getByRole('alert').waitFor();assert.equal(await page.locator('[data-admin-screen]').count(),0,'Network errors, HTTP errors and rejected tokens must not unlock admin')
    assert.equal(await page.evaluate(()=>window.renders),1,'Parent state updates must not recreate a challenge')
    await page.evaluate(()=>window.mode='ok');await page.getByRole('button',{name:'Thử lại',exact:true}).click();await page.waitForFunction(()=>window.renders===2);await page.evaluate(()=>window.options.callback('new-issued-token-fixture'));await page.locator('[data-admin-screen]').waitFor()
   }
   assert.deepEqual(errors,[]);await page.screenshot({path:output+'/'+response+'-'+width+'.png'});await page.close()
  }
 }
 console.log('PASS admin Turnstile: runtime site key, compact mobile layout, no browser-storage bypass, failed verification stays locked, retry and successful verification')
}catch(error){if(active&&!active.isClosed())await active.screenshot({path:output+'/failure.png',fullPage:true}).catch(()=>{});throw error}
finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
