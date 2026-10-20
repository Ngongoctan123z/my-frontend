// Render the actual public page shells, not snapshots of their implementation.
// Only interactive tools, Next's Link wrapper and the external D1 adapter are
// replaced. React, page copy, metadata helpers and JSON-LD serialization are real.
import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const routes = ['/', '/en', '/speaking', ...['', '/en'].flatMap(prefix => ['', '/ielts', '/toeic', '/topik', '/hsk'].map(part => prefix + '/ai-grader' + part))]
const interactive = new Set(['AiGraderClient', 'HskGraderClient', 'ToeicGraderClient', 'TopikGraderClient', 'SpeakingClient', 'PremiumClient'])
const fixtures = {
  'next/link': `import React from 'react'; export default function Link({children,href,prefetch,replace,scroll,...props}) { return React.createElement('a',{...props,href:typeof href==='string'?href:href.pathname},children) }`,
  '@/src/db': `export async function getOptionalDb() { if (!globalThis.__seoRows?.length) return null; return { select() { let predicate=()=>true,limit=Infinity; return {from(){return this},where(next){predicate=next;return this},limit(next){limit=next;return this},then(resolve,reject){return Promise.resolve(globalThis.__seoRows.filter(predicate).slice(0,limit)).then(resolve,reject)}} } } }`,
  '@/src/db/schema': `export const systemConfigs={key:'key'};`,
  'drizzle-orm': `export const eq=(key,value)=>row=>row[key]===value; export const inArray=(key,values)=>row=>values.includes(row[key]);`,
}

function pageFile(route) { return path.join(root, 'app', route === '/' ? '' : route.slice(1), 'page.tsx') }

