import Link from 'next/link'
import { getCoreMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() { return getCoreMetadata('/privacy') }

export default function PrivacyPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Chính sách bảo mật</h1>
      <p>Trang này mô tả cách VNDocs xử lý thông tin tài khoản, bài viết và bản thu khi bạn dùng các tính năng luyện Writing và Speaking.</p>

      <h2>1. Tài khoản và lịch sử bài làm</h2>
      <p>VNDocs sử dụng đăng nhập Google cho các tính năng theo tài khoản. Thông tin hồ sơ đăng nhập như tên, email và ảnh đại diện được dùng để nhận diện tài khoản. Lịch sử bài làm, bản chữ nhận dạng, nhận xét, điểm luyện tập và thông tin gói được lưu theo tài khoản để phục vụ việc xem lại và quản lý lượt sử dụng.</p>

      <h2>2. Xử lý bài viết và âm thanh</h2>
      <p>Khi bạn yêu cầu chấm bài, nội dung đề, bài làm và thông tin cần thiết được gửi tới các nhà cung cấp AI bên ngoài để xử lý. Với Speaking, âm thanh được gửi khi bạn chọn chuyển bản thu thành chữ hoặc nộp bài; dịch vụ nhận dạng giọng nói và AI có thể xử lý bản thu, bản chữ và thông tin nhịp nói để tạo kết quả.</p>
      <p>Chữ trực tiếp trong lúc nói có thể sử dụng dịch vụ nhận dạng của trình duyệt. Dữ liệu được xử lý bởi dịch vụ bên ngoài chịu chính sách của nhà cung cấp tương ứng. Không nên đưa mật khẩu, thông tin tài chính hoặc dữ liệu nhạy cảm không cần thiết vào bài luyện.</p>

      <h2>3. Bản nháp, bản thu và lưu trữ trên thiết bị</h2>
      <p>Trình duyệt có thể lưu bản nháp, bản thu Speaking và tùy chọn giao diện trên thiết bị, bao gồm qua bộ nhớ trình duyệt và IndexedDB. Khi nộp bài, bản thu Speaking được lưu để phục vụ xử lý và nghe lại theo tài khoản. Bản nháp cục bộ không bảo đảm xuất hiện trên thiết bị khác; xóa dữ liệu trình duyệt có thể xóa các bản lưu này.</p>

      <h2>4. Cookie và dịch vụ bên ngoài</h2>
      <p>Đăng nhập và các tính năng giao diện có thể dùng cookie hoặc bộ nhớ trình duyệt. Website cũng tải dịch vụ quảng cáo Google; nhà cung cấp bên ngoài có thể sử dụng cookie và công nghệ tương tự theo chính sách của họ. Các liên kết tới tài liệu, mạng xã hội hoặc website khác dẫn tới dịch vụ có cách xử lý dữ liệu riêng.</p>

      <h2>5. Liên hệ</h2>
      <p>Nếu có thắc mắc về cách xử lý dữ liệu, vui lòng dùng thông tin tại <Link href="/contact">trang liên hệ VNDocs</Link>.</p>
    </article>
  )
}

