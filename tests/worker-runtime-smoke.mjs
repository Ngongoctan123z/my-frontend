// Exercise the built production artifact in workerd, with local D1/R2 only.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd(), directory = path.join(root, '.worker-smoke')
await mkdir(directory, { recursive: true })
const config = JSON.parse(await readFile(path.join(root, 'wrangler.jsonc'), 'utf8'))
delete config.build; delete config.routes
config.main = path.join(root, '.open-next/worker.js')
config.assets.directory = path.join(root, '.open-next/assets')
config.vars = { ...config.vars, AUTH_SECRET: 'worker-smoke-test-secret-never-use-in-production', AUTH_TRUST_HOST: 'true', NEXTAUTH_URL: 'http://127.0.0.1:8879' }
const configPath = path.join(directory, 'wrangler.json')
await writeFile(configPath, JSON.stringify(config))
const child = spawn(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'), 'dev', '--local', '--config', configPath, '--ip', '127.0.0.1', '--port', '8879', '--inspector-port', '8880', '--persist-to', path.join(directory, 'state')], {
  cwd: root, env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'],
})
let log = '', exited = false
const capture = chunk => { log = (log + chunk.toString()).slice(-100000) }
child.stdout.on('data', capture); child.stderr.on('data', capture)
child.on('exit', () => { exited = true })
child.on('error', error => { capture(String(error)); exited = true })
let failure
try {
  const deadline = Date.now() + 90000
  while (true) {
    if (exited) throw new Error('Local production Worker exited during startup')
    try {
      await fetch('http://127.0.0.1:8879/robots.txt', { signal: AbortSignal.timeout(1500) })
      break
    } catch (error) {
      if (Date.now() >= deadline) throw new Error('Worker did not become reachable: ' + error.message)
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  const checks = [
    ['/', 200], ['/en', 200], ['/ai-grader', 200], ['/speaking', 200],
    ['/sitemap.xml', 200], ['/api/auth/session', 200],
    ['/api/speaking/audio/' + '0'.repeat(64) + ':0', 401], ['/api/admin?type=configs', 401],
    ['/tool', 410], ['/convert', 410], ['/en/tools/convert', 410], ['/de-thi-thpt-2026', 410],
  ]
  for (const [route, expected] of checks) {
    const response = await fetch('http://127.0.0.1:8879' + route, { redirect: 'manual', signal: AbortSignal.timeout(20000) })
    const body = await response.text()
    console.log('WORKER_HTTP', JSON.stringify({ route, status: response.status, expected }))
    assert.equal(response.status, expected, route + ' failed in workerd: ' + body.slice(0, 1500))
    if (expected === 410) assert.match(response.headers.get('x-robots-tag') || '', /noindex/)
    if (route === '/') assert.match(body, /Writing.*Speaking/)
  }
  console.log('PASS built Worker serves practice pages, rejects anonymous private requests and retires old URLs')
} catch (error) { failure = error }
finally {
  child.kill('SIGTERM')
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 5000))])
  if (!exited) child.kill('SIGKILL')
  await mkdir('test-results', { recursive: true })
  await writeFile('test-results/worker-runtime.log', log)
  if (failure) console.error('WORKER_RUNTIME_LOG\n' + log.slice(-45000))
}
if (failure) throw failure
