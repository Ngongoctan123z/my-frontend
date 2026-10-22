import { resolveGradingPrompt } from '../ai-grader/prompt-context'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/src/db'
import { sharedExams, users } from '@/src/db/schema'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Bạn phải đăng nhập' }, { status: 401 })
    }

    const { examType, promptId, content, imageUrl, imageDescription, requirePhone, requireEmail } = await req.json()
    if (!examType || !content) {
      return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    
    if (!user.length) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }
    
    const plan = user[0].plan || 'free'
    if (plan !== 'plus' && plan !== 'pro' && user[0].role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ tài khoản PLUS hoặc PRO mới được tạo link chia sẻ' }, { status: 403 })
    }

    // Pro user only logic for custom exams
    // (If the UI sent a custom exam, it's allowed if Pro. We don't strictly validate the content vs system prompts here to save time, but we trust the UI)

    const canonical = await resolveGradingPrompt(examType, content, promptId, imageUrl)
    const id = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    await db.insert(sharedExams).values({
      id,
      creatorId: session.user.email,
      examType,
      content: canonical?.content || content,
      imageUrl: canonical?.imageUrl || imageUrl || null,
      imageDescription: canonical?.imageDescription || ((plan === 'pro' && imageDescription) ? imageDescription : null),
      requirePhone: requirePhone || false,
      requireEmail: requireEmail || false,
      createdAt: new Date(),
      expiresAt,
    })

    return NextResponse.json({ id, expiresAt: expiresAt.getTime() })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

