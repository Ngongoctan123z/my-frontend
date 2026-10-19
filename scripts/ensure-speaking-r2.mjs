// Runs before Wrangler bundles a deploy. Avoid an inherited binding on the first
// R2 release; provisioning is idempotent and never deletes/overwrites recordings.
const token = process.env.CLOUDFLARE_API_TOKEN
const account = process.env.CLOUDFLARE_ACCOUNT_ID || 'f73162ddb9b48f2f2c030e6780132b43'
const bucket = 'vndocs-speaking-audio'
if (!token) {
  console.log('R2 provisioning skipped: no deployment credentials in this build environment.')
  process.exit(0)
}
const base = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets`
async function call(url, method = 'GET', body) {
  const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30_000) })
  const data = await response.json()
  return { response, data }
}
const existing = await call(`${base}/${bucket}`)
if (existing.response.ok && existing.data.success) {
  console.log(`Private Speaking R2 bucket ready: ${bucket}`)
  process.exit(0)
}
if (existing.response.status !== 404 && !existing.data.errors?.some(error => /not found|does not exist|no such bucket/i.test(error.message || ''))) {
  throw new Error(`Unable to inspect Speaking R2 bucket (HTTP ${existing.response.status}; codes ${existing.data.errors?.map(error => error.code).join(',') || 'unknown'}). Check the Cloudflare build token's R2 permissions.`)
}
const created = await call(base, 'POST', { name: bucket })
if (!created.response.ok || !created.data.success) {
  // Another build may have created the same bucket between our GET and POST.
  const concurrent = await call(`${base}/${bucket}`)
  if (!concurrent.response.ok || !concurrent.data.success) throw new Error(`Unable to create Speaking R2 bucket (HTTP ${created.response.status}; codes ${created.data.errors?.map(error => error.code).join(',') || 'unknown'}).`)
}
console.log(`Private Speaking R2 bucket ready: ${bucket}`)
