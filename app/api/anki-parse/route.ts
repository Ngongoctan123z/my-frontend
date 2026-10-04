import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Không có file được gửi lên' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Fetch sql.js WASM from CDN so it works on Cloudflare Workers (no local filesystem)
    const wasmResponse = await fetch(
      'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm'
    )
    if (!wasmResponse.ok) {
      throw new Error('Không thể tải thư viện xử lý SQLite.')
    }
    const wasmBinary = await wasmResponse.arrayBuffer()

    const initSqlJs = (await import('sql.js')).default
    const SQL = await initSqlJs({ wasmBinary })

    // Check if it's a zip (.apkg) or raw SQLite
    let dbBuffer: Buffer = buffer
    const isPkZip = buffer[0] === 0x50 && buffer[1] === 0x4b

    if (isPkZip) {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(buffer)

      const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2')
      if (!dbFile) {
        return NextResponse.json(
          { error: 'File .apkg không hợp lệ (thiếu collection database bên trong)' },
          { status: 400 }
        )
      }
      dbBuffer = await dbFile.async('nodebuffer')
    }

    const db = new SQL.Database(new Uint8Array(dbBuffer))

    // Get notes (flashcards)
    const notesResult = db.exec('SELECT id, flds, mid, tags FROM notes LIMIT 500')
    const notes: any[] = []
    if (notesResult.length > 0) {
      for (const row of notesResult[0].values as any[][]) {
        const fields = String(row[1]).split('\x1f')
        notes.push({
          id: String(row[0]),
          modelId: String(row[2]),
          tags: String(row[3] || '').trim(),
          front: fields[0] || '',
          back: fields[1] || '',
          extra: fields.slice(2),
        })
      }
    }

    // Get deck names
    let decks: any[] = []
    try {
      const colResult = db.exec('SELECT decks FROM col')
      if (colResult.length > 0) {
        const decksObj = JSON.parse(String(colResult[0].values[0][0]))
        decks = Object.values(decksObj).map((d: any) => ({ id: String(d.id), name: d.name }))
      }
    } catch {}

    db.close()

    return NextResponse.json({ success: true, totalCards: notes.length, decks, notes })
  } catch (err: any) {
    console.error('[anki-parse]', err)
    return NextResponse.json(
      { error: err?.message || 'Lỗi khi đọc file Anki' },
      { status: 500 }
    )
  }
}
