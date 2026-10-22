import { NextRequest, NextResponse } from 'next/server'
import { learnerHistoryPrompt, learnerGradingResult } from '@/src/lib/publicWritingPrompt'
import { getDb } from '@/src/db'
import { essayHistory, users } from '@/src/db/schema'
import { auth } from '@/auth'
import { desc, eq, and, like } from 'drizzle-orm'

const ROOT_ADMINS = [
  'ngongoctan282005@gmail.com',
  'ngotan1911@gmail.com',
  'ngongoctan432005@gmail.com',
  'admin@vndocs.net'
]

async function isUserAdmin(email: string) {
  if (ROOT_ADMINS.includes(email)) return true
  try {
    const db = await getDb()
    const u = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return u.length > 0 && u[0].role === 'admin'
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ history: [], message: 'Chưa đăng nhập' })
    }

    const userEmail = session.user.email.toLowerCase().trim()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || ''
    const filterEmail = searchParams.get('email')?.toLowerCase().trim()
    const isAdminMode = searchParams.get('admin') === 'true'

    const isAdmin = await isUserAdmin(userEmail)

    // Phân quyền bảo mật:
    // - Người dùng thông thường: Chỉ được xem bài làm của chính mình.
    // - Admin: Có thể lọc xem bài làm của học viên khác hoặc tất cả học viên nếu cần.
    let targetEmail = userEmail
    if (isAdmin && isAdminMode && filterEmail) {
      targetEmail = filterEmail
    }

    const conditions = [eq(essayHistory.email, targetEmail)]
    if (type) {
      conditions.push(like(essayHistory.examType, `${type}%`))
    }

    const db = await getDb()
    const records = await db
      .select()
      .from(essayHistory)
      .where(and(...conditions))
      .orderBy(desc(essayHistory.createdAt))
      .limit(100)

    const formatted = records.map(r => {
      let parsedResult: any = null
      try {
        parsedResult = typeof r.result === 'string' ? JSON.parse(r.result) : r.result
      } catch {
        parsedResult = {}
      }

      // Xử lý an toàn timestamp dù D1 trả về Date hay number
      let ts = Date.now()
      if (r.createdAt instanceof Date) {
        ts = r.createdAt.getTime()
      } else if (typeof r.createdAt === 'number') {
        ts = r.createdAt
      } else if (r.createdAt) {
        ts = new Date(r.createdAt).getTime()
      }

      return {
        id: r.id,
        email: r.email,
        examType: r.examType,
        prompt: learnerHistoryPrompt(r.prompt),
        essay: r.essay,
        result: learnerGradingResult(parsedResult),
        timestamp: ts
      }
    })

    return NextResponse.json({ 
      history: formatted,
      userEmail,
      count: formatted.length 
    })
  } catch (error: any) {
    console.error('Error fetching essay history:', error)
    return NextResponse.json({ history: [], error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để lưu lịch sử làm bài.' }, { status: 401 })
    }

    const userEmail = session.user.email.toLowerCase().trim()
    const body = await req.json()
    const { examType, prompt, essay, result } = body

    if (!examType || !prompt || !essay || !result) {
      return NextResponse.json({ error: 'Thiếu thông tin bài làm bắt buộc.' }, { status: 400 })
    }

    // Giới hạn độ dài để chống spam Database
    const MAX_PROMPT = 32000
    const MAX_ESSAY = 16000
    if (typeof prompt !== 'string' || prompt.length > MAX_PROMPT ||
        typeof essay !== 'string' || essay.length > MAX_ESSAY) {
      return NextResponse.json({ error: 'Nội dung bài viết vượt quá giới hạn cho phép.' }, { status: 400 })
    }

    const db = await getDb()
    const newId = crypto.randomUUID()
    const now = new Date()

    // Bắt buộc sinh UUID cho id để tránh lỗi NOT NULL constraint trong D1
    await db.insert(essayHistory).values({
      id: newId,
      email: userEmail,
      examType,
      prompt,
      essay,
      result: JSON.stringify(result),
      createdAt: now
    })

    return NextResponse.json({ 
      success: true, 
      id: newId,
      email: userEmail,
      timestamp: now.getTime()
    })
  } catch (error: any) {
    console.error('Error saving essay history to DB:', error)
    return NextResponse.json({ error: 'Không thể lưu lịch sử làm bài lúc này.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email.toLowerCase().trim()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const db = await getDb()

    // Phân quyền bảo mật xóa: Chỉ được phép xóa bản ghi thuộc email của chính mình
    if (id) {
      await db.delete(essayHistory).where(
        and(eq(essayHistory.id, String(id)), eq(essayHistory.email, userEmail))
      )
    } else {
      await db.delete(essayHistory).where(eq(essayHistory.email, userEmail))
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting essay history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

