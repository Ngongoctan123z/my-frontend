/**
 * Minimal SQLite3 binary reader for Anki .apkg files
 * Pure JS/TS — no BigInt, no external deps, works on Cloudflare Workers edge runtime
 */

function readUint32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] * 0x1000000) + (buf[offset + 1] << 16) + (buf[offset + 2] << 8) + buf[offset + 3]) >>> 0
}

function readUint16BE(buf: Uint8Array, offset: number): number {
  return (buf[offset] << 8) | buf[offset + 1]
}

// Read a SQLite varint (returns [value, bytesConsumed])
function readVarint(buf: Uint8Array, offset: number): [number, number] {
  let result = 0
  for (let i = 0; i < 9; i++) {
    const byte = buf[offset + i]
    if (i === 8) {
      result = result * 256 + byte
      return [result, 9]
    }
    result = result * 128 + (byte & 0x7f)
    if ((byte & 0x80) === 0) return [result, i + 1]
  }
  return [result, 9]
}

function getPage(data: Uint8Array, pageNum: number, pageSize: number): Uint8Array {
  const start = (pageNum - 1) * pageSize
  return data.slice(start, start + pageSize)
}

// Parse a SQLite record payload into column values
function parseRecord(payload: Uint8Array): (string | number | null)[] {
  const [headerSize, hs] = readVarint(payload, 0)
  let headerOff = hs

  const types: number[] = []
  while (headerOff < headerSize) {
    const [t, ts] = readVarint(payload, headerOff)
    types.push(t)
    headerOff += ts
  }

  let bodyOff = headerSize
  const values: (string | number | null)[] = []

  for (const t of types) {
    if (t === 0) {
      values.push(null)
    } else if (t === 1) {
      values.push(buf8(payload, bodyOff)); bodyOff += 1
    } else if (t === 2) {
      values.push(readUint16BE(payload, bodyOff)); bodyOff += 2
    } else if (t === 3) {
      values.push((payload[bodyOff] << 16) | (payload[bodyOff + 1] << 8) | payload[bodyOff + 2]); bodyOff += 3
    } else if (t === 4) {
      values.push(readUint32BE(payload, bodyOff)); bodyOff += 4
    } else if (t === 5) {
      // 6-byte int - skip precise value, use approx
      const hi = readUint32BE(payload, bodyOff)
      const lo = readUint16BE(payload, bodyOff + 4)
      values.push(hi * 65536 + lo); bodyOff += 6
    } else if (t === 6) {
      // 8-byte int — read as two 32-bit ints (safe for IDs)
      const hi = readUint32BE(payload, bodyOff)
      const lo = readUint32BE(payload, bodyOff + 4)
      values.push(hi * 4294967296 + lo); bodyOff += 8
    } else if (t === 7) {
      // 8-byte float - skip
      values.push(null); bodyOff += 8
    } else if (t === 8) {
      values.push(0)
    } else if (t === 9) {
      values.push(1)
    } else if (t >= 12 && t % 2 === 0) {
      // BLOB
      const len = (t - 12) / 2
      values.push(null); bodyOff += len
    } else if (t >= 13 && t % 2 === 1) {
      // TEXT
      const len = (t - 13) / 2
      const bytes = payload.slice(bodyOff, bodyOff + len)
      values.push(new TextDecoder().decode(bytes))
      bodyOff += len
    } else {
      values.push(null)
    }
  }
  return values
}

function buf8(buf: Uint8Array, offset: number): number {
  return buf[offset]
}

