// Runs inside the existing Cloudflare deployment; never prints secret values.
const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) {
  console.log('Authentication secret provisioning skipped: no deployment credentials.')
} else {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID || 'f73162ddb9b48f2f2c030e6780132b43'
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/my-frontend`
  async function call(path, method = 'GET', body) {
    const response = await fetch(base + path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)})
    const data = await response.json()
    if (!response.ok || !data.success) throw new Error(`Authentication secret provisioning failed (HTTP ${response.status}; codes ${data.errors?.map(e=>e.code).join(',') || 'unknown'}).`)
    return data.result
  }
  const settings = await call('/settings')
  const configured = new Set((settings.bindings || []).map(binding=>binding.name))
  for (const name of ['AUTH_SECRET','AUTH_GOOGLE_ID','AUTH_GOOGLE_SECRET']) {
    if (configured.has(name)) continue
    let value = process.env[name]
    if (!value && name === 'AUTH_SECRET') value = Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('')
    if (!value) continue
    if (name === 'AUTH_SECRET' && value.length < 32) throw new Error('AUTH_SECRET must contain at least 32 unpredictable characters.')
    await call('/secrets','PUT',{name,text:value,type:'secret_text'})
    configured.add(name)
    console.log(`Authentication binding saved: ${name}`)
  }
  console.log('AUTH_CONFIGURATION_STATUS',JSON.stringify(Object.fromEntries(['AUTH_SECRET','AUTH_GOOGLE_ID','AUTH_GOOGLE_SECRET'].map(name=>[name,configured.has(name)]))))
}
