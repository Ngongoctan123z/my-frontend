import { NextRequest, NextResponse } from 'next/server'
import { learnerGradingResult } from '@/src/lib/publicWritingPrompt'
import { getDb } from '@/src/db'
import { sharedExams, sharedExamSubmissions, users, apiUsages } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'
import { gradeAnyExam } from '@/src/services/aiGraderService'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { sharedExamId, studentName, studentPhone, studentEmail, essay } = await req.json()

    if (!sharedExamId || !studentName || !essay) {
      return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 })
    }

    const db = await getDb()

    // 1. Check shared exam
    const examResult = await db.select().from(sharedExams).where(eq(sharedExams.id, sharedExamId)).limit(1)
    if (!examResult.length) {
      return NextResponse.json({ error: 'Đề thi không tồn tại' }, { status: 404 })
    }
    const exam = examResult[0]

    if (Date.now() > exam.expiresAt.getTime()) {
      return NextResponse.json({ error: 'Đường link đã hết hạn' }, { status: 403 })
    }

    // 2. Check creator quota
    const creatorResult = await db.select().from(users).where(eq(users.email, exam.creatorId)).limit(1)
    if (!creatorResult.length) {
      return NextResponse.json({ error: 'Người tạo đề không tồn tại' }, { status: 404 })
    }
    const creator = creatorResult[0]
    
    if (!creator.email) {
      return NextResponse.json({ error: 'Người tạo đề không có email' }, { status: 400 })
    }

    // Check API usage limit for creator
    let usageLimit = 0
    if (creator.plan === 'plus') usageLimit = 50 // 50/day
    if (creator.plan === 'pro') usageLimit = 200 // 200/day
    if (creator.role === 'admin') usageLimit = 1000

    const today = new Date().toISOString().split('T')[0]
    const usageResult = await db.select().from(apiUsages).where(and(eq(apiUsages.userId, creator.email as string), eq(apiUsages.date, today))).limit(1)
    let count = 0
    if (usageResult.length > 0) {
      count = usageResult[0].count
    }

    if (count >= usageLimit) {
      return NextResponse.json({ error: 'Tài khoản của giáo viên đã hết lượt chấm bài hôm nay' }, { status: 429 })
    }

    // 3. Increment usage
    if (usageResult.length > 0) {
      await db.update(apiUsages).set({ count: count + 1 }).where(and(eq(apiUsages.userId, creator.email as string), eq(apiUsages.date, today)))
    } else {
      await db.insert(apiUsages).values({ userId: creator.email as string, date: today, count: 1 })
    }

    // 4. Grade Essay
    const gradedResult = await gradeAnyExam(exam.examType, { 
      content: exam.content, 
      imageUrl: exam.imageUrl || undefined,
      imageDescription: exam.imageDescription || undefined
    }, essay)

    // 5. Save submission
    await db.insert(sharedExamSubmissions).values({
      sharedExamId: exam.id,
      studentName,
      studentPhone: studentPhone || null,
      studentEmail: studentEmail || null,
      studentEssay: essay,
      gradingResult: JSON.stringify(gradedResult),
      createdAt: new Date()
    })

    return NextResponse.json({ success: true, result: learnerGradingResult(gradedResult) })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 })
  }
}

