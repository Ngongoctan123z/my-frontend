import { NextRequest, NextResponse } from 'next/server'
import { parseSqliteAnki } from './sqlite-reader'



export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Không có file được gửi lên' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    let dbBuffer = new Uint8Array(arrayBuffer)

    // Check if it's a ZIP file (.apkg is a zip)
    const isPkZip = dbBuffer[0] === 0x50 && dbBuffer[1] === 0x4b

    if (isPkZip) {
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(arrayBuffer)

      const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2')
      if (!dbFile) {
        return NextResponse.json(
          { error: 'File .apkg không hợp lệ (thiếu collection database bên trong)' },
          { status: 400 }
        )
      }
      const extracted = await dbFile.async('uint8array')
      dbBuffer = new Uint8Array(extracted.buffer as ArrayBuffer)
    }

    // Parse SQLite with our pure-JS reader
    const notes = parseSqliteAnki(dbBuffer)

    return NextResponse.json({
      success: true,
      totalCards: notes.length,
      notes,
    })
  } catch (err: any) {
    console.error('[anki-parse]', err)
    return NextResponse.json(
      { error: err?.message || 'Lỗi khi đọc file Anki' },
      { status: 500 }
    )
  }
}