async function loadRenderer() {
  const directory = await mkdtemp(path.join(root, '.seo-rendering-'))
  try {
    const source = `
      import React from 'react';
      import {renderToPipeableStream} from 'react-dom/server';
      import {PassThrough} from 'node:stream';
      import {PAGE_SEO} from './src/lib/pageSeo';
      import {getCoreMetadata} from './src/utils/serverSeo';
      ${routes.map((route, i) => `import Page${i} from ${JSON.stringify(pageFile(route))};`).join('\n')}
      const pages={${routes.map((route, i) => `${JSON.stringify(route)}:Page${i}`).join(',')}};
      export const registry=PAGE_SEO;
      export async function metadata(route,rows=[]) { globalThis.__seoRows=rows; return getCoreMetadata(route) }
      export async function render(route,rows=[]) {
        globalThis.__seoRows=rows;
        const element=await pages[route]({});
        return new Promise((resolve,reject)=>{
          let html='',renderer;
          const stream=new PassThrough();
          const timeout=setTimeout(()=>{renderer?.abort();reject(new Error('SEO render timed out: '+route))},10000);
          stream.on('data',chunk=>{html+=chunk.toString()});
          stream.on('end',()=>{clearTimeout(timeout);resolve(html)});
          stream.on('error',error=>{clearTimeout(timeout);reject(error)});
          renderer=renderToPipeableStream(element,{
            onAllReady(){queueMicrotask(()=>renderer.pipe(stream))},
            onError(error){clearTimeout(timeout);reject(error)},
          });
        });
      }
    `
    const result = await build({
      stdin: { contents: source, resolveDir: root, loader: 'tsx' },
      bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic',
      plugins: [{ name: 'seo-render-fixtures', setup(builder) {
        builder.onResolve({ filter: /.*/ }, args => {
          if (fixtures[args.path]) return { path: args.path, namespace: 'seo-fixture' }
          const name = args.path.split('/').at(-1)?.replace(/\.tsx$/, '')
          if (interactive.has(name)) return { path: name, namespace: 'seo-interactive' }
          if (args.path.startsWith('@/')) {
            const base = path.join(root, args.path.slice(2))
            const resolved = [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find(candidate => existsSync(candidate))
            if (!resolved) throw new Error('Missing source for SEO rendering: ' + args.path)
            return { path: resolved }
          }
        })
        builder.onLoad({ filter: /.*/, namespace: 'seo-fixture' }, args => ({ contents: fixtures[args.path], loader: 'js', resolveDir: root }))
        builder.onLoad({ filter: /.*/, namespace: 'seo-interactive' }, args => ({ contents: `import React from 'react';export function ${args.path}(){return React.createElement('div',{'data-interactive-tool':${JSON.stringify(args.path)}})}`, loader: 'js', resolveDir: root }))
      } }],
    })
    const filename = path.join(directory, 'renderer.mjs')
    await writeFile(filename, result.outputFiles[0].text)
    return { module: await import(pathToFileURL(filename).href), cleanup: () => rm(directory, { recursive: true, force: true }) }
  } catch (error) { await rm(directory, { recursive: true, force: true }); throw error }
}

const normalize = value => String(value).replace(/\s+/g, ' ').trim()
function decode(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16))
    if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10))
    return named[entity.toLowerCase()] || match
  })
}
function visibleText(html) { return normalize(decode(html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' '))) }
function structuredData(html, route) {
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match => /\btype=(['"])application\/ld\+json\1/i.test(match[1]))
  assert.ok(blocks.length > 0, route + ' must expose structured data in server HTML')
  return blocks.map(match => {
    assert.ok(!match[2].includes('<'), route + ' JSON-LD must escape HTML delimiters')
    return JSON.parse(match[2])
  })
}
function objects(value) {
  if (!value || typeof value !== 'object') return []
  return [value, ...Object.values(value).flatMap(objects)]
}
function links(html) { return [...html.matchAll(/<a\b[^>]*\bhref=(['"])(.*?)\1/gi)].map(match => decode(match[2])) }

test('public page HTML contains one primary heading, honest schema and matching visible FAQs', async () => {
  const renderer = await loadRenderer()
  try {
    for (const route of routes) {
      const html = await renderer.module.render(route)
      assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, route + ' needs one page heading')
      const text = visibleText(html), nodes = structuredData(html, route).flatMap(objects)
      assert.ok(text.length > 250, route + ' needs useful server-visible copy')
      for (const node of nodes) {
        if (node['@type'] === 'Offer') assert.notEqual(Number(node.price), 0, route + ' must not promise unsupported zero-price offers')
        if (node['@type'] === 'FAQPage') for (const item of node.mainEntity || []) {
          assert.ok(text.includes(normalize(item.name)), route + ' FAQ question must be visible')
          assert.ok(text.includes(normalize(item.acceptedAnswer.text)), route + ' FAQ answer must match the visible answer')
        }
        for (const field of ['publisher', 'provider', 'sponsor', 'brand']) {
          const name = node[field]?.name
          assert.ok(!name || !/^(?:ETS|Cambridge|NIIED|Hanban)$/i.test(name), route + ' must not claim an exam publisher operates VNDocs')
        }
      }
      assert.ok(!/Cambridge IELTS|ETS Standard|Hanban Khảo thí|NIIED Hàn Quốc/.test(text), route + ' must not imply an unsupported official affiliation')
      assert.ok(!/(?:chấm điểm tức thì trong 5 giây|kết quả trong 15 giây|feedback in 5 seconds)/i.test(text), route + ' must not guarantee provider latency')
      assert.ok(links(html).some(href => href.startsWith(route.startsWith('/en') ? '/en/ai-grader' : '/ai-grader')), route + ' needs a crawlable relevant practice link')
    }
  } finally { await renderer.cleanup() }
})

test('both homepages expose direct exam links and safe organization identity with saved copy', async () => {
  const renderer = await loadRenderer()
  try {
    for (const prefix of ['', '/en']) {
      const route = prefix || '/', html = await renderer.module.render(route), hrefs = links(html)
      for (const exam of ['ielts', 'toeic', 'topik', 'hsk']) assert.ok(hrefs.includes(prefix + '/ai-grader/' + exam), route + ' must link to ' + exam)
      assert.ok(hrefs.includes('/speaking'), route + ' must link to the existing Speaking page')
      const nodes = structuredData(html, route).flatMap(objects)
      assert.ok(nodes.some(node => node['@type'] === 'Organization' && node.name === 'VNDocs'))
      assert.ok(nodes.some(node => node['@type'] === 'WebSite' && node.inLanguage === (prefix ? 'en' : 'vi')))
      const attack = 'Practice </script><img src=x onerror=alert(1)> & learn'
      const saved = [{ key: 'SEO_ROUTE_' + route, value: JSON.stringify({ title: attack, description: attack, h1: attack }) }]
      const customHtml = await renderer.module.render(route, saved)
      assert.ok(!/<img\s+src=x/i.test(customHtml), route + ' saved copy must not escape its JSON-LD script')
      structuredData(customHtml, route)
    }
  } finally { await renderer.cleanup() }
})

test('registered public pages retain route-specific canonical, language metadata and honest indexing', async () => {
  const renderer = await loadRenderer()
  try {
    for (const [route, copy] of Object.entries(renderer.module.registry)) {
      const metadata = await renderer.module.metadata(route)
      assert.equal(metadata.alternates.canonical, 'https://vndocs.net' + (route === '/' ? '' : route), route)
      assert.equal(metadata.openGraph.url, metadata.alternates.canonical, route)
      assert.equal(metadata.openGraph.locale, route === '/en' || route.startsWith('/en/') ? 'en_US' : 'vi_VN', route)
      assert.equal(metadata.robots.index, copy.index !== false, route)
      assert.equal(typeof metadata.title, 'string', route)
      assert.equal(typeof metadata.description, 'string', route)
    }
  } finally { await renderer.cleanup() }
})
