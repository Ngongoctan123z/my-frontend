import { readFile } from 'node:fs/promises'

const token = process.env.CLOUDFLARE_API_TOKEN?.trim()
const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
if (!token || !account) {
  console.error('::error::Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in repository Actions secrets.')
  process.exit(1)
}

const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'))
const worker = config.name
const root = `/accounts/${encodeURIComponent(account)}`

async function inspect(path, label) {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    const body = await response.json()
    // Never log headers, token values or the full response. GitHub Actions
    // also masks configured secrets, including the account identifier.
    const errors = (body.errors || []).map(error => ({ code: error.code, message: error.message }))
    console.log(`${label}: HTTP ${response.status}; success=${body.success === true}`)
    if (errors.length) console.log(`${label} errors: ${JSON.stringify(errors)}`)
    return { ok: response.ok && body.success === true, status: response.status, body }
  } catch (error) {
    console.log(`${label}: request could not complete (${error.name})`)
    return { ok: false, status: 0, body: {} }
  }
}

const verification = await inspect('/user/tokens/verify', 'Token verification')
if (verification.ok) console.log(`Token status: ${verification.body.result?.status || 'unknown'}`)

const target = await inspect(`${root}/workers/services/${encodeURIComponent(worker)}`, `Worker ${worker}`)
if (target.ok) {
  console.log('Configured Cloudflare account and Worker are accessible.')
  process.exit(0)
}

// Additional read-only diagnostics distinguish missing resources from wrong
// account/token scope without exposing unrelated project names or credentials.
const scripts = await inspect(`${root}/workers/scripts`, 'Worker access in configured account')
if (scripts.ok && Array.isArray(scripts.body.result)) {
  console.log(`Configured Worker present in script list: ${scripts.body.result.some(script => script.id === worker)}`)
}
const domains = await inspect(`${root}/workers/domains`, 'Custom-domain access in configured account')
if (domains.ok && Array.isArray(domains.body.result)) {
  const configuredDomains = new Set((config.routes || []).filter(route => route.custom_domain).map(route => route.pattern))
  const matches = domains.body.result.filter(domain => configuredDomains.has(domain.hostname))
  for (const match of matches) console.log(`Domain ${match.hostname} points to Worker ${match.service} (${match.environment})`)
  if (!matches.length) console.log('Configured custom domains were not found in this account.')
}

if (target.status === 404 && scripts.ok) {
  console.log('Worker is not created yet; allow Wrangler to perform the initial deployment.')
  process.exit(0)
}
console.error('::error::Cloudflare rejected access to the configured Worker. Check the account ID and API token Worker permissions.')
process.exit(1)
