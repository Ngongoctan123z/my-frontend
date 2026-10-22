import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createContext,SourceTextModule} from 'node:vm'
const source=await readFile('scripts/ensure-auth-secret.mjs','utf8')
async function run(env,bindings=[],status=200){
 const calls=[],logs=[]
 const context=createContext({process:{env},crypto,Uint8Array,AbortSignal,console:{log:(...args)=>logs.push(args.join(' '))},fetch:async(url,options)=>{calls.push({url,options});return Response.json({success:status===200,result:{bindings:bindings.map(name=>({name}))},errors:status===200?[]:[{code:10000}]},{status})}})
 const module=new SourceTextModule(source,{context});await module.link(()=>{});await module.evaluate();return{calls,logs}
}
test('CI without deployment credentials performs no remote writes',async()=>{const result=await run({});assert.equal(result.calls.length,0)})
test('existing authentication configuration is preserved without rotation',async()=>{const result=await run({CLOUDFLARE_API_TOKEN:'fixture'},['AUTH_SECRET','AUTH_GOOGLE_ID','AUTH_GOOGLE_SECRET']);assert.equal(result.calls.length,1)})
test('missing session secret is generated securely and never logged',async()=>{const result=await run({CLOUDFLARE_API_TOKEN:'fixture'},['AUTH_GOOGLE_ID','AUTH_GOOGLE_SECRET']);const body=JSON.parse(result.calls[1].options.body);assert.equal(body.name,'AUTH_SECRET');assert.match(body.text,/^[a-f0-9]{64}$/);assert.ok(!result.logs.join(' ').includes(body.text));assert.equal(body.type,'secret_text')})
test('Google credentials are copied only from configured deployment bindings',async()=>{const result=await run({CLOUDFLARE_API_TOKEN:'fixture',AUTH_GOOGLE_ID:'configured-client',AUTH_GOOGLE_SECRET:'configured-oauth-secret'},['AUTH_SECRET']);assert.equal(result.calls.length,3);assert.ok(!result.logs.join(' ').includes('configured-oauth-secret'))})
test('permission failures stop without writing or exposing credentials',async()=>{await assert.rejects(run({CLOUDFLARE_API_TOKEN:'fixture'},[],403),/HTTP 403/)})
