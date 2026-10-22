import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import {renderToStaticMarkup} from 'react-dom/server'
import ts from 'typescript'
import {readFile} from 'node:fs/promises'
import {createContext,SourceTextModule,SyntheticModule} from 'node:vm'
import {resolve} from 'node:path'
async function harness(route){
 const state={email:null,env:{},error:false},context=createContext({process:{env:{}},console}),cache=new Map()
 const stubs={
  '@/auth':{auth:async()=>{if(state.error)throw new Error('PRIVATE_INTERNAL_EXCEPTION');return state.email?{user:{email:state.email}}:null}},
  'next/navigation':{redirect:url=>{throw new Error('REDIRECT:'+url)}},
  '@opennextjs/cloudflare':{getCloudflareContext:async()=>({env:state.env})},
  'react':{default:React},'react/jsx-runtime':jsxRuntime,
  'lucide-react':{ShieldAlert:()=>React.createElement('span',null,'Alert')},
  '@/src/components/admin/CloudflareSystemGate':{CloudflareSystemGate:({siteKey,children})=>React.createElement('div',{'data-turnstile-key':siteKey},children)},
 }
 async function load(file){
  if(cache.has(file))return cache.get(file)
  if(stubs[file]){const stub=new SyntheticModule(Object.keys(stubs[file]),function(){for(const [key,value]of Object.entries(stubs[file]))this.setExport(key,value)},{context});cache.set(file,stub);return stub}
  const source=await readFile(file,'utf8'),compiled=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText
  const module=new SourceTextModule(compiled,{context,identifier:file});cache.set(file,module)
  await module.link(specifier=>load(stubs[specifier]?specifier:resolve(specifier.replace(/^@\//,'')+'.ts')));return module
 }
 const module=await load(resolve('app/'+route+'/layout.tsx'));await module.evaluate()
 return {state,render:async()=>renderToStaticMarkup(await module.namespace.default({children:React.createElement('main',{'data-admin-content':true},'ADMIN_CONTENT_FIXTURE')}))}
}
for(const route of ['quan-ly-he-thong-123','quan-tri-he-thong-123']){
 test(route+': guests redirect and ordinary users never see admin content',async()=>{
  const {state,render}=await harness(route);await assert.rejects(render(),/REDIRECT:\/login/)
  state.email='learner@example.invalid';const html=await render();assert.ok(!html.includes('ADMIN_CONTENT_FIXTURE'));assert.ok(html.includes('TỪ CHỐI TRUY CẬP'))
 })
 test(route+': authorized administrator is not locked out by absent or partial CAPTCHA config',async()=>{
  const {state,render}=await harness(route);state.email='ngongoctan282005@gmail.com'
  for(const env of [{},{TURNSTILE_SITE_KEY:'site-key-fixture'},{TURNSTILE_SECRET_KEY:'private-secret-fixture'}]){state.env=env;const html=await render();assert.ok(html.includes('ADMIN_CONTENT_FIXTURE'));assert.ok(!html.includes('data-turnstile-key'))}
 })
 test(route+': complete runtime config activates the challenge without serializing its secret',async()=>{
  const {state,render}=await harness(route);state.email='ngongoctan282005@gmail.com';state.env={TURNSTILE_SITE_KEY:'runtime-public-site',TURNSTILE_SECRET_KEY:'PRIVATE_SECRET_FIXTURE'};const html=await render();assert.ok(html.includes('data-turnstile-key="runtime-public-site"'));assert.ok(!html.includes('PRIVATE_SECRET_FIXTURE'))
 })
 test(route+': authentication failures do not expose internal exception text',async()=>{
  const {state,render}=await harness(route);state.error=true;const html=await render();assert.ok(!html.includes('PRIVATE_INTERNAL_EXCEPTION'));assert.ok(!html.includes('ADMIN_CONTENT_FIXTURE'))
 })
}
