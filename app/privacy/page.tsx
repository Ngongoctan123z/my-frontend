import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật | VNDocs',
  description: 'Cam kết bảo mật thông tin và dữ liệu cá nhân của người dùng tại VNDocs.'
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Chính sách bảo mật</h1>
      <p className="text-[var(--text-secondary)] text-base">Tại <strong>VNDocs</strong>, chúng tôi coi trọng quyền riêng tư và cam kết bảo vệ dữ liệu cá nhân của bạn. Chính sách này giải thích cách chúng tôi xử lý và bảo vệ thông tin khi bạn sử dụng dịch vụ.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">1. Dữ liệu chúng tôi thu thập</h2>
      <p className="text-[var(--text-secondary)] text-base">VNDocs được thiết kế với tiêu chí tôn trọng tối đa quyền riêng tư:</p>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li><strong>Không yêu cầu đăng ký:</strong> Bạn có thể sử dụng hầu hết các tính năng (tải tài liệu, công cụ PDF) mà không cần tạo tài khoản.</li>
        <li><strong>Lưu trữ Offline:</strong> Các tính năng như danh sách Đề thi yêu thích (Favorites) hay Lịch sử chấm bài AI được lưu trữ hoàn toàn tại trình duyệt của bạn (sử dụng LocalStorage/IndexedDB). Chúng tôi KHÔNG lưu trữ dữ liệu này trên máy chủ.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">2. Về việc sử dụng API Key Gemini</h2>
      <p className="text-[var(--text-secondary)] text-base">Trong tính năng AI Grader, bạn cần nhập API Key của Google Gemini. VNDocs cam kết:</p>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li>API Key của bạn chỉ được sử dụng trực tiếp từ trình duyệt của bạn (Client-side) để gửi yêu cầu đến máy chủ của Google.</li>
        <li>Chúng tôi <strong>TUYỆT ĐỐI KHÔNG</strong> thu thập, lưu trữ hay gửi API Key của bạn về máy chủ của VNDocs.</li>
        <li>Bài viết (essay) của bạn cũng không được lưu trữ trên server của chúng tôi.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">3. Xử lý file PDF</h2>
      <p className="text-[var(--text-secondary)] text-base">Khi bạn sử dụng Bộ công cụ PDF (Gộp, Xóa trang, Khóa PDF), mọi thao tác xử lý đều diễn ra cục bộ trên trình duyệt của bạn. Các tài liệu quan trọng của bạn <strong>không bao giờ được tải lên bất kỳ máy chủ nào</strong>. Điều này đảm bảo an toàn tuyệt đối cho dữ liệu nhạy cảm của bạn.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">4. Cookie & Phân tích (Analytics)</h2>
      <p className="text-[var(--text-secondary)] text-base">Chúng tôi có thể sử dụng cookie để lưu trữ các tùy chọn giao diện (như Chế độ tối - Dark mode) và sử dụng các công cụ phân tích truy cập ẩn danh (ví dụ: Google Analytics) để hiểu rõ hơn về nhu cầu của người dùng nhằm cải thiện website. Tuy nhiên, không có thông tin định danh cá nhân nào được thu thập qua quá trình này.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">5. Liên hệ</h2>
      <p className="text-[var(--text-secondary)] text-base">Nếu bạn có bất kỳ thắc mắc nào về Chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua trang Liên hệ hợp tác.</p>
    </div>
  )
}
