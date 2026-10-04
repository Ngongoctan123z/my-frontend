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

    // Dynamic import sql.js on server side
    const initSqlJs = (await import('sql.js')).default
    const SQL = await initSqlJs()

    // Try to open file directly as SQLite first (some .apkg are just SQLite)
    // Otherwise unzip first using JSZip
    let dbBuffer: Buffer = buffer

    // Check if it's a zip (PK magic bytes)
    const isPkZip = buffer[0] === 0x50 && buffer[1] === 0x4b

    if (isPkZip) {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(buffer)

      const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2')
      if (!dbFile) {
        return NextResponse.json(
          { error: 'File .apkg không hợp lệ (thiếu collection database)' },
          { status: 400 }
        )
      }
      const dbData = await dbFile.async('nodebuffer')
      dbBuffer = dbData
    }

    const db = new SQL.Database(new Uint8Array(dbBuffer))

    // Get notes
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

    // Get decks info
    let decks: any[] = []
    try {
      const colResult = db.exec('SELECT decks FROM col')
      if (colResult.length > 0) {
        const decksJson = String(colResult[0].values[0][0])
        const decksObj = JSON.parse(decksJson)
        decks = Object.values(decksObj).map((d: any) => ({
          id: String(d.id),
          name: d.name,
        }))
      }
    } catch {}

    db.close()

    return NextResponse.json({
      success: true,
      totalCards: notes.length,
      decks,
      notes,
    })
  } catch (err: any) {
    console.error('[anki-parse] Error:', err)
    return NextResponse.json(
      { error: err?.message || 'Lỗi khi đọc file Anki' },
      { status: 500 }
    )
  }
}
