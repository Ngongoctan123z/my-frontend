import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/src/db'
import { chatMessages, users } from '@/src/db/schema'
import { desc, eq, and, or } from 'drizzle-orm'
import { auth } from '@/auth'
import { checkRateLimit } from '@/src/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    
    // Check if the user is an admin
    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    const isAdmin = user[0]?.role === 'admin'

    let messages
    
    // For normal user, fetch only their messages (plus admin replies to them)
    if (!isAdmin) {
      messages = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, session.user.email))
        .orderBy(chatMessages.createdAt)
    } else {
      // If the caller is admin, they shouldn't use this route normally, but if they do, we'll return nothing
      // Admin will have a different endpoint to view all conversations
      return NextResponse.json([])
    }

    return NextResponse.json(messages)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = checkRateLimit(`chat:${session.user.email}`, 5, 3000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Thao tác gửi tin quá nhanh. Vui lòng chờ ${rl.retryAfterSeconds} giây.` },
        { status: 429 }
      )
    }

    const { content, toUserId } = await req.json()
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (typeof content !== 'string' || content.length > 90_000) {
      return NextResponse.json({ error: 'Nội dung hoặc tệp đính kèm quá lớn đối với cơ sở dữ liệu (tối đa 90KB). Vui lòng gửi link chia sẻ đối với tài liệu lớn.' }, { status: 400 })
    }

    const db = await getDb()
    
    const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
    const isAdmin = user[0]?.role === 'admin'

    try {
      await db.insert(chatMessages).values({
        userId: isAdmin && toUserId ? toUserId : session.user.email,
        isAdmin,
        content,
        createdAt: new Date()
      })
    } catch (dbErr: any) {
      console.error('[Chat D1 Insert Error]:', dbErr)
      return NextResponse.json({ error: 'Không thể lưu tin nhắn vào hệ thống: ' + (dbErr.message || 'D1 Database Error') }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
