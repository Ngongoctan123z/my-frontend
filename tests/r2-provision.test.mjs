import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SourceTextModule, createContext } from 'node:vm'
const source=await readFile(new URL('../scripts/ensure-speaking-r2.mjs',import.meta.url),'utf8')
async function run(responses,credentials=true) {
  const calls=[],logs=[]
  const context=createContext({AbortSignal,console:{log:message=>logs.push(message)},process:{env:credentials?{CLOUDFLARE_API_TOKEN:'fixture-token'}:{},exit:code=>{throw {exit:code}}},fetch:async(url,options)=>{calls.push({url,options});const next=responses.shift();if(!next)throw new Error('Unexpected Cloudflare request');return Response.json(next.body,{status:next.status})}})
  const module=new SourceTextModule(source,{context});await module.link(()=>{throw Error('Unexpected import')})
  try {await module.evaluate()}catch(error){if(error.exit!==0)throw error}
  return {calls,logs}
}
test('existing Speaking bucket is reused without any write',async()=>{
 const r=await run([{status:200,body:{success:true}}]);assert.equal(r.calls.length,1);assert.equal(r.calls[0].options.method,'GET');assert.equal(r.logs.some(line=>line.includes('fixture-token')),false)
})
test('first deployment creates only the named Speaking bucket',async()=>{
 const r=await run([{status:404,body:{success:false}},{status:200,body:{success:true}}]);assert.equal(r.calls.length,2);assert.equal(r.calls[1].options.method,'POST');assert.deepEqual(JSON.parse(r.calls[1].options.body),{name:'vndocs-speaking-audio'})
})
test('permission errors stop provisioning before attempting a write',async()=>{
 await assert.rejects(run([{status:403,body:{success:false,errors:[{code:10000,message:'Authentication error'}]}}]),/R2 permissions/)
})
test('R2 entitlement error points to account activation rather than token permissions',async()=>{
 await assert.rejects(run([{status:403,body:{success:false,errors:[{code:10042,message:'NotEntitled'}]}}]),/not activated.*10042.*r2\/overview/)
})
test('concurrent builds safely reuse a bucket created during deployment',async()=>{
 const r=await run([{status:404,body:{success:false}},{status:409,body:{success:false}},{status:200,body:{success:true}}]);assert.equal(r.calls.length,3)
})
test('build validation without deployment credentials makes no Cloudflare request',async()=>{
 const r=await run([],false);assert.equal(r.calls.length,0)
})
