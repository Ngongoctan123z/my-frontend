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
  for (const row of masterRecords) {
    // sqlite_master: type, name, tbl_name, rootpage, sql
    if (row[0] === 'table' && row[1] === 'notes') {
      notesRootPage = Number(row[3])
    }
    if (row[0] === 'table' && row[1] === 'col') {
      modelsRootPage = Number(row[3])
    }
  }

  if (notesRootPage < 1) {
    throw new Error('Không tìm thấy bảng notes trong database Anki')
  }

  // Read col table for models (JSON)
  let models: Record<string, any> = {}
  if (modelsRootPage >= 1) {
    const colRecords: (string | number | null)[][] = []
    collectLeafRecords(data, modelsRootPage, pageSize, colRecords)
    if (colRecords.length > 0 && typeof colRecords[0][9] === 'string') {
      try {
        models = JSON.parse(colRecords[0][9])
      } catch (e) {
        console.warn('Failed to parse models JSON from col table')
      }
    }
  }

  // Read notes table
  const noteRecords: (string | number | null)[][] = []
  collectLeafRecords(data, notesRootPage, pageSize, noteRecords)

  // Anki notes schema: id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data
  return noteRecords
    .filter(row => row.length >= 7)
    .map(row => {
      const mid = String(row[2] ?? '')
      const model = models[mid]
      
      const flds = String(row[6] ?? '')
      const fields = flds.split('\x1f')
      
      let front = fields[0] ?? ''
      let back = fields[1] ?? ''
      let css = ''
      
      const fieldsData: { name: string; value: string }[] = []
      
      if (model && model.flds) {
        model.flds.forEach((f: any) => {
          fieldsData.push({
            name: f.name,
            value: fields[f.ord] || ''
          })
        })
      }
      
      // If we have model templates, try to use them
      if (model && model.tmpls && model.tmpls.length > 0) {
        let qfmt = model.tmpls[0].qfmt || ''
        let afmt = model.tmpls[0].afmt || ''
        css = model.css || ''
        
        // Escape regex special characters in field name
        const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        // Handle conditional fields {{#Field}}...{{/Field}} and {{^Field}}...{{/Field}}
        if (model.flds) {
          model.flds.forEach((f: any) => {
            const fieldName = escapeRegExp(f.name)
            const fieldVal = fields[f.ord] || ''
            
            // {{#Field}}...{{/Field}}
            const positiveRegex = new RegExp(`\\{\\{#${fieldName}\\}\\}([\\s\\S]*?)\\{\\{/${fieldName}\\}\\}`, 'g')
            qfmt = qfmt.replace(positiveRegex, fieldVal.trim() ? '$1' : '')
            afmt = afmt.replace(positiveRegex, fieldVal.trim() ? '$1' : '')
            
            // {{^Field}}...{{/Field}}
            const negativeRegex = new RegExp(`\\{\\{\\^${fieldName}\\}\\}([\\s\\S]*?)\\{\\{/${fieldName}\\}\\}`, 'g')
            qfmt = qfmt.replace(negativeRegex, !fieldVal.trim() ? '$1' : '')
            afmt = afmt.replace(negativeRegex, !fieldVal.trim() ? '$1' : '')
          })
        }
        
        // Replace {{Field}} with actual field values
        if (model.flds) {
          model.flds.forEach((f: any) => {
            const fieldName = escapeRegExp(f.name)
            const fieldVal = fields[f.ord] || ''
            
            // Basic replacement (handle variations like {{Field}}, {{type:Field}}, etc)
            const regex = new RegExp(`\\{\\{[^}]*${fieldName}[^}]*\\}\\}`, 'g')
            qfmt = qfmt.replace(regex, fieldVal)
            afmt = afmt.replace(regex, fieldVal)
          })
        }
        
        // Handle {{FrontSide}}
        afmt = afmt.replace(/\{\{FrontSide\}\}/g, qfmt)
        
        // Very basic cloze support
        qfmt = qfmt.replace(/\{\{c\d+::(.*?)(::.*?)?\}\}/g, '<span class="cloze">[...]</span>')
        afmt = afmt.replace(/\{\{c\d+::(.*?)(::.*?)?\}\}/g, '<span class="cloze text-indigo-600 font-bold">$1</span>')
        
        // Remove any remaining tags that weren't replaced
        qfmt = qfmt.replace(/\{\{.*?\}\}/g, '')
        afmt = afmt.replace(/\{\{.*?\}\}/g, '')
        
        front = qfmt
        back = afmt
      }

      return {
        id: String(row[0] ?? ''),
        modelId: mid,
        tags: String(row[5] ?? '').trim(),
        front,
        back,
        css,
        fieldsData,
        extra: fields.length > 2 && !model ? fields.slice(2).filter(Boolean) : [],
      }
    })
}
