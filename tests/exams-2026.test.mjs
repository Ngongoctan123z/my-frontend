import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'

let legacyCalls = [], offline = false
const legacyRows = Array.from({ length: 53 }, (_, index) => ({ id: 1000 + index, examType: 'VAO_10', subject: 'Toán', province: 'Hà Nội', year: 2025, title: 'Đề cũ ' + index, viewCount: 100 - index, createdAt: '2025-06-01T00:00:00Z', fileUrl: 'https://example.test/legacy.pdf' }))
globalThis.__examArchiveFetch = async path => {
  legacyCalls.push(path)
  if (offline) throw new Error('Legacy backend unavailable')
  const url = new URL(path, 'https://fixture.test'), page = Number(url.searchParams.get('page') || 0), limit = Math.min(5, Number(url.searchParams.get('limit') || 12))
  return { data: legacyRows.slice(page * limit, (page + 1) * limit), total: legacyRows.length, page, limit }
}
const bundle = await build({ entryPoints: ['src/services/examService.ts'], bundle: true, platform: 'node', format: 'esm', write: false, plugins: [{ name: 'legacy-fixture', setup(builder) {
  builder.onResolve({ filter: /^\.\/api$/ }, () => ({ path: 'api-fixture', namespace: 'fixture' }))
  builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const apiFetch=(path)=>globalThis.__examArchiveFetch(path)' }))
} }] })
const service = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'))
const rows = JSON.parse(await readFile('src/data/exams2026.json', 'utf8'))
const slugify = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').replaceAll('Đ', 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

test('every archived page identifies a downloaded PDF and its source, without invented answer claims', () => {
  assert.ok(rows.length > 0)
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length)
  assert.equal(new Set(rows.map(row => row.slugIdentifier)).size, rows.length)
  for (const row of rows) {
    assert.equal(row.year, 2026); assert.ok(row.id >= 260000000)
    assert.ok(row.fileUrl.startsWith('https://vndocs.net/exam-papers/2026/'))
    assert.ok(row.fileSize > 100 && row.fileSize < 25 * 1024 * 1024)
    assert.match(row.assetSha256, /^[a-f0-9]{64}$/); assert.ok(row.pdfPageCount > 0)
    assert.ok(row.sourceUrl.startsWith('https://')); assert.ok(row.sourcePublisher)
    assert.ok(row.seoTitle.includes('2026') && row.description.includes(row.subject))
    assert.equal(row.hasAnswers, false); assert.equal(row.answerFileUrl, null)
  }
})

test('2026 subject/province search and pagination are independent of the old backend', async () => {
  legacyCalls = []; offline = true
  const all = await service.getExams({ year: 2026, limit: 5000 })
  assert.equal(all.total, rows.length)
  const sample = rows[0], filtered = await service.getExams({ year: 2026, subject: sample.subject, province: sample.province, limit: 5000 })
  assert.ok(filtered.data.every(row => row.subject === sample.subject && row.province === sample.province))
  const first = await service.getExams({ year: 2026, limit: 2 }), second = await service.getExams({ year: 2026, limit: 2, page: 1 })
  assert.equal(new Set([...first.data, ...second.data].map(row => row.id)).size, Math.min(rows.length, 4))
  assert.deepEqual(legacyCalls, [])
})

test('canonical detail lookup, saved IDs and download point to the local PDF', async () => {
  legacyCalls = []
  const row = rows[0], found = await service.getExamByPath({ examType: row.examType === 'THPT' ? 'thpt' : 'vao-10', subject: slugify(row.subject), province: slugify(row.province), year: 2026, slugIdentifier: row.slugIdentifier })
  assert.equal(found.id, row.id)
  assert.equal((await service.getExamById(row.id)).id, row.id)
  assert.equal((await service.requestDownload(row.id)).fileUrl, row.fileUrl)
  assert.deepEqual((await service.getExamsByIds(rows.slice(0, 3).map(row => row.id).reverse())).map(row => row.id), rows.slice(0, 3).map(row => row.id).reverse())
  await service.recordView(row.id)
  assert.deepEqual(legacyCalls, [])
})

test('existing catalog merges without pagination holes when the backend caps page size', async () => {
  offline = false; legacyCalls = []
  const all = await service.getExams({ limit: rows.length + 20 })
  assert.equal(all.total, rows.length + legacyRows.length)
  assert.equal(all.data.length, rows.length + 20)
  assert.equal(new Set(all.data.map(row => row.id)).size, all.data.length)
  const next = await service.getExams({ limit: 8, page: 1 })
  assert.deepEqual(next.data.map(row => row.id), all.data.slice(8, 16).map(row => row.id))
})

test('legacy outage retains archived results and still reports errors for missing historical data', async () => {
  offline = true
  const result = await service.getExams({ limit: 8 })
  assert.equal(result.total, rows.length)
  await assert.rejects(service.getExams({ year: 2024 }), /Legacy backend unavailable/)
})

test('published PDF assets match the byte length and checksum in their page metadata', { skip: process.env.EXAM_ARCHIVE_VERIFY_ASSETS !== '1' }, async () => {
  for (const row of rows) {
    const bytes = await readFile('public' + new URL(row.fileUrl).pathname)
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
    assert.equal(bytes.length, row.fileSize)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), row.assetSha256)
  }
})
