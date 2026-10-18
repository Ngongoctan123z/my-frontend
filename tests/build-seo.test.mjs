import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

async function loadSeo({ bindingAvailable = true, rows = [], dbError = null } = {}) {
  const state = { dbCalls: 0, logs: [] }
  const context = createContext({ URL, console: { error: (...args) => state.logs.push(args) } })
  const query = { from() { return this }, where() { return this }, limit() { return this }, then(resolve) { return Promise.resolve(rows).then(resolve) } }
  const external = {
    '@/src/db': { getOptionalDb: async () => {
      if (!bindingAvailable) return null
      state.dbCalls++
      if (dbError) throw dbError
      return { select: () => query }
    } },
    '@/src/db/schema': { systemConfigs: { key: 'key' } },
    'drizzle-orm': { eq: () => {}, inArray: () => {} },
  }
  const cache = new Map()
  async function load(id) {
    if (cache.has(id)) return cache.get(id)
    let module
    if (external[id]) {
      const values = external[id]
      module = new SyntheticModule(Object.keys(values), function () {
        for (const [name, value] of Object.entries(values)) this.setExport(name, value)
      }, { context })
    } else {
      module = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../src/utils/serverSeo.ts', import.meta.url), 'utf8')), { context })
    }
    cache.set(id, module)
    await module.link(specifier => load(specifier))
    return module
  }
  const module = await load('seo')
  await module.evaluate()
  return { seo: module.namespace, state }
}

test('static build returns complete fallback metadata without accessing D1 or logging errors', async () => {
  const { seo, state } = await loadSeo({ bindingAvailable: false })
  const metadata = await seo.getRouteMetadata('/ai-grader/toeic', 'TOEIC test', 'Fallback description')
  assert.equal(metadata.title, 'TOEIC test')
  assert.equal(metadata.description, 'Fallback description')
  assert.equal(metadata.alternates.canonical, 'https://vndocs.net/ai-grader/toeic')
  assert.equal(metadata.openGraph.images[0].width, 1200)
  assert.equal(state.dbCalls, 0)
  assert.equal(state.logs.length, 0)
})

test('static build custom SEO returns null without D1 access', async () => {
  const { seo, state } = await loadSeo({ bindingAvailable: false })
  assert.equal(await seo.getCustomRouteSeo('/'), null)
  assert.equal(state.dbCalls, 0)
})

test('runtime continues to load admin metadata from D1 and applies route overrides', async () => {
  const { seo, state } = await loadSeo({ rows: [
    { key: 'SEO_TITLE', value: 'Global title' },
    { key: 'SEO_DESCRIPTION', value: 'Global description' },
    { key: 'SEO_OG_IMAGE', value: 'https://vndocs.net/global.png' },
    { key: 'SEO_ROUTE_/', value: JSON.stringify({ title: 'Admin title', description: 'Admin description', ogImage: 'https://vndocs.net/route.png' }) },
  ] })
  const metadata = await seo.getRouteMetadata('/', 'Fallback', 'Fallback description')
  assert.equal(metadata.title, 'Admin title')
  assert.equal(metadata.description, 'Admin description')
  assert.equal(metadata.openGraph.images[0].url, 'https://vndocs.net/route.png')
  assert.equal(state.dbCalls, 1)
})

test('unexpected runtime database errors remain visible while SEO falls back safely', async () => {
  const { seo, state } = await loadSeo({ dbError: new Error('D1 query failed') })
  const metadata = await seo.getRouteMetadata('/', 'Fallback', 'Description')
  assert.equal(metadata.title, 'Fallback')
  assert.equal(state.dbCalls, 1)
  assert.equal(state.logs.length, 1)
})

async function loadDatabase({ env = {}, cloudflareEnv = null } = {}) {
  const state = { cloudflareEnv, drizzleCalls: [] }
  const context = createContext({ process: { env } })
  const dependencies = {
    'drizzle-orm/d1': { drizzle: binding => { state.drizzleCalls.push(binding); return { binding } } },
    './schema': {},
    '@opennextjs/cloudflare': { getCloudflareContext: () => {
      if (!state.cloudflareEnv) throw new Error('No Cloudflare context during build')
      return { env: state.cloudflareEnv }
    } },
  }
  const module = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../src/db/index.ts', import.meta.url), 'utf8')), { context })
  await module.link(async name => {
    const values = dependencies[name]
    const dependency = new SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value)
    }, { context })
    return dependency
  })
  await module.evaluate()
  return { database: module.namespace, state }
}

test('missing build binding returns null only for optional database consumers', async () => {
  const { database, state } = await loadDatabase()
  assert.equal(await database.getOptionalDb(), null)
  await assert.rejects(database.getDb(), /Database binding "DB" not found/)
  assert.equal(state.drizzleCalls.length, 0)
})

test('runtime D1 binding is still used by required and optional consumers', async () => {
  const binding = { name: 'runtime-d1' }
  const { database } = await loadDatabase({ cloudflareEnv: { DB: binding } })
  assert.equal((await database.getDb()).binding, binding)
  assert.equal((await database.getOptionalDb()).binding, binding)
})

test('database binding is resolved per request and is not cached across Workers requests', async () => {
  const first = { name: 'first-d1' }
  const second = { name: 'second-d1' }
  const { database, state } = await loadDatabase({ cloudflareEnv: { DB: first } })
  assert.equal((await database.getDb()).binding, first)
  state.cloudflareEnv = { DB: second }
  assert.equal((await database.getDb()).binding, second)
})

test('explicit runtime binding remains supported', async () => {
  const binding = { name: 'explicit-d1' }
  const { database } = await loadDatabase({ env: { DB: binding } })
  assert.equal((await database.getDb()).binding, binding)
})

test('runtime custom SEO queries D1 and parses the saved object', async () => {
  const { seo, state } = await loadSeo({ rows: [{ value: JSON.stringify({ title: 'Saved title' }) }] })
  assert.equal((await seo.getCustomRouteSeo('/')).title, 'Saved title')
  assert.equal(state.dbCalls, 1)
})

test('invalid saved SEO JSON does not break metadata generation', async () => {
  const { seo } = await loadSeo({ rows: [{ key: 'SEO_ROUTE_/', value: '{broken' }] })
  assert.equal((await seo.getRouteMetadata('/', 'Fallback', 'Description')).title, 'Fallback')
  assert.equal(await seo.getCustomRouteSeo('/'), null)
})
