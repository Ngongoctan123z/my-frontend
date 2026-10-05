import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/src/db'
import { sharedExams, sharedExamSubmissions } from '@/src/db/schema'
import { auth } from '@/auth'
import { eq, desc } from 'drizzle-orm'

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
    
    // Find all submissions for these exams
    // Drizzle ORM 'inArray' can be used, but for simplicity with sqlite, we can just fetch all and filter, or use an inArray clause if we import it.
    // Let's just do a join or fetch all and filter since sqlite is fast.
    const allSubmissions = await db.select().from(sharedExamSubmissions).orderBy(desc(sharedExamSubmissions.createdAt))
    
    const mySubmissions = allSubmissions.filter(sub => examIds.includes(sub.sharedExamId))

    // Map to include exam details
    const result = mySubmissions.map(sub => {
      const exam = exams.find(e => e.id === sub.sharedExamId)
      return {
        ...sub,
        examType: exam?.examType,
        examContent: exam?.content,
        gradingResult: JSON.parse(sub.gradingResult)
      }
    })

    return NextResponse.json({ submissions: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
