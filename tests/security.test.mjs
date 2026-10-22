import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {resolve,dirname} from 'node:path'
import {stripTypeScriptTypes} from 'node:module'
import {createContext,SourceTextModule,SyntheticModule} from 'node:vm'
import {hashPassword,verifyPassword} from '../src/lib/passwords.ts'
import {boundedJson} from '../src/lib/requestBody.ts'
import {safeLoginRedirect} from '../src/lib/loginRedirect.ts'

async function harness(entry,env={}) {
 const state={calls:[],env,user:null,updated:null,factory:null,response:['Xin chào'],outcome:{success:true,hostname:'vndocs.net'}}
 const db={select:()=>({from:()=>({where:()=>({get:async()=>state.user})})}),update:()=>({set:value=>({where:async()=>{state.updated=value}})})}
 const context=createContext({Request,Response,Headers,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,AbortSignal,crypto,console,process:{env:{}},fetch:async(url,options)=>{state.calls.push({url,options});return Response.json(String(url).includes('siteverify')?state.outcome:state.response)}})
 const cache=new Map()
 const mocks={
  'next/server':{NextResponse:class extends Response{static json(value,options){return Response.json(value,options)}},NextRequest:Request},
  '@opennextjs/cloudflare':{getCloudflareContext:async()=>({env:state.env})},
  'next-auth':{default:factory=>{state.factory=factory;return {handlers:{},auth:()=>{}}}},
  'next-auth/providers/google':{default:options=>({id:'google',...options})},
  'next-auth/providers/credentials':{default:options=>({id:'credentials',...options})},
  '@auth/drizzle-adapter':{DrizzleAdapter:()=>({})},
  'drizzle-orm/d1':{drizzle:()=>db},
  'drizzle-orm':{eq:(...args)=>args,and:(...args)=>args},
 }
 async function load(file){
  if(cache.has(file))return cache.get(file)
  if(mocks[file]){const module=new SyntheticModule(Object.keys(mocks[file]),function(){for(const [key,value] of Object.entries(mocks[file]))this.setExport(key,value)},{context});cache.set(file,module);return module}
  let source
  if(file.endsWith('/src/db/schema.ts'))source='export const users={email:"email",id:"id",password:"password"}'
  else source=stripTypeScriptTypes(await readFile(file,'utf8'),{mode:'transform'})
  const module=new SourceTextModule(source,{context,identifier:file});cache.set(file,module)
  await module.link(async(specifier,referencing)=>{let target=specifier;if(specifier.startsWith('@/'))target=resolve(specifier.slice(2));else if(specifier.startsWith('.'))target=resolve(dirname(referencing.identifier),specifier);if(!mocks[target]&&!target.endsWith('.ts'))target+='.ts';return load(target)})
  return module
 }
 const module=await load(resolve(entry));await module.evaluate()
 return {state,module,post:async(body,headers={})=>{const req=new Request('https://vndocs.net/api/test',{method:'POST',body:typeof body==='string'?body:JSON.stringify(body),headers:{'Content-Type':'application/json',...headers}});return module.namespace.POST(req)}}
}

