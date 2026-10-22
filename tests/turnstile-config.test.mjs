import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {stripTypeScriptTypes} from 'node:module'
import {createContext,SourceTextModule,SyntheticModule} from 'node:vm'
const context=createContext({process:{env:{}}})
const module=new SourceTextModule(stripTypeScriptTypes(await readFile('src/lib/turnstileServer.ts','utf8')),{context})
await module.link(()=>new SyntheticModule(['getCloudflareContext'],function(){this.setExport('getCloudflareContext',async()=>({env:{TURNSTILE_SITE_KEY:'runtime-site-key',TURNSTILE_SECRET_KEY:'private-fixture-secret'}}))},{context}));await module.evaluate()
const {turnstileConfiguration,getTurnstileConfiguration}=module.namespace
for(const [label,env] of [['empty',{}],['site key only',{TURNSTILE_SITE_KEY:'site-key-fixture'}],['secret only',{TURNSTILE_SECRET_KEY:'private-fixture-secret'}],['public test keys',{TURNSTILE_SITE_KEY:'1x00000000000000000000AA',TURNSTILE_SECRET_KEY:'1x0000000000000000000000000000000AA'}]])test(label+' does not activate an unusable admin challenge',()=>assert.equal(turnstileConfiguration(env).siteKey,null))
test('a complete runtime key pair enables the widget without exposing the secret',async()=>{
 const result=await getTurnstileConfiguration();assert.equal(result.siteKey,'runtime-site-key');assert.ok(!JSON.stringify(result).includes('private-fixture-secret'))
})
test('existing NEXT_PUBLIC site key remains supported with a real server secret',()=>assert.equal(turnstileConfiguration({NEXT_PUBLIC_TURNSTILE_SITE_KEY:'public-site-key',TURNSTILE_SECRET_KEY:'private-fixture-secret'}).siteKey,'public-site-key'))
