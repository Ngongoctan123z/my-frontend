import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'
import { DatabaseSync } from 'node:sqlite'
import { createHmac } from 'node:crypto'

const secret='test-only-secret-000000000000000000000000'
async function harness(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(`CREATE TABLE user(id TEXT PRIMARY KEY,email TEXT UNIQUE,plan TEXT,planExpiresAt INTEGER,status TEXT);CREATE TABLE system_config(key TEXT PRIMARY KEY,value TEXT);INSERT INTO user VALUES('owner','owner@example.test','free',NULL,'active'),('other','other@example.test','free',NULL,'active')`)
 const state={email:'owner@example.test',admin:true,failReceipt:false,env:{},calls:0,randomBytes:[]}
 const db={prepare(query){return{query,params:[],bind(...params){this.params=params;return this},async first(){return sqlite.prepare(query).get(...this.params)||null},async all(){return{results:sqlite.prepare(query).all(...this.params)}},async run(){return{meta:sqlite.prepare(query).run(...this.params)}}}},async batch(statements){sqlite.exec('BEGIN');try{const result=statements.map(stmt=>{if(state.failReceipt&&stmt.query.startsWith('UPDATE gpm_payment_order')){state.failReceipt=false;throw new Error('D1 failure')}return sqlite.prepare(stmt.query).run(...stmt.params)});sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}}
 const external={'next/server':{NextResponse:Response},'@/auth':{auth:async()=>state.email?{user:{email:state.email}}:null},'@/src/db':{getDb:async()=>({$client:db})},'@/src/lib/adminAccess':{checkAdmin:async()=>{if(!state.admin)throw new Error(state.email?'Forbidden':'Unauthorized')}},'@/src/lib/rateLimit':{checkRateLimit:()=>({allowed:true,retryAfterSeconds:1})}}
 const fixtureCrypto={subtle:crypto.subtle,randomUUID:()=>crypto.randomUUID(),getRandomValues(bytes){if(state.randomBytes.length){bytes.set(state.randomBytes.shift());return bytes}return crypto.getRandomValues(bytes)}}
 const context=createContext({crypto:fixtureCrypto,TextEncoder,TextDecoder,Headers,Request,Response,URL,URLSearchParams,Uint8Array,Uint32Array,Date,setTimeout,clearTimeout,console:{error(){}},process:{env:state.env}}),cache=new Map()
 async function load(identifier){if(cache.has(identifier))return cache.get(identifier);const pending=(async()=>{let module;if(external[identifier]){const exports=external[identifier];module=new SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v)},{context,identifier})}else module=new SourceTextModule(stripTypeScriptTypes(await readFile(identifier,'utf8')),{context,identifier});await module.link((name,parent)=>{if(external[name])return load(name);let file=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(parent.identifier),name);return load(file.endsWith('.ts')?file:file+'.ts')});return module})();cache.set(identifier,pending);return pending}
 const main=await load(resolve('src/lib/gpmpay/handlers.ts'));await main.evaluate();const core=await load(resolve('src/lib/gpmpay/core.ts'));if(core.status!=='evaluated')await core.evaluate()
 const config={enabled:true,secret,bank:'MB',accountNumber:'0565683172',accountName:'TEST OWNER'};sqlite.prepare('INSERT INTO system_config VALUES(?,?)').run('GPMPAY_CONFIG',JSON.stringify(config))
 const call=async(name,body,url='https://vndocs.net/api/gpmpay/checkout',headers={})=>{const request=new Request(url,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});const response=await main.namespace[name](request);return{response,data:await response.json()}}
 const create=async(plan='plus',extra={})=>call('createCheckout',{plan,requestId:crypto.randomUUID(),...extra})
 const event=(order,extra={})=>({id:crypto.randomUUID(),gateway:'MB',accountNumber:'0565683172',referenceCode:crypto.randomUUID(),transactionDate:new Date().toISOString(),content:'Thanh toan '+order.code,transferType:'in',transferAmount:order.amount,source:'REAL',...extra})
 const webhook=async(data,opts={})=>{const raw=typeof data==='string'?data:JSON.stringify(data);const timestamp=opts.timestamp??Math.floor(Date.now()/1000);const signature=createHmac('sha256',opts.secret||secret).update(`${timestamp}.${raw}`).digest('hex');return call('receiveWebhook',raw,'https://vndocs.net/api/gpmpay/webhook',{'X-GPMPay-Signature':opts.header||`t=${timestamp},v1=${signature}`})}
 return{sqlite,state,db,call,create,event,webhook,core:core.namespace,main:main.namespace,config}
}
test('HMAC verifies exact raw body, rejects changed data, stale/future timestamps and malformed headers',async()=>{
 const h=await harness(),raw='{ "test":true }',t=Math.floor(Date.now()/1000),sig=createHmac('sha256',secret).update(`${t}.${raw}`).digest('hex')
 assert.equal(await h.core.verifyWebhook(raw,`t=${t},v1=${sig}`,secret),true)
 assert.equal(await h.core.verifyWebhook('{"test":true}',`t=${t},v1=${sig}`,secret),false)
 for(const header of [`t=${t-301},v1=${sig}`,`t=${t+301},v1=${sig}`,`t=${t},v1=abc`,`t=${t},v1=${sig},t=${t}`])assert.equal(await h.core.verifyWebhook(raw,header,secret),false)
})
test('connection checks return 200 after authentication but never create orders or grant plans',async()=>{
 const h=await harness();assert.equal((await h.webhook({test:true,source:'SIMULATED'})).response.status,200)
 assert.equal(h.sqlite.prepare("SELECT plan FROM user WHERE id='owner'").get().plan,'free')
 assert.equal(h.sqlite.prepare("SELECT value FROM system_config WHERE key='GPMPAY_LAST_TEST_AT'").get().value.length>0,true)
 assert.equal((await h.webhook({test:true},{secret:'wrong'})).response.status,401)
 h.sqlite.prepare("DELETE FROM system_config WHERE key='GPMPAY_CONFIG'").run();assert.equal((await h.webhook({test:true})).response.status,503)
})
test('simulated and outgoing transactions cannot activate real subscriptions',async()=>{
 const h=await harness(),{data}=await h.create();for(const extra of [{source:'SIMULATED'},{source:undefined},{transferType:'out'}])assert.equal((await h.webhook(h.event(data.order,extra))).data.status,'ignored')
 assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM gpm_payment_event').get().n,0)
 assert.equal(h.sqlite.prepare("SELECT plan FROM user WHERE id='owner'").get().plan,'free')
})
test('server fixes price and owner; idempotent checkout cannot change the selected plan',async()=>{
 const h=await harness(),id=crypto.randomUUID(),first=await h.create('plus',{requestId:id,amount:1,userId:'other'}),again=await h.create('plus',{requestId:id})
 assert.equal(first.data.order.amount,50000);assert.equal(first.data.order.code,again.data.order.code)
 assert.equal(h.sqlite.prepare('SELECT userId FROM gpm_payment_order').get().userId,'owner')
 assert.equal((await h.create('pro',{requestId:id})).response.status,409)
 assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM gpm_payment_order').get().n,1)
})
test('checkout generates six random characters and uses the exact reference in QR and private status',async()=>{
 const h=await harness(),codes=new Set()
 for(let i=0;i<40;i++){
  const {response,data}=await h.create();assert.equal(response.status,200)
  assert.match(data.order.code,/^[A-HJ-NP-Z2-9]{6}$/);codes.add(data.order.code)
  assert.equal(new URL(data.order.qrUrl).searchParams.get('addInfo'),data.order.code)
  assert.equal((await h.call('getStatus',undefined,'https://vndocs.net/api/gpmpay/status?code='+data.order.code)).response.status,200)
 }
 assert.equal(codes.size,40)
})
test('collisions retry without reusing paid or expired codes, while request retries remain idempotent',async()=>{
 const h=await harness();h.state.randomBytes=[new Uint8Array(6)];const first=await h.create()
 assert.equal(first.data.order.code,'AAAAAA');await h.webhook(h.event(first.data.order))
 h.state.randomBytes=[new Uint8Array(6),new Uint8Array(6).fill(1)];const second=await h.create()
 assert.equal(second.data.order.code,'BBBBBB')
 h.sqlite.prepare("UPDATE gpm_payment_order SET expiresAt=0 WHERE code='BBBBBB'").run()
 h.state.randomBytes=[new Uint8Array(6).fill(1),new Uint8Array(6).fill(2)];const third=await h.create()
 assert.equal(third.data.order.code,'CCCCCC')
 const requestId=crypto.randomUUID();const repeated=await Promise.all([h.create('plus',{requestId}),h.create('plus',{requestId})])
 assert.ok(repeated.every(result=>result.response.status===200));assert.equal(repeated[0].data.order.code,repeated[1].data.order.code)
 h.state.randomBytes=Array.from({length:10},()=>new Uint8Array(6))
 assert.equal((await h.create()).response.status,503)
 assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM gpm_payment_order').get().n,4)
})
test('short references survive bank memo words and case changes but reject embedded codes and ambiguous orders',async()=>{
 const h=await harness(),first=(await h.create()).data.order,second=(await h.create()).data.order
 for(const content of ['REF'+first.code+'X',first.code.slice(0,5),first.code+' '+second.code]){
  assert.equal((await h.webhook(h.event(first,{content}))).data.status,'unmatched')
  assert.equal(h.sqlite.prepare("SELECT plan FROM user WHERE id='owner'").get().plan,'free')
 }
 assert.equal((await h.webhook(h.event(first,{content:'CHUYEN KHOAN ('+first.code.toLowerCase()+'). '+first.code}))).data.status,'paid')
})
test('existing long references remain readable, idempotent and payable after six-character rollout',async()=>{
 const h=await harness(),requestId=crypto.randomUUID(),order=(await h.create('plus',{requestId})).data.order,legacy='VD'+'A'.repeat(20)
 h.sqlite.prepare('UPDATE gpm_payment_order SET code=? WHERE code=?').run(legacy,order.code)
 assert.equal((await h.create('plus',{requestId})).data.order.code,legacy)
 assert.equal((await h.call('getStatus',undefined,'https://vndocs.net/api/gpmpay/status?code='+legacy)).response.status,200)
 assert.equal((await h.webhook(h.event({...order,code:legacy}))).data.status,'paid')
 assert.equal(h.sqlite.prepare("SELECT plan FROM user WHERE id='owner'").get().plan,'plus')
})
test('real exact payment activates the purchased plan once under duplicate/concurrent deliveries',async()=>{
 const h=await harness(),{data}=await h.create(),event=h.event(data.order)
 const results=await Promise.all([h.webhook(event),h.webhook(event),h.webhook(event)])
 assert.ok(results.every(result=>result.response.status===200))
 const user=h.sqlite.prepare("SELECT * FROM user WHERE id='owner'").get(),expiry=user.planExpiresAt
 assert.equal(user.plan,'plus');assert.ok(Math.abs(expiry-Date.now()-30*86400000)<2000)
 await h.webhook(event);await h.webhook({...event,id:crypto.randomUUID()})
 assert.equal(h.sqlite.prepare("SELECT planExpiresAt FROM user WHERE id='owner'").get().planExpiresAt,expiry)
 assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM gpm_payment_event').get().n,1)
 assert.equal((await h.call('getStatus',undefined,'https://vndocs.net/api/gpmpay/status?code='+data.order.code)).data.order.status,'paid')
})
test('mismatched amount, destination, memo and transaction time never grant a package',async()=>{
 for(const extra of [{transferAmount:1},{accountNumber:'1234567890'},{gateway:'VCB'},{content:'vndocs-plus-ownerexampletest'},{transactionDate:new Date(Date.now()-3600000).toISOString()}]){
  const h=await harness(),{data}=await h.create();const result=await h.webhook(h.event(data.order,extra));assert.equal(result.data.status,'unmatched');assert.equal(h.sqlite.prepare("SELECT plan FROM user WHERE id='owner'").get().plan,'free')
 }
})
test('another account and unauthenticated callers cannot read or create private payment orders',async()=>{
 const h=await harness(),{data}=await h.create();h.state.email='other@example.test'
 assert.equal((await h.call('getStatus',undefined,'https://vndocs.net/api/gpmpay/status?code='+data.order.code)).response.status,404)
 h.state.email=null;assert.equal((await h.create()).response.status,401)
 assert.equal((await h.call('getStatus',undefined,'https://vndocs.net/api/gpmpay/status?code='+data.order.code)).response.status,401)
})
test('membership alone never marks a different unpaid order paid; same-plan renewal preserves remaining days',async()=>{
 const h=await harness(),expiry=Date.now()+10*86400000;h.sqlite.prepare("UPDATE user SET plan='plus',planExpiresAt=? WHERE id='owner'").run(expiry)
 const{data}=await h.create();assert.equal((await h.call('getStatus',undefined,'https://vndocs.net/api/gpmpay/status?code='+data.order.code)).data.order.status,'pending')
 await h.webhook(h.event(data.order));assert.equal(h.sqlite.prepare("SELECT planExpiresAt FROM user WHERE id='owner'").get().planExpiresAt,expiry+30*86400000)
})
test('an in-flight Plus payment cannot downgrade Pro or shorten a permanent package',async()=>{
 for(const expiry of [Date.now()+10*86400000,null]){const h=await harness(),{data}=await h.create();h.sqlite.prepare("UPDATE user SET plan='pro',planExpiresAt=? WHERE id='owner'").run(expiry);assert.equal((await h.webhook(h.event(data.order))).data.status,'review');assert.equal(h.sqlite.prepare("SELECT plan FROM user WHERE id='owner'").get().plan,'pro');assert.equal(h.sqlite.prepare("SELECT planExpiresAt FROM user WHERE id='owner'").get().planExpiresAt,expiry)}
})
test('receipt and membership updates roll back together, and retry safely recovers',async()=>{
 const h=await harness(),{data}=await h.create(),event=h.event(data.order);h.state.failReceipt=true
 assert.equal((await h.webhook(event)).response.status,503)
 assert.equal(h.sqlite.prepare("SELECT plan FROM user WHERE id='owner'").get().plan,'free')
 assert.equal((await h.webhook(event)).data.status,'paid')
})
test('configuration is authenticated, hides the secret, preserves it on blank saves and disables checkout until ready',async()=>{
 const h=await harness();h.state.admin=false;assert.equal((await h.call('adminGet')).response.status,403);assert.equal((await h.call('adminSave',h.config)).response.status,403);h.state.admin=true
 let result=await h.call('adminGet');assert.equal(JSON.stringify(result.data).includes(secret),false)
 result=await h.call('adminSave',{...h.config,secret:'',enabled:false});assert.equal(result.response.status,200)
 assert.equal((await h.create()).response.status,503);assert.equal((await h.webhook({test:true})).response.status,200)
 const cfg=JSON.parse(h.sqlite.prepare("SELECT value FROM system_config WHERE key='GPMPAY_CONFIG'").get().value);assert.equal(cfg.secret,secret)
 assert.equal((await h.call('adminSave',{...h.config,secret:'short'})).response.status,400)
 assert.equal((await h.call('createCheckout',{plan:'plus',requestId:crypto.randomUUID()},'https://vndocs.net/api/gpmpay/checkout',{Origin:'https://attacker.test'})).response.status,403)
})
test('malformed, unsigned, oversized and invalid-amount payloads fail safely',async()=>{
 const h=await harness();assert.equal((await h.call('receiveWebhook',{test:true})).response.status,401)
 assert.equal((await h.webhook('{invalid')).response.status,400)
 assert.equal((await h.webhook('x'.repeat(33000))).response.status,413)
 const{data}=await h.create();assert.equal((await h.webhook(h.event(data.order,{transferAmount:1.5}))).response.status,400)
 assert.equal((await h.main.webhookHealth()).status,200)
})
