import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

async function loadSeo({ bindingAvailable = true, rows = [], dbError = null, rootMetadata = false, language = 'vi' } = {}) {
  const state = { dbCalls: 0, logs: [] }
  const context = createContext({ URL, console: { error: (...args) => state.logs.push(args) } })
  const query = { from() { return this }, where() { return this }, limit() { return this }, then(resolve) { return Promise.resolve(rows).then(resolve) } }
  const external = {
    'next/headers': { headers: async () => ({ get: () => language }) },
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
      let source = await readFile(new URL('../src/utils/serverSeo.ts', import.meta.url), 'utf8')
      if (id === '@/src/lib/pageSeo') source = await readFile(new URL('../src/lib/pageSeo.ts', import.meta.url), 'utf8')
      if (id === '@/src/lib/siteSections') source = await readFile(new URL('../src/lib/siteSections.ts', import.meta.url), 'utf8')
      if (rootMetadata && id === 'seo') {
        // Execute the actual metadata function from the TSX layout without
        // requiring React/Next's unrelated JSX rendering dependencies.
        const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8')
        const start = layout.indexOf('export async function generateMetadata')
        const end = layout.indexOf('export default async function RootLayout')
        assert.ok(start >= 0 && end > start)
        source = `import { headers } from 'next/headers';\nimport { PAGE_SEO } from '@/src/lib/pageSeo';\nimport { SITE_TITLE, SITE_DESCRIPTION, hasRetiredSeo } from '@/src/lib/siteSections';\nimport { getOptionalDb } from '@/src/db';\nimport { systemConfigs } from '@/src/db/schema';\nimport { inArray } from 'drizzle-orm';\n${layout.slice(start, end)}`
      }
      module = new SourceTextModule(stripTypeScriptTypes(source), { context })
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

test('root layout metadata falls back without D1 and preserves favicon declarations', async () => {
  const { seo, state } = await loadSeo({ bindingAvailable: false, rootMetadata: true })
  const metadata = await seo.generateMetadata()
  assert.match(metadata.title, /Luyện Writing và Speaking/)
  assert.equal(metadata.icons.shortcut, '/icon.png')
  assert.equal(metadata.icons.icon.length, 2)
  assert.equal(metadata.icons.apple[0].url, '/icon-512.png')
  assert.equal(state.dbCalls, 0)
  assert.equal(state.logs.length, 0)
})

test('root layout still reads global admin SEO from the runtime D1 binding', async () => {
  const { seo, state } = await loadSeo({ rootMetadata: true, rows: [
    { key: 'SEO_TITLE', value: 'Runtime global title' },
    { key: 'SEO_DESCRIPTION', value: 'Runtime description' },
    { key: 'SEO_OG_IMAGE', value: 'https://vndocs.net/runtime.png' },
  ] })
  const metadata = await seo.generateMetadata()
  assert.equal(metadata.title, 'Runtime global title')
  assert.equal(metadata.description, 'Runtime description')
  assert.equal(metadata.openGraph.images[0].url, 'https://vndocs.net/runtime.png')
  assert.equal(state.dbCalls, 1)
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

test('saved global exam SEO cannot restore the removed library in root metadata', async () => {
  const {seo}=await loadSeo({rootMetadata:true,rows:[{key:'SEO_TITLE',value:'VNDocs - Trang đề thi vào 10 và THPT'},{key:'SEO_DESCRIPTION',value:'Kho đề thi THPT miễn phí'},{key:'SEO_OG_IMAGE',value:'https://vndocs.net/old-exams.png'}]})
  const metadata=await seo.generateMetadata();assert.match(metadata.title,/Writing.*Speaking/);assert.ok(!metadata.description.includes('THPT'));assert.ok(!metadata.openGraph.images[0].url.includes('old-exams.png'))
})
test('retired route metadata is noindex and never reads its old saved D1 SEO', async () => {
 const {seo,state}=await loadSeo({rows:[{value:JSON.stringify({title:'Old exam title'})}]})
 const metadata=await seo.getRouteMetadata('/exams/vao-10/toan/ha-noi/2026','Old exam','Old description');assert.equal(metadata.robots.index,false);assert.equal(await seo.getCustomRouteSeo('/tai-lieu'),null);assert.equal(state.dbCalls,0)
})
test('old custom homepage exam SEO falls back to Writing and Speaking',async()=>{
 const {seo}=await loadSeo({rows:[{key:'SEO_ROUTE_/',value:JSON.stringify({title:'Đề thi vào lớp 10',description:'Kho tài liệu THPT',ogImage:'https://vndocs.net/old.png'})}]})
 const metadata=await seo.getRouteMetadata('/','Writing and Speaking','Language practice');assert.equal(metadata.title,'Writing and Speaking');assert.equal(metadata.description,'Language practice');assert.ok(!metadata.openGraph.images[0].url.includes('old.png'))
})


test('English metadata has its own copy, locale and reciprocal language links', async () => {
 const {seo}=await loadSeo({bindingAvailable:false})
 const en=await seo.getCoreMetadata('/en/ai-grader/toeic'),vi=await seo.getCoreMetadata('/ai-grader/toeic')
 assert.match(en.title,/Photos, Emails/);assert.match(vi.title,/ảnh, email/)
 assert.equal(en.openGraph.locale,'en_US');assert.equal(vi.openGraph.locale,'vi_VN')
 assert.deepEqual(JSON.parse(JSON.stringify(en.alternates.languages)),JSON.parse(JSON.stringify(vi.alternates.languages)))
 assert.equal(en.alternates.languages.vi,'https://vndocs.net/ai-grader/toeic')
 assert.equal(en.alternates.canonical,'https://vndocs.net/en/ai-grader/toeic')
 const speaking=await seo.getCoreMetadata('/speaking');assert.equal(speaking.alternates.languages.en,undefined)
})
test('English root never inherits Vietnamese global title or description',async()=>{
 const {seo}=await loadSeo({rootMetadata:true,language:'en',rows:[{key:'SEO_TITLE',value:'Tiêu đề tiếng Việt'},{key:'SEO_DESCRIPTION',value:'Mô tả tiếng Việt'}]})
 const metadata=await seo.generateMetadata();assert.match(metadata.title,/AI Writing/);assert.equal(metadata.openGraph.locale,'en_US');assert.ok(!metadata.description.includes('tiếng Việt'))
})

test('known legacy production copy upgrades field by field without dropping admin edits',async()=>{
 const {seo}=await loadSeo({rows:[{key:'SEO_ROUTE_/ai-grader/ielts',value:JSON.stringify({title:'Chấm IELTS Writing Online Miễn Phí Bằng AI | VNDocs',description:'Custom description',h1:'Custom heading',ogImage:'https://vndocs.net/custom.png'})}]})
 const metadata=await seo.getCoreMetadata('/ai-grader/ielts')
 assert.equal(metadata.title,'Chấm IELTS Writing Task 1, Task 2 với AI | VNDocs');assert.equal(metadata.description,'Custom description');assert.equal(metadata.openGraph.images[0].url,'https://vndocs.net/custom.png')
 assert.equal((await seo.getCustomRouteSeo('/ai-grader/ielts')).h1,'Custom heading')
 const {seo:custom}=await loadSeo({rows:[{key:'SEO_ROUTE_/ai-grader/ielts',value:JSON.stringify({title:'An intentional custom title',description:'Custom text'})}]})
 assert.equal((await custom.getCoreMetadata('/ai-grader/ielts')).title,'An intentional custom title')
})
