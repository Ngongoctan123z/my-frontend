import { getCoreMetadata } from '@/src/utils/serverSeo'
import React from 'react'

export async function generateMetadata() { return getCoreMetadata('/terms') }

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Điều khoản sử dụng</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">Cập nhật lần cuối: 20/10/2026</p>
      <p className="text-[var(--text-secondary)] text-base">Bằng việc truy cập và sử dụng website <strong>VNDocs.net</strong>, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ của chúng tôi.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">1. Chấp nhận điều khoản</h2>
      <p className="text-[var(--text-secondary)] text-base">Khi sử dụng VNDocs, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý ràng buộc bởi các Điều khoản sử dụng này. Nếu bạn không đồng ý, xin vui lòng ngừng sử dụng website.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">2. Quyền sở hữu trí tuệ</h2>
      <p className="text-[var(--text-secondary)] text-base">Nội dung, công cụ, giao diện, logo và mã nguồn do VNDocs tự tạo thuộc quyền sở hữu của VNDocs. Nhãn hiệu kỳ thi, tài liệu mẫu và PDF của nhà xuất bản thuộc chủ sở hữu tương ứng; việc dẫn nguồn không có nghĩa VNDocs sở hữu hoặc được các đơn vị đó bảo trợ. Bạn không được sao chép, chỉnh sửa hoặc phân phối nội dung do VNDocs sở hữu vì mục đích thương mại mà không có sự cho phép bằng văn bản.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">3. Sử dụng dịch vụ</h2>
      <ul className="text-[var(--text-secondary)] text-base space-y-2 list-disc pl-5">
        <li>Bạn cam kết không sử dụng VNDocs cho bất kỳ mục đích bất hợp pháp hoặc vi phạm pháp luật nào.</li>
        <li>Bạn không được thực hiện các hành vi cố ý gây gián đoạn hoặc can thiệp trái phép vào hoạt động của trang web.</li>
        <li>Bạn cam kết sử dụng các tính năng luyện viết và công cụ học tập đúng mục đích học tập cá nhân.</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">4. Từ chối trách nhiệm</h2>
      <p className="text-[var(--text-secondary)] text-base">VNDocs cung cấp nội dung và dịch vụ luyện tập mang tính chất tham khảo. Nội dung đề, bản chữ nhận dạng và nhận xét có thể có sai sót. Tính năng chấm điểm AI mang tính chất gợi ý học thuật, không thay thế hoàn toàn được các kỳ thi thực tế. VNDocs không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh từ việc sử dụng thông tin trên website.</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">5. Thay đổi điều khoản</h2>
      <p className="text-[var(--text-secondary)] text-base">Chúng tôi có quyền sửa đổi các Điều khoản này vào bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang web. Việc bạn tiếp tục sử dụng VNDocs đồng nghĩa với việc bạn chấp nhận các thay đổi đó.</p>
    </div>
  )
}

