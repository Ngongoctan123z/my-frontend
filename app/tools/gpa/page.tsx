import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tính điểm GPA tự động | Kho Đề Thi',
  description: 'Công cụ tính điểm trung bình môn GPA, hỗ trợ xét học bạ và dự kiến kết quả xét tuyển đại học chuẩn xác, nhanh chóng nhất.',
}

export default function GPAToolPage() {
  return (
    <div className="py-12 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Tính điểm GPA</h1>
        <p className="text-ink-muted">
          Công cụ tính điểm trung bình (GPA) đang được phát triển. Bạn sẽ sớm có thể nhập điểm số và xem ngay kết quả tại đây.
        </p>
      </div>

      <div className="p-8 rounded-2xl border border-dashed border-line bg-surface text-center">
        <p className="text-lg font-medium text-ink">⏳ Sắp ra mắt!</p>
        <p className="text-sm text-ink-muted mt-2">Chúng tôi đang hoàn thiện công cụ này để mang lại trải nghiệm tốt nhất cho bạn.</p>
      </div>
    </div>
  )
}
