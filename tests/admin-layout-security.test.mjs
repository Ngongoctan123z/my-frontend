import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {build} from 'esbuild'
import {createRequire} from 'node:module'
import {existsSync} from 'node:fs'
import path from 'node:path'
const require=createRequire(import.meta.url)
globalThis.__adminFixture={email:null,env:{},error:false}
const stubs={
 '@/auth':`export const auth=async()=>{const state=globalThis.__adminFixture;if(state.error)throw new Error('PRIVATE_INTERNAL_EXCEPTION');return state.email?{user:{email:state.email}}:null}`,
 'next/navigation':`export const redirect=url=>{throw new Error('REDIRECT:'+url)}`,
 '@opennextjs/cloudflare':`export const getCloudflareContext=async()=>({env:globalThis.__adminFixture.env})`,
 '@/src/components/admin/CloudflareSystemGate':`import React from 'react';export const CloudflareSystemGate=({siteKey,children})=>React.createElement('div',{'data-turnstile-key':siteKey},children)`,
}
for(const route of ['quan-ly-he-thong-123','quan-tri-he-thong-123']){
 const bundle=await build({stdin:{contents:`export {default} from './app/${route}/layout.tsx'`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'admin-layout-fixtures',setup(b){
  b.onResolve({filter:/.*/},args=>{if(stubs[args.path])return{path:args.path,namespace:'fixture'};if(args.path==='react'||args.path.startsWith('react/'))return{path:require.resolve(args.path),external:true};if(args.path.startsWith('@/')){const base=path.resolve(args.path.slice(2));return{path:['.tsx','.ts','/index.ts'].map(ext=>base+ext).find(file=>existsSync(file))||base}}})
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:stubs[args.path],loader:'js',resolveDir:process.cwd()}))
 }}]})
 const {default:Layout}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'))
 const render=async()=>renderToStaticMarkup(await Layout({children:React.createElement('main',{'data-admin-content':true},'ADMIN_CONTENT_FIXTURE')}))
 test(route+': guests redirect and ordinary users never see admin content',async()=>{
  globalThis.__adminFixture={email:null,env:{},error:false};await assert.rejects(render(),/REDIRECT:\/login/)
  globalThis.__adminFixture.email='learner@example.invalid';const html=await render();assert.ok(!html.includes('ADMIN_CONTENT_FIXTURE'));assert.ok(html.includes('TỪ CHỐI TRUY CẬP'))
 })
 test(route+': authorized administrator is not locked out by absent or partial CAPTCHA config',async()=>{
  for(const env of [{},{TURNSTILE_SITE_KEY:'site-key-fixture'},{TURNSTILE_SECRET_KEY:'private-secret-fixture'}]){globalThis.__adminFixture={email:'ngongoctan282005@gmail.com',env,error:false};const html=await render();assert.ok(html.includes('ADMIN_CONTENT_FIXTURE'));assert.ok(!html.includes('data-turnstile-key'))}
 })
 test(route+': complete runtime config activates the additional challenge; private key stays server-side',async()=>{
  globalThis.__adminFixture={email:'ngongoctan282005@gmail.com',env:{TURNSTILE_SITE_KEY:'runtime-public-site',TURNSTILE_SECRET_KEY:'PRIVATE_SECRET_FIXTURE'},error:false};const html=await render();assert.ok(html.includes('data-turnstile-key="runtime-public-site"'));assert.ok(!html.includes('PRIVATE_SECRET_FIXTURE'))
 })
 test(route+': authentication failures do not expose internal exception text',async()=>{
  globalThis.__adminFixture={email:null,env:{},error:true};const html=await render();assert.ok(!html.includes('PRIVATE_INTERNAL_EXCEPTION'));assert.ok(!html.includes('ADMIN_CONTENT_FIXTURE'))
 })
}
