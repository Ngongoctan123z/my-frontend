/**
 * Minimal SQLite3 reader for Anki .apkg (schema 11, collection.anki2 / anki21)
 * Pure TS, no deps.
 * Fixes vs old version:
 *  - supports overflow pages (big JSON in `col`, long notes)
 *  - INTEGER PRIMARY KEY (stored as NULL in record) is restored from rowid
 *  - signed ints + floats
 *  - template renderer handles special fields (Tags, Deck, Card...), cloze, hint, type, tts
 */

type Row = (string | number | null)[]
const td = new TextDecoder()

const u16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1]
const u32 = (b: Uint8Array, o: number) =>
  b[o] * 0x1000000 + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]
const signed = (v: number, bits: number) => (v >= 2 ** (bits - 1) ? v - 2 ** bits : v)

function readVarint(buf: Uint8Array, offset: number): [number, number] {
  let result = 0
  for (let i = 0; i < 9; i++) {
    const byte = buf[offset + i]
    if (i === 8) return [result * 256 + byte, 9]
    result = result * 128 + (byte & 0x7f)
    if ((byte & 0x80) === 0) return [result, i + 1]
  }
  return [result, 9]
}

function parseRecord(p: Uint8Array): Row {
  const [headerSize, hs] = readVarint(p, 0)
  const types: number[] = []
  let h = hs
  while (h < headerSize) {
    const [t, n] = readVarint(p, h)
    types.push(t)
    h += n
  }
  const dv = new DataView(p.buffer, p.byteOffset, p.byteLength)
  let o = headerSize
  const out: Row = []

  for (const t of types) {
    if (t === 0) out.push(null)
    else if (t === 1) { out.push(signed(p[o], 8)); o += 1 }
    else if (t === 2) { out.push(signed(u16(p, o), 16)); o += 2 }
    else if (t === 3) { out.push(signed((p[o] << 16) | (p[o + 1] << 8) | p[o + 2], 24)); o += 3 }
    else if (t === 4) { out.push(signed(u32(p, o), 32)); o += 4 }
    else if (t === 5) { out.push(signed(u16(p, o) * 4294967296 + u32(p, o + 2), 48)); o += 6 }
    else if (t === 6) {
      const hi = u32(p, o), lo = u32(p, o + 4)
      let v = hi * 4294967296 + lo
      if (hi >= 0x80000000) v -= 2 ** 64
      out.push(v); o += 8
    }
    else if (t === 7) { out.push(dv.getFloat64(o)); o += 8 }
    else if (t === 8) out.push(0)
    else if (t === 9) out.push(1)
    else if (t >= 12 && t % 2 === 0) { out.push(null); o += (t - 12) / 2 } // BLOB
    else if (t >= 13 && t % 2 === 1) {
      const len = (t - 13) / 2
      out.push(td.decode(p.subarray(o, o + len)))
      o += len
    } else out.push(null)
  }
  return out
}

/** Read full payload of a table-leaf cell, following overflow pages */
function readPayload(
  data: Uint8Array, page: Uint8Array, off: number,
  payloadSize: number, pageSize: number, usable: number
): Uint8Array {
  const X = usable - 35
  if (payloadSize <= X) return page.subarray(off, off + payloadSize)

  const M = Math.floor(((usable - 12) * 32) / 255) - 23
  let K = M + ((payloadSize - M) % (usable - 4))
  if (K > X) K = M

  const out = new Uint8Array(payloadSize)
  out.set(page.subarray(off, off + K), 0)
  let got = K
  let next = u32(page, off + K)

  while (next > 0 && got < payloadSize) {
    const start = (next - 1) * pageSize
    next = u32(data, start)
    const n = Math.min(usable - 4, payloadSize - got)
    out.set(data.subarray(start + 4, start + 4 + n), got)
    got += n
  }
  return out
}

function collect(
  data: Uint8Array, pageNum: number, pageSize: number, usable: number,
  out: Row[], depth = 0
): void {
  if (pageNum < 1 || depth > 30) return
  const start = (pageNum - 1) * pageSize
  if (start + 8 > data.length) return
  const page = data.subarray(start, start + pageSize)
  const base = pageNum === 1 ? 100 : 0
  const type = page[base]
  const cells = u16(page, base + 3)

  if (type === 0x0d) {
    for (let i = 0; i < cells; i++) {
      let off = u16(page, base + 8 + i * 2)
      const [payloadSize, a] = readVarint(page, off); off += a
      const [rowid, b] = readVarint(page, off); off += b
      try {
        const rec = parseRecord(readPayload(data, page, off, payloadSize, pageSize, usable))
        if (rec[0] === null) rec[0] = rowid // INTEGER PRIMARY KEY alias
        out.push(rec)
      } catch { /* skip malformed */ }
    }
  } else if (type === 0x05) {
    for (let i = 0; i < cells; i++) {
      const ptr = u16(page, base + 12 + i * 2)
      collect(data, u32(page, ptr), pageSize, usable, out, depth + 1)
    }
    collect(data, u32(page, base + 8), pageSize, usable, out, depth + 1)
  }
}

