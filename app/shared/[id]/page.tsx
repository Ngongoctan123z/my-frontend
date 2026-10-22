import { learnerSharedExam } from '@/src/lib/publicWritingPrompt'
import { getDb } from '@/src/db'
import { sharedExams } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { SharedExamClient } from './SharedExamClient'

export const dynamic = 'force-dynamic'

export default async function SharedExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()
  const exam = await db.select().from(sharedExams).where(eq(sharedExams.id, id)).limit(1)

  if (!exam.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Không tìm thấy bài thi</h1>
          <p className="text-gray-600">Đường link này không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    )
  }

  const examData = exam[0]

  if (Date.now() > examData.expiresAt.getTime()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-orange-600 mb-2">Đường link đã hết hạn</h1>
          <p className="text-gray-600">Đường link chia sẻ này đã vượt quá thời hạn 24 giờ.</p>
        </div>
      </div>
    )
  }

  return <SharedExamClient exam={learnerSharedExam(examData)} />
}

