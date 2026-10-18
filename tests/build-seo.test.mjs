import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

async function loadSeo({ build = false, rows = [], dbError = null } = {}) {
  const state = { dbCalls: 0, logs: [], env: build ? { VNDOCS_STATIC_BUILD: '1' } : {} }
  const context = createContext({ URL, process: { env: state.env }, console: { error: (...args) => state.logs.push(args) } })
  const query = { from() { return this }, where() { return this }, limit() { return this }, then(resolve) { return Promise.resolve(rows).then(resolve) } }
  const external = {
    '@/src/db': { getDb: async () => { state.dbCalls++; if (dbError) throw dbError; return { select: () => query } } },
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
      const path = id === '@/src/lib/buildPhase' ? 'src/lib/buildPhase.ts' : 'src/utils/serverSeo.ts'
      module = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../' + path, import.meta.url), 'utf8')), { context })
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
  const { seo, state } = await loadSeo({ build: true, dbError: new Error('DB unavailable during build') })
  const metadata = await seo.getRouteMetadata('/ai-grader/toeic', 'TOEIC test', 'Fallback description')
  assert.equal(metadata.title, 'TOEIC test')
  assert.equal(metadata.description, 'Fallback description')
  assert.equal(metadata.alternates.canonical, 'https://vndocs.net/ai-grader/toeic')
  assert.equal(metadata.openGraph.images[0].width, 1200)
  assert.equal(state.dbCalls, 0)
  assert.equal(state.logs.length, 0)
})

test('static build custom SEO returns null without D1 access', async () => {
  const { seo, state } = await loadSeo({ build: true })
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

test('runtime still reports a missing DB binding and returns safe SEO fallback', async () => {
  const { seo, state } = await loadSeo({ dbError: new Error('Database binding "DB" not found') })
  const metadata = await seo.getRouteMetadata('/', 'Fallback', 'Description')
  assert.equal(metadata.title, 'Fallback')
  assert.equal(state.dbCalls, 1)
  assert.equal(state.logs.length, 1)
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
