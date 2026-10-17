import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/src/db'
import { sharedExams, sharedExamSubmissions } from '@/src/db/schema'
import { auth } from '@/auth'
import { eq, desc, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Bạn phải đăng nhập' }, { status: 401 })
    }

    const db = await getDb()
    
    // Find all exams created by this user
    const exams = await db.select().from(sharedExams).where(eq(sharedExams.creatorId, session.user.email))
    
    if (!exams.length) {
      return NextResponse.json({ submissions: [] })
    }

    const examIds = exams.map(e => e.id)
    
    // Find all submissions for these exams using DB-level filtering
    const mySubmissions = await db
      .select()
      .from(sharedExamSubmissions)
      .where(inArray(sharedExamSubmissions.sharedExamId, examIds))
      .orderBy(desc(sharedExamSubmissions.createdAt))

    // Map to include exam details
    const result = mySubmissions.map(sub => {
      const exam = exams.find(e => e.id === sub.sharedExamId)
      return {
        ...sub,
        examType: exam?.examType,
        examContent: exam?.content,
        imageUrl: exam?.imageUrl || null,
        imageDescription: exam?.imageDescription || null,
        gradingResult: JSON.parse(sub.gradingResult)
      }
    })

    return NextResponse.json({ submissions: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