// Recursively traverse SQLite B-tree and collect leaf records
function collectLeafRecords(
  data: Uint8Array,
  pageNum: number,
  pageSize: number,
  records: (string | number | null)[][]
): void {
  if (pageNum < 1) return
  const page = getPage(data, pageNum, pageSize)
  const pageOffset = pageNum === 1 ? 100 : 0
  const pageType = page[pageOffset]

  if (pageType === 0x0d) {
    // Leaf table B-tree page
    const cellCount = readUint16BE(page, pageOffset + 3)
    const usable = pageSize
    const maxLocal = Math.floor(((usable - 12) * 64 / 255) - 23)

    for (let i = 0; i < cellCount; i++) {
      const ptrOffset = pageOffset + 8 + i * 2
      const cellPtr = readUint16BE(page, ptrOffset)
      let off = cellPtr

      const [payloadSize, ps] = readVarint(page, off); off += ps
      const [, rs] = readVarint(page, off); off += rs // rowid

      const inlineSize = payloadSize <= maxLocal ? payloadSize : maxLocal
      const payload = page.slice(off, off + inlineSize)

      try {
        records.push(parseRecord(payload))
      } catch {
        // skip malformed records
      }
    }
  } else if (pageType === 0x05) {
    // Interior table B-tree page
    const cellCount = readUint16BE(page, pageOffset + 3)
    const rightmost = readUint32BE(page, pageOffset + 8)

    for (let i = 0; i < cellCount; i++) {
      const ptrOffset = pageOffset + 12 + i * 2
      const cellPtr = readUint16BE(page, ptrOffset)
      const childPage = readUint32BE(page, cellPtr)
      collectLeafRecords(data, childPage, pageSize, records)
    }
    collectLeafRecords(data, rightmost, pageSize, records)
  }
}

export interface AnkiNote {
  id: string
  modelId: string
  tags: string
  front: string
  back: string
  css: string
  fieldsData: { name: string; value: string }[]
  extra: string[]
  deckName?: string
}

