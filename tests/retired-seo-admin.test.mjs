import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'

async function loadAdmin(initial, accessError = '') {
  const state = { rows: new Map(Object.entries(initial)), dbCalls: 0, deletes: [] }
  const context = createContext({ Response, TextEncoder, crypto, console, process: { env: {} } })
  const db = {
    select: () => ({ from: async () => [...state.rows].map(([key, value]) => ({ key, value })) }),
    delete: () => ({ where: async condition => {
      const keys = condition.keys || [condition.value]
      assert.ok(keys.length <= 50, 'D1 bind limits must be respected')
      state.deletes.push([...keys]); for (const key of keys) state.rows.delete(key)
    } }),
    insert: () => ({ values: row => ({ onConflictDoUpdate: async () => { state.rows.set(row.key, row.value) } }) }),
  }
  const noop = async () => { throw new Error('Unrelated operation must not run') }
  const fixtures = {
    '../ai-grader/writing-bank': { ensureWritingBank: noop, writingCatalog: noop, getWritingSet: noop },
    '@/src/lib/writingBank': { WRITING_EXAMS: [] },
    '@/src/lib/adminAccess': { checkAdmin: async () => { if (accessError) throw new Error(accessError) } },
    '../ai-grader/toeic-photo-bank': { ensureToeicPhotoBank: noop },
    '../ai-grader/toeic-email-bank': { ensureToeicEmailBank: noop },
    '../ai-grader/toeic-sets': { listToeicExamSets: noop, mutateToeicExamSet: noop },
    '@/src/data/toeicWriting': { parseToeicPictures: noop },
    'next/server': { NextRequest: undefined, NextResponse: { json: (value, options) => Response.json(value, options) } },
    '@/auth': { auth: noop },
    '@/src/db': { getDb: async () => { state.dbCalls++; return db } },
    '@/src/db/schema': { users: {}, prompts: {}, systemConfigs: { key: 'key' }, speakingPrompts: {} },
    'drizzle-orm': { desc: noop, eq: (key, value) => ({ value }), inArray: (key, keys) => ({ keys }) },
    '../speaking/question-bank': { ensureQuestionBank: noop, mutateQuestionBank: noop },
    '../speaking/validation': { SpeakingRequestError: class extends Error {} },
    './writing-overview': { writingOverview: noop, ieltsPreviewSets: noop },
  }
  const cache = new Map()
  async function load(name) {
    if (cache.has(name)) return cache.get(name)
    let module
    if (fixtures[name]) {
      const values = fixtures[name]
      module = new SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value) }, { context })
    } else {
      const file = name === 'admin' ? 'app/api/admin/route.ts' : 'src/lib/siteSections.ts'
      module = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../' + file, import.meta.url), 'utf8')), { context })
    }
    cache.set(name, module); await module.link(load); return module
  }
  const module = await load('admin'); await module.evaluate()
  return { state, api: module.namespace }
}
const configRequest = { nextUrl: new URL('https://vndocs.net/api/admin?type=configs') }
const saveRequest = payload => ({ json: async () => ({ action: 'save_configs', payload }) })

test('retired SEO cleanup requires the existing administrator authorization', async () => {
  for (const [reason, status] of [['Unauthorized', 401], ['Forbidden', 403]]) {
    const { state, api } = await loadAdmin({ 'SEO_ROUTE_/tool': 'old' }, reason)
    assert.equal((await api.GET(configRequest)).status, status)
    assert.equal((await api.POST(saveRequest({ 'SEO_ROUTE_/tool': 'old' }))).status, status)
    assert.equal(state.dbCalls, 0); assert.equal(state.deletes.length, 0)
  }
})

test('admin config loading removes all retired saved SEO in bounded batches', async () => {
  const active = JSON.stringify({ title: 'IELTS Writing practice', h1: 'Write a new essay' })
  const initial = {
    'SEO_ROUTE_/ai-grader/ielts': active, 'SEO_ROUTE_/speaking': '{"title":"Speaking"}',
    SEO_TITLE: 'Gộp File PDF | VNDocs', SEO_DESCRIPTION: 'Luyện Writing và Speaking',
    GPMPAY_CONFIG: 'private payment config', CUSTOM_SETTING: 'Convert JPG files',
  }
  for (let n = 0; n < 123; n++) initial[`SEO_ROUTE_/en/tool/convert/${n}`] = '{"title":"Old converter"}'
  for (const path of ['/convert', '/tools/merge-files', '/de-thi-thpt-2026', '/en/vao-lop-10/toan']) initial['SEO_ROUTE_' + path] = '{"title":"old"}'
  const { state, api } = await loadAdmin(initial)
  const response = await api.GET(configRequest), data = await response.json()
  assert.equal(response.status, 200)
  assert.equal(data['SEO_ROUTE_/ai-grader/ielts'], active)
  assert.equal(data.SEO_DESCRIPTION, initial.SEO_DESCRIPTION)
  assert.equal(data.GPMPAY_CONFIG, undefined)
  assert.equal(state.rows.get('GPMPAY_CONFIG'), initial.GPMPAY_CONFIG)
  assert.equal(state.rows.get('CUSTOM_SETTING'), initial.CUSTOM_SETTING)
  assert.ok(!Object.keys(data).some(key => key.includes('/tool') || key.includes('/convert') || key.includes('de-thi') || key.includes('vao-lop-10')))
  assert.equal(data.SEO_TITLE, undefined)
  assert.equal(state.deletes.flat().length, 128)
})

test('direct config writes cannot restore retired SEO and preserve key/payment safeguards', async () => {
  const { state, api } = await loadAdmin({ GROQ_API_KEY: 'existing-private-key', 'SEO_ROUTE_/tool': 'old' })
  const active = JSON.stringify({ title: 'Practice IELTS Writing', description: 'Detailed writing feedback' })
  const response = await api.POST(saveRequest({
    'SEO_ROUTE_/tool': '{"title":"New converter"}', 'SEO_ROUTE_/en/convert/pdf': 'anything',
    'SEO_ROUTE_/ai-grader': active, SEO_TITLE: 'Luyện Writing và Speaking',
    GROQ_API_KEY: 'masked***key', CUSTOM_SETTING: 'Merge PDF files',
  }))
  assert.equal(response.status, 200)
  assert.equal(state.rows.has('SEO_ROUTE_/tool'), false)
  assert.equal(state.rows.has('SEO_ROUTE_/en/convert/pdf'), false)
  assert.equal(state.rows.get('SEO_ROUTE_/ai-grader'), active)
  assert.equal(state.rows.get('GROQ_API_KEY'), 'existing-private-key')
  assert.equal(state.rows.get('CUSTOM_SETTING'), 'Merge PDF files')
  assert.equal((await api.POST(saveRequest({ GPMPAY_CONFIG: 'override' }))).status, 400)
  assert.equal(state.rows.has('GPMPAY_CONFIG'), false)
})
