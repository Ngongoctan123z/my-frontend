import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Về VNDocs — Nền tảng đề thi & học tập miễn phí hàng đầu Việt Nam',
  description: 'VNDocs cung cấp kho đề thi, công cụ chấm bài AI và tiện ích PDF hoàn toàn miễn phí. Tìm hiểu sứ mệnh và đội ngũ đứng sau VNDocs.',
  robots: { index: false, follow: false }
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Về VNDocs — Nền Tảng Học Tập & Đề Thi Trực Tuyến Miễn Phí</h1>
      <p className="text-[var(--text-secondary)] text-base">Chào mừng bạn đến với <strong>VNDocs</strong> - nền tảng học tập và chia sẻ tài liệu trực tuyến hàng đầu dành cho học sinh, sinh viên và người đi làm tại Việt Nam.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Sứ mệnh của chúng tôi</h2>
      <p className="text-[var(--text-secondary)] text-base">Chúng tôi tin rằng giáo dục là chìa khóa mở ra tương lai, và mọi người đều có quyền tiếp cận nguồn tri thức chất lượng mà không bị rào cản bởi chi phí. Sứ mệnh của VNDocs là cung cấp một hệ sinh thái học tập toàn diện, nơi kiến thức được chia sẻ miễn phí, minh bạch và dễ dàng tiếp cận.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Những gì chúng tôi cung cấp</h2>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li><strong>Kho đề thi phong phú:</strong> Hàng ngàn đề thi thử, đề thi chính thức vào lớp 10, THPT Quốc Gia được cập nhật liên tục kèm đáp án chi tiết.</li>
        <li><strong>Công cụ AI đột phá:</strong> Hệ thống chấm điểm Writing IELTS và TOEIC bằng Trí tuệ nhân tạo (AI) giúp bạn tự ôn luyện hiệu quả tại nhà.</li>
        <li><strong>Tiện ích xử lý tài liệu:</strong> Các công cụ thao tác với file PDF (gộp, cắt, khóa) giúp tối ưu hóa công việc học tập và văn phòng.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Đồng hành cùng VNDocs</h2>
      <p className="text-[var(--text-secondary)] text-base">VNDocs không chỉ là một website, mà là một cộng đồng. Chúng tôi liên tục lắng nghe phản hồi từ người dùng để cải thiện và mang đến những tính năng hữu ích nhất. Cảm ơn bạn đã lựa chọn VNDocs làm người bạn đồng hành trên con đường chinh phục tri thức!</p>
    </div>
  )
}
