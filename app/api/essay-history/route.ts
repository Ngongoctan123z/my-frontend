import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/src/db'
import { essayHistory } from '@/src/db/schema'
import { auth } from '@/auth'
import { desc, eq, and, like } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ history: [] })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''

    const conditions = [eq(essayHistory.email, session.user.email)]
    if (type) {
      conditions.push(like(essayHistory.examType, `${type}%`))
    }

    const db = await getDb()
    const records = await db
      .select()
      .from(essayHistory)
      .where(and(...conditions))
      .orderBy(desc(essayHistory.createdAt))
      .limit(50)

    const formatted = records.map(r => ({
      id: r.id,
      email: r.email,
      examType: r.examType,
      prompt: r.prompt,
      essay: r.essay,
      result: JSON.parse(r.result),
      timestamp: r.createdAt.getTime()
    }))

    return NextResponse.json({ history: formatted })
  } catch (error: any) {
    console.error('Error fetching essay history:', error)
    return NextResponse.json({ history: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { examType, prompt, essay, result } = body

    if (!examType || !prompt || !essay || !result) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = await getDb()
    await db.insert(essayHistory).values({
      email: session.user.email,
      examType,
      prompt,
      essay,
      result: JSON.stringify(result),
      createdAt: new Date()
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving essay history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    await db.delete(essayHistory).where(eq(essayHistory.email, session.user.email))
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting essay history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