export function parseSqliteAnki(data: Uint8Array): AnkiNote[] {
  // Validate SQLite magic header
  const magic = new TextDecoder().decode(data.slice(0, 15))
  if (!magic.startsWith('SQLite format 3')) {
    throw new Error('File không phải định dạng SQLite hợp lệ')
  }

  const pageSize = readUint16BE(data, 16) || 4096

  // Read sqlite_master (page 1) to find rootpage of "notes" table
  const masterRecords: (string | number | null)[][] = []
  collectLeafRecords(data, 1, pageSize, masterRecords)

  let notesRootPage = -1
  let modelsRootPage = -1
  let cardsRootPage = -1
  
  for (const row of masterRecords) {
    // sqlite_master: type, name, tbl_name, rootpage, sql
    if (row[0] === 'table' && row[1] === 'notes') {
      notesRootPage = Number(row[3])
    }
    if (row[0] === 'table' && row[1] === 'col') {
      modelsRootPage = Number(row[3])
    }
    if (row[0] === 'table' && row[1] === 'cards') {
      cardsRootPage = Number(row[3])
    }
  }

  if (notesRootPage < 1) {
    throw new Error('Không tìm thấy bảng notes trong database Anki')
  }

  // Read col table for models and decks (JSON)
  let models: Record<string, any> = {}
  let decks: Record<string, any> = {}
  if (modelsRootPage >= 1) {
    const colRecords: (string | number | null)[][] = []
    collectLeafRecords(data, modelsRootPage, pageSize, colRecords)
    if (colRecords.length > 0) {
      if (typeof colRecords[0][9] === 'string') {
        try {
          models = JSON.parse(colRecords[0][9])
        } catch (e) {
          console.warn('Failed to parse models JSON from col table')
        }
      } else if (typeof colRecords[0][9] === 'object' && colRecords[0][9] !== null) {
         // handle if it's already a parsed object or different structure
      }
      if (typeof colRecords[0][10] === 'string') {
        try {
          decks = JSON.parse(colRecords[0][10])
        } catch (e) {
          console.warn('Failed to parse decks JSON from col table')
        }
      }
    }
  }

  const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim()
  const hasContent = (v = '') => stripHtml(v.replace(/\[sound:[^\]]+\]/g, '')).length > 0 || /<img|\[sound:/i.test(v)
  
  function renderCloze(text: string, n: number, reveal: boolean) {
    return text.replace(/\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g,
      (_, num, ans, hint) =>
        +num === n
          ? reveal ? `<span class="cloze font-bold text-blue-600">${ans}</span>`
                   : `<span class="cloze font-bold text-blue-600">[${hint ?? '...'}]</span>`
          : ans)
  }

  function renderTemplate(
    tpl: string,
    fields: Record<string, string>,
    opts: { frontSide?: string; clozeN?: number; reveal?: boolean } = {}
  ) {
    let out = tpl
  
    // {{#Field}}...{{/Field}} and {{^Field}}...{{/Field}}
    const cond = /\{\{([#^])\s*([^}]+?)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/g
    let prev: string
    do {
      prev = out
      out = out.replace(cond, (_, type, name, inner) =>
        (type === '#') === hasContent(fields[name]) ? inner : '')
    } while (out !== prev)
  
    out = out.replace(/\{\{FrontSide\}\}/g, opts.frontSide ?? '')
  
    // {{filter:Field}}, {{Field}}
    out = out.replace(/\{\{([^}]+)\}\}/g, (_, expr: string) => {
      const parts = expr.trim().split(':')
      const name = parts.pop()!.trim()
      const filters = parts.map(p => p.trim())
      let v = fields[name] ?? ''
  
      if (filters.includes('type')) return '' // typing box -> skip
      if (filters.includes('cloze'))
        v = renderCloze(v, opts.clozeN ?? 1, !!opts.reveal)
      if (filters.includes('text')) v = stripHtml(v)
      if (filters.includes('hint'))
        v = v ? `<details><summary>Gợi ý</summary>${v}</details>` : ''
      return v
    })
  
    return out
  }

  // Read cards table
  const cardRecords: (string | number | null)[][] = []
  if (cardsRootPage >= 1) {
    collectLeafRecords(data, cardsRootPage, pageSize, cardRecords)
  }

  // Read notes table
  const noteRecords: (string | number | null)[][] = []
  collectLeafRecords(data, notesRootPage, pageSize, noteRecords)
  
  const notesById: Record<string, any> = {}
  noteRecords.forEach(row => {
    if (row.length >= 7) notesById[String(row[0])] = row
  })

  // Build the final deck by iterating over cards
  return cardRecords
    .filter(row => row.length >= 4)
    .map(row => {
      const id = String(row[0]) // card id
      const nid = String(row[1]) // note id
      const did = String(row[2]) // deck id
      const ord = Number(row[3]) || 0 // template ord
      
      const noteRow = notesById[nid]
      if (!noteRow) return null
      
      const mid = String(noteRow[2] ?? '')
      const tags = String(noteRow[5] ?? '').trim()
      const flds = String(noteRow[6] ?? '')
      const fields = flds.split('\x1f')
      
      const model = models[mid]
      let front = fields[0] ?? ''
      let back = fields[1] ?? ''
      let css = ''
      
      const fieldsData: { name: string; value: string }[] = []
      const fieldsDict: Record<string, string> = {}
      
      if (model && model.flds) {
        model.flds.forEach((f: any) => {
          const val = fields[f.ord] || ''
          fieldsData.push({ name: f.name, value: val })
          fieldsDict[f.name] = val
        })
        css = model.css || ''
      }
      
      if (model && model.tmpls && model.tmpls.length > 0) {
        const tmpl = model.tmpls[ord] || model.tmpls[0]
        front = renderTemplate(tmpl.qfmt || '', fieldsDict, { clozeN: ord + 1 })
        back = renderTemplate(tmpl.afmt || '', fieldsDict, { frontSide: front, clozeN: ord + 1, reveal: true })
      }
      
      return {
        id,
        modelId: mid,
        tags,
        front,
        back,
        css,
        fieldsData,
        extra: [],
        deckName: decks[did]?.name || 'Mặc định',
      }
    }).filter(Boolean) as AnkiNote[]
}