export interface AnkiNote {
  id: string
  modelId: string
  tags: string
  front: string
  back: string
  css: string
  qfmt: string
  sortf: number
  fieldsData: { name: string; value: string }[]
  extra: string[]
  deckName?: string
}

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()
const hasContent = (v = '') =>
  stripHtml(v.replace(/\[sound:[^\]]+\]/g, '')).length > 0 || /<img|\[sound:/i.test(v)

function renderCloze(text: string, n: number, reveal: boolean) {
  return text.replace(
    /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g,
    (_, num, ans, hint) =>
      +num === n
        ? reveal
          ? `<span class="cloze">${ans}</span>`
          : `<span class="cloze">[${hint ?? '...'}]</span>`
        : ans
  )
}

function renderTemplate(
  tpl: string,
  fields: Record<string, string>,
  opts: { frontSide?: string; clozeN?: number; reveal?: boolean } = {}
) {
  let out = tpl

  // {{#Field}}..{{/Field}} / {{^Field}}..{{/Field}} (lặp để xử lý lồng nhau)
  const cond = /\{\{([#^])\s*([^}]+?)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/g
  let prev: string
  do {
    prev = out
    out = out.replace(cond, (_, type, name, inner) =>
      (type === '#') === hasContent(fields[name]) ? inner : ''
    )
  } while (out !== prev)

  out = out.replace(/\{\{\s*FrontSide\s*\}\}/g, () => opts.frontSide ?? '')

  out = out.replace(/\{\{([^}]+)\}\}/g, (_, expr: string) => {
    const parts = expr.trim().split(':')
    const name = parts.pop()!.trim()
    const filters = parts.map(p => p.trim())
    let v = fields[name] ?? ''

    if (filters.includes('type')) return ''
    if (filters.some(f => f.startsWith('tts'))) return ''
    if (filters.includes('cloze')) v = renderCloze(v, opts.clozeN ?? 1, !!opts.reveal)
    if (filters.includes('text')) v = stripHtml(v)
    if (filters.includes('hint')) v = v ? `<details><summary>Gợi ý</summary>${v}</details>` : ''
    return v
  })

  return out
}

export function parseSqliteAnki(data: Uint8Array): AnkiNote[] {
  if (!td.decode(data.subarray(0, 15)).startsWith('SQLite format 3')) {
    throw new Error('File không phải định dạng SQLite hợp lệ')
  }

  let pageSize = u16(data, 16)
  if (pageSize === 1) pageSize = 65536
  if (!pageSize) pageSize = 4096
  const usable = pageSize - data[20]

  const master: Row[] = []
  collect(data, 1, pageSize, usable, master)

  const root: Record<string, number> = {}
  for (const r of master) {
    if (r[0] === 'table' && typeof r[1] === 'string') root[r[1]] = Number(r[3])
  }
  if (!(root.notes >= 1)) throw new Error('Không tìm thấy bảng notes trong database Anki')
  if (!(root.cards >= 1)) throw new Error('Không tìm thấy bảng cards trong database Anki')

  // col: id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags
  let models: Record<string, any> = {}
  let decks: Record<string, any> = {}
  if (root.col >= 1) {
    const colRows: Row[] = []
    collect(data, root.col, pageSize, usable, colRows)
    const col = colRows[0]
    if (col) {
      try { if (typeof col[9] === 'string') models = JSON.parse(col[9]) } catch (e) { console.warn('models JSON lỗi', e) }
      try { if (typeof col[10] === 'string') decks = JSON.parse(col[10]) } catch (e) { console.warn('decks JSON lỗi', e) }
    }
  }
  if (Object.keys(models).length === 0) {
    throw new Error(
      'Không đọc được cấu trúc mẫu thẻ (models). File có thể được export từ Anki bản mới. ' +
      'Hãy export lại và TICK "Support older Anki versions (slower, larger files)".'
    )
  }

  const cardRows: Row[] = []
  collect(data, root.cards, pageSize, usable, cardRows)
  const noteRows: Row[] = []
  collect(data, root.notes, pageSize, usable, noteRows)

  const notesById: Record<string, Row> = {}
  for (const r of noteRows) if (r.length >= 7) notesById[String(r[0])] = r

  const result: AnkiNote[] = []

  for (const row of cardRows) {
    if (row.length < 4) continue
    const id = String(row[0])
    const nid = String(row[1])
    const did = String(row[2])
    const ord = Number(row[3]) || 0

    const noteRow = notesById[nid]
    if (!noteRow) continue

    const mid = String(noteRow[2] ?? '')
    const tags = String(noteRow[5] ?? '').trim()
    const fields = String(noteRow[6] ?? '').split('\x1f')
    const model = models[mid]
    const deckName: string = decks[did]?.name || 'Mặc định'

    const fieldsData: { name: string; value: string }[] = []
    const dict: Record<string, string> = {}
    let front = fields[0] ?? ''
    let back = fields[1] ?? ''
    let css = ''
    let qfmt = ''
    let sortf = 0

    if (model?.flds) {
      const flds = [...model.flds].sort((a: any, b: any) => a.ord - b.ord)
      for (const f of flds) {
        const val = fields[f.ord] ?? ''
        fieldsData.push({ name: f.name, value: val })
        dict[f.name] = val
      }
      css = model.css || ''
      sortf = Number(model.sortf) || 0

      if (model.tmpls?.length) {
        const tmpl = model.tmpls[ord] || model.tmpls[0]
        qfmt = tmpl.qfmt || ''
        const special: Record<string, string> = {
          Tags: tags,
          Type: model.name || '',
          Deck: deckName,
          Subdeck: deckName.split('::').pop() || deckName,
          Card: tmpl.name || '',
          CardFlag: '',
        }
        const all = { ...special, ...dict }
        const clozeN = ord + 1
        front = renderTemplate(qfmt, all, { clozeN })
        back = renderTemplate(tmpl.afmt || '', all, { frontSide: front, clozeN, reveal: true })
      }
    } else {
      fields.forEach((v, i) => fieldsData.push({ name: `Field ${i + 1}`, value: v }))
    }

    result.push({ id, modelId: mid, tags, front, back, css, qfmt, sortf, fieldsData, extra: [], deckName })
  }

  if (result.length === 0) throw new Error('Không đọc được thẻ nào từ file này.')
  return result
}