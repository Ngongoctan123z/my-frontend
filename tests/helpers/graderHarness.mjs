// Executes the real route, rubric, scoring and D1-store adapter. Only external
// Next/Auth/Groq/Drizzle dependencies are replaced; SQLite executes the SQL.
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripTypeScriptTypes } from 'node:module'
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm'
import { DatabaseSync } from 'node:sqlite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const quote = name => '"' + name.replaceAll('"', '""') + '"'
const fragment = (text, params = []) => ({ kind: 'sql', text, params })
const columnSql = column => `${quote(column.table.name)}.${quote(column.name)}`
function interpolate(value) {
  if (value?.kind === 'sql') return value
  if (value?.kind === 'column') return fragment(columnSql(value))
  if (value?.kind === 'table') return fragment(quote(value.name))
  return fragment('?', [value])
}
function sql(parts, ...values) {
  let text = parts[0]
  const params = []
  values.forEach((value, index) => {
    const next = interpolate(value)
    text += next.text + parts[index + 1]
    params.push(...next.params)
  })
  return fragment(text, params)
}
sql.raw = text => fragment(text)
const eq = (field, value) => sql`${field} = ${value}`
const inArray = (field, values) => fragment(`${columnSql(field)} IN (${values.map(() => '?').join(',')})`, values)
const and = (...conditions) => fragment(conditions.map(condition => `(${condition.text})`).join(' AND '), conditions.flatMap(condition => condition.params))
function table(name, columns) {
  const definition = { kind: 'table', name }
  for (const column of columns) definition[column] = { kind: 'column', name: column, table: definition }
  return definition
}
const schema = {
  systemConfigs: table('system_config', ['key', 'value']),
  prompts: table('prompt', ['id', 'type', 'content', 'createdAt', 'imageUrl']),
  apiUsages: table('api_usage', ['userId', 'date', 'count']),
  users: table('user', ['email', 'plan']),
  essayHistory: table('essay_history', ['email', 'prompt', 'essay']),
  speakingPrompts: table('speaking_prompt', ['examType']),
}

function makeDb(connection) {
  class Query {
    constructor(kind, fields, source) { Object.assign(this, { kind, fields, source }) }
    from(source) { this.source = source; return this }
    where(condition) { this.condition = condition; return this }
    values(values) { this.insertValues = values; return this }
    set(values) { this.updateValues = values; return this }
    onConflictDoNothing() { this.ignoreConflict = true; return this }
    onConflictDoUpdate(update) { this.conflictUpdate = update; return this }
    returning(fields) { this.returnFields = fields; return this }
    limit(value) { this.limitValue = value; return this }
    then(onResolve, onReject) { return Promise.resolve().then(() => this.execute()).then(onResolve, onReject) }
    execute() {
      let text = ''
      const params = []
      const fieldsSql = fields => Object.entries(fields).map(([alias, field]) => `${columnSql(field)} AS ${quote(alias)}`).join(', ')
      const valuesSql = values => Object.entries(values).map(([key, value]) => {
        const expression = interpolate(value)
        params.push(...expression.params)
        return `${quote(key)} = ${expression.text}`
      }).join(', ')
      if (this.kind === 'select') {
        text = `SELECT ${this.fields ? fieldsSql(this.fields) : '*'} FROM ${quote(this.source.name)}`
      } else if (this.kind === 'insert') {
        const columns = Object.keys(this.insertValues)
        const expressions = Object.values(this.insertValues).map(value => {
          const expression = interpolate(value)
          params.push(...expression.params)
          return expression.text
        })
        text = `INSERT INTO ${quote(this.source.name)} (${columns.map(quote).join(',')}) VALUES (${expressions.join(',')})`
        if (this.ignoreConflict) text += ' ON CONFLICT DO NOTHING'
        if (this.conflictUpdate) {
          const targets = Array.isArray(this.conflictUpdate.target) ? this.conflictUpdate.target : [this.conflictUpdate.target]
          text += ` ON CONFLICT (${targets.map(target => quote(target.name)).join(',')}) DO UPDATE SET ${valuesSql(this.conflictUpdate.set)}`
          if (this.conflictUpdate.setWhere) {
            text += ` WHERE ${this.conflictUpdate.setWhere.text}`
            params.push(...this.conflictUpdate.setWhere.params)
          }
        }
      } else {
        text = `UPDATE ${quote(this.source.name)} SET ${valuesSql(this.updateValues)}`
      }
      if (this.condition) {
        text += ` WHERE ${this.condition.text}`
        params.push(...this.condition.params)
      }
      if (this.returnFields) text += ' RETURNING ' + fieldsSql(this.returnFields)
      if (this.limitValue) text += ' LIMIT ' + Number(this.limitValue)
      const statement = connection.prepare(text)
      return this.kind === 'select' || this.returnFields ? statement.all(...params) : statement.run(...params)
    }
  }
  const raw = {
    prepare(query) {
      const statement = { params: [], bind(...params) { this.params = params; return this },
        execute() { const prepared = connection.prepare(query); return prepared.columns().length ? { results: prepared.all(...this.params) } : { results: [], meta: prepared.run(...this.params) } },
        async all() { return this.execute() }, async first() { return this.execute().results[0] || null }, async run() { return this.execute() },
      }
      return statement
    },
    async batch(statements) {
      connection.exec('BEGIN')
      try { const results = statements.map(statement => statement.execute()); connection.exec('COMMIT'); return results }
      catch (error) { connection.exec('ROLLBACK'); throw error }
    },
  }
  return {
    $client: raw,
    select: fields => new Query('select', fields),
    insert: source => new Query('insert', undefined, source),
    update: source => new Query('update', undefined, source),
    async batch(queries) {
      connection.exec('BEGIN')
      try {
        const results = queries.map(query => query.execute())
        connection.exec('COMMIT')
        return results
      } catch (error) {
        connection.exec('ROLLBACK')
        throw error
      }
    },
  }
}

export async function createGraderHarness({ route = 'app/api/ai-grader/route.ts' } = {}) {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(`
    CREATE TABLE system_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE user (email TEXT PRIMARY KEY, plan TEXT NOT NULL);
    CREATE TABLE api_usage (userId TEXT, date TEXT, count INTEGER, PRIMARY KEY (userId, date));
    CREATE TABLE prompt (id TEXT PRIMARY KEY, type TEXT, content TEXT, createdAt INTEGER, imageUrl TEXT);
    CREATE TABLE essay_history (email TEXT, prompt TEXT, essay TEXT);
  `)
  const keys = ['test-key-1', 'test-key-2', 'test-key-3', 'test-key-4', 'test-key-5']
  sqlite.prepare('INSERT INTO system_config VALUES (?, ?)').run('GROQ_API_KEY', keys.join(','))
  sqlite.prepare('INSERT INTO system_config VALUES (?, ?)').run('GRADING_GROQ_MODEL', 'grading-primary,grading-fallback')
  const state = {
    email: 'grader-test@example.test', response: {}, finishReason: 'stop',
    calls: [], logs: [], handler: null, audioObjects: new Map(), r2Enabled: true, r2Writes: 0,
  }
  sqlite.prepare('INSERT INTO user VALUES (?, ?)').run(state.email, 'pro')
  const database = makeDb(sqlite)
  class FakeGroq {
    static async toFile(bytes, name, options) { return new File([bytes], name, options) }
    constructor(options) {
      this.audio = { transcriptions: { create: async payload => {
        const call = { kind: 'stt', apiKey: options.apiKey, options, payload }
        state.calls.push(call)
        return state.sttHandler ? state.sttHandler(call) : { text: 'I enjoy reading books because they help me learn new things.', segments: [{ no_speech_prob: 0.01 }] }
      } } }
      this.chat = { completions: { create: async payload => {
        const call = { apiKey: options.apiKey, options, payload }
        state.calls.push(call)
        const value = state.handler ? await state.handler(call) : state.response
        return { choices: [{ message: { content: typeof value === 'string' ? value : JSON.stringify(value) }, finish_reason: state.finishReason }] }
      } } }
    }
  }
  const bucket = {
    async put(key, bytes, options) { if (state.r2Failure) throw new Error('R2_UNAVAILABLE'); state.r2Writes++; state.audioObjects.set(key, { bytes, options }) },
    async get(key) { const row=state.audioObjects.get(key); if(!row)return null; const blob=new Blob([row.bytes]); return {body:blob.stream(),size:blob.size,httpEtag:'"test-audio"',arrayBuffer:()=>blob.arrayBuffer()} },
  }
  const external = {
    '@opennextjs/cloudflare': {getCloudflareContext:async()=>({env:{
      ...(state.r2Enabled?{SPEAKING_AUDIO:bucket}:{}),
      ...(state.assetsDisabled?{}:{ASSETS:{fetch:async request=>{
        if(new URL(request.url).pathname!=='/exam-data/writing-bank-v1.json')return new Response(null,{status:404})
        return new Response(JSON.stringify((await import('../../app/api/ai-grader/writing-seed.generated.ts')).writingSeed),{headers:{'Content-Type':'application/json'}})
      }}}),
    }})},
    'next/server': { NextRequest: Request, NextResponse: Response },
    'groq-sdk': { default: FakeGroq },
    '@/auth': { auth: async () => state.email ? { user: { email: state.email } } : null },
    '@/src/db': { getDb: async () => database },
    '@/src/db/schema': schema,
    'drizzle-orm': { sql, eq, inArray, and, desc: value => value },
  }
  const context = createContext({
    crypto: globalThis.crypto, TextEncoder, TextDecoder, Headers, Request, Response,
    setTimeout, clearTimeout, Buffer, Blob, File, FormData, AbortController, AbortSignal, Uint8Array, DOMException,
    fetch: (...args) => state.fetchHandler ? state.fetchHandler(...args) : Promise.reject(new Error('UNEXPECTED_FETCH')),
    console: Object.fromEntries(['log', 'warn', 'error'].map(level => [level, (...args) => state.logs.push([level, ...args])])),
    process: { env: {} },
  })
  const modules = new Map()
  async function load(identifier) {
    if (modules.has(identifier)) return modules.get(identifier)
    const loading = (async () => {
    let module
    if (external[identifier]) {
      const exports = external[identifier]
      module = new SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value)
      }, { context, identifier })
    } else {
      const source = await readFile(identifier, 'utf8')
      module = new SourceTextModule(stripTypeScriptTypes(source), { context, identifier })
    }
    await module.link((specifier, parent) => {
      if (external[specifier]) return load(specifier)
      const absolute = specifier.startsWith('@/') ? resolve(root, specifier.slice(2)) : resolve(dirname(parent.identifier), specifier)
      return load(absolute.endsWith('.ts') ? absolute : absolute + '.ts')
    })
    return module
    })()
    modules.set(identifier, loading)
    return loading
  }
  const module = await load(resolve(root, route))
  await module.evaluate()
  let requestId = 0
  return {
    state, sqlite, keys, db: database,
    async loadModule(path) { const target = await load(resolve(root, path)); if (target.status !== 'evaluated') await target.evaluate(); return target.namespace },
    async post(body) {
      const response = await module.namespace.POST(new Request('http://test.local/api/speaking', {
        method: 'POST', headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
        body: body instanceof FormData ? body : JSON.stringify(body),
      }))
      return { response, data: await response.json() }
    },
    async get() { const response = await module.namespace.GET(); return { response, data: await response.json() } },
    async grade(body, headers = {}) {
      const { provider, expected, name, ...submission } = body
      const response = await module.namespace.POST(new Request('http://test.local/api/ai-grader', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `198.51.100.${++requestId}`, ...headers },
        body: JSON.stringify({ action: 'grade_essay', ...submission }),
      }))
      return { response, data: await response.json() }
    },
  }
}


