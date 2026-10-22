import assert from 'node:assert/strict'
const origin='https://vndocs.net'
const request=(path,body)=>fetch(origin+path,{method:body===undefined?'GET':'POST',headers:body===undefined?undefined:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'manual',signal:AbortSignal.timeout(15000)})
const home=await request('/');assert.equal(home.status,200);assert.equal(home.headers.get('x-content-type-options'),'nosniff');assert.match(home.headers.get('content-security-policy')||'',/frame-ancestors 'self'/);assert.match(home.headers.get('permissions-policy')||'',/microphone=\(self\)/)
for(const path of ['/api/admin?type=configs','/api/debug-env','/api/admin/payments'])assert.equal((await request(path)).status,401,path+' must reject anonymous access')
for(const path of ['/api/aws-merge','/api/convert/pdf'])assert.equal((await request(path,{fixture:true})).status,410,path+' must not forward files')
assert.equal((await request('/api/translate',{text:'Hello',from:{},to:'vi'})).status,400)
assert.equal((await request('/api/verify-turnstile',{token:'turnstile-fallback-token'})).status,400)
assert.equal((await request('/api/auth/session')).status,200,'Session secret must be configured in production')
const providers=await request('/api/auth/providers');assert.equal(providers.status,200);assert.ok((await providers.json()).google,'Google OAuth must remain configured in production')
console.log('PASS live security headers, private admin/payment guards, rejected fake CAPTCHA, retired file proxies and configured authentication')