test('bounded body parsing rejects oversized streams, malformed JSON and arrays',async()=>{
 for(const [body,status] of [['x'.repeat(32769),413],['{bad',400],['[]',400],['null',400]])await assert.rejects(boundedJson(new Request('https://vndocs.net',{method:'POST',body})),error=>error.status===status)
 assert.deepEqual(await boundedJson(new Request('https://vndocs.net',{method:'POST',body:'{"text":"Hello"}'})),{text:'Hello'})
})
test('login redirects cannot execute JavaScript or leave the website',()=>{
 for(const value of ['javascript:alert(1)','https://example.invalid','//example.invalid','/\\example.invalid','/\n/example.invalid',''])assert.equal(safeLoginRedirect(value),'/')
 assert.equal(safeLoginRedirect('/speaking?retry=1#answer'),'/speaking?retry=1#answer')
})
test('salted password hashes verify correctly and reject malformed hashes',async()=>{
 const a=await hashPassword('fixture-password'),b=await hashPassword('fixture-password');assert.notEqual(a,b);assert.ok(!a.includes('fixture-password'));assert.ok(await verifyPassword(a,'fixture-password'));assert.equal(await verifyPassword(a,'wrong'),false);assert.equal(await verifyPassword('pbkdf2-sha256$garbage','anything'),false)
})
test('authentication has no default administrator password, OAuth secret or session signing secret',async()=>{
 const h=await harness('auth.ts'),config=await h.state.factory();assert.equal(config.secret,undefined);assert.equal(config.debug,false);assert.ok(!config.providers.some(p=>p.id==='google'))
 const credentials=config.providers.find(p=>p.id==='credentials');assert.equal(await credentials.authorize({email:'admin@vndocs.net',password:'282005'},new Request('https://vndocs.net')),null)
 const configured=await harness('auth.ts',{WEB_ADMIN_PASSWORD:'configured-fixture-password',AUTH_SECRET:'fixture-secret',AUTH_GOOGLE_ID:'fixture-id',AUTH_GOOGLE_SECRET:'fixture-google'})
 const secure=await configured.state.factory();assert.equal(secure.secret,'fixture-secret');assert.ok(secure.providers.some(p=>p.id==='google'));assert.equal((await secure.providers.find(p=>p.id==='credentials').authorize({email:'admin@vndocs.net',password:'configured-fixture-password'},new Request('https://vndocs.net'))).role,'admin')
})
test('ordinary legacy passwords migrate after successful login; plaintext admin credentials fail closed',async()=>{
 const h=await harness('auth.ts',{DB:{},AUTH_SECRET:'fixture-secret'}),config=await h.state.factory(),credentials=config.providers.find(p=>p.id==='credentials')
 h.state.user={id:'fixture',email:'learner@example.invalid',password:'old-password',role:'user'}
 assert.ok(await credentials.authorize({email:h.state.user.email,password:'old-password'},new Request('https://vndocs.net')))
 assert.ok(await verifyPassword(h.state.updated.password,'old-password'))
 h.state.user={...h.state.user,role:'admin'};assert.equal(await credentials.authorize({email:h.state.user.email,password:'old-password'},new Request('https://vndocs.net')),null)
})
test('CAPTCHA rejects fake tokens, missing/test secrets, bad hostnames and upstream failure',async()=>{
 for(const token of ['turnstile-fallback-token','XXXX.fixture','cf-verified-session-token']){const h=await harness('app/api/verify-turnstile/route.ts');assert.equal((await h.post({token})).status,400);assert.equal(h.state.calls.length,0)}
 for(const env of [{},{TURNSTILE_SECRET_KEY:'1x0000000000000000000000000000000AA'}]){const h=await harness('app/api/verify-turnstile/route.ts',env);assert.equal((await h.post({token:'real-fixture-token'})).status,503);assert.equal(h.state.calls.length,0)}
 const h=await harness('app/api/verify-turnstile/route.ts',{TURNSTILE_SECRET_KEY:'configured-fixture-secret'});h.state.outcome={success:true,hostname:'attacker.invalid'};assert.equal((await h.post({token:'real-fixture-token'})).status,403);h.state.outcome={success:false,hostname:'vndocs.net'};assert.equal((await h.post({token:'real-fixture-token'})).status,403);h.state.outcome={success:true,hostname:'vndocs.net'};assert.equal((await h.post({token:'real-fixture-token'})).status,200)
})
test('translation validates language, JSON, request size and origin before calling providers',async()=>{
 const h=await harness('app/api/translate/route.ts')
 for(const [body,status,headers] of [[{text:'Hello',from:{},to:'vi'},400],['{bad',400],[{text:'x'.repeat(40000)},413],[{text:'Hello'},403,{origin:'https://attacker.invalid'}]]){const response=await h.post(body,headers);assert.equal(response.status,status);assert.equal(h.state.calls.length,0)}
 const response=await h.post({text:'Hello',from:'en',to:'vi'});assert.equal(response.status,200);assert.equal((await response.json()).translatedText,'Xin chào')
})
test('retired file conversion routes return 410 without reading or forwarding files',async()=>{
 for(const entry of ['app/api/aws-merge/route.ts','app/api/convert/[...path]/route.ts']){const h=await harness(entry);assert.equal((await h.post('file fixture')).status,410);assert.equal(h.state.calls.length,0)}
})
test('security response headers preserve microphone access for Speaking',async()=>{
 const {default:config}=await import('../next.config.js');const headers=(await config.headers()).find(row=>row.source==='/:path*').headers
 const values=Object.fromEntries(headers.map(h=>[h.key,h.value]));assert.equal(values['X-Content-Type-Options'],'nosniff');assert.match(values['Content-Security-Policy'],/frame-ancestors 'self'/);assert.match(values['Permissions-Policy'],/microphone=\(self\)/)
})
