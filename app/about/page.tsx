import Link from 'next/link'
import { getCoreMetadata } from '@/src/utils/serverSeo'

export async function generateMetadata() { return getCoreMetadata('/about') }

export default function AboutPage() {
  return (
    <article className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Về VNDocs — Luyện Writing và Speaking</h1>
      <p>VNDocs là nền tảng luyện viết và luyện nói dành cho người học ngoại ngữ. Bạn có thể thực hành theo từng dạng bài, đọc nhận xét AI, xem lại lỗi và luyện lại cùng một kỹ năng.</p>

      <h2>Những gì bạn có thể luyện tập</h2>
      <ul>
        <li><Link href="/ai-grader/ielts">IELTS Writing Task 1 và Task 2</Link>: thực hành viết và xem góp ý về yêu cầu đề, bố cục, từ vựng và ngữ pháp.</li>
        <li><Link href="/ai-grader/toeic">TOEIC Writing câu 1–8</Link>: viết câu theo ảnh, trả lời email và viết bài luận quan điểm.</li>
        <li><Link href="/ai-grader/topik">TOPIK II câu 51–54</Link> và <Link href="/ai-grader/hsk">HSK 5, HSK 6</Link>: luyện các dạng bài viết tiếng Hàn và tiếng Trung.</li>
        <li><Link href="/speaking">IELTS và TOEIC Speaking</Link>: ghi âm, nghe lại, xem bản chữ nhận dạng và nhận góp ý cho bài nói.</li>
      </ul>

      <h2>Cách sử dụng nhận xét AI</h2>
      <p>Điểm và nhận xét AI là thông tin tham khảo để luyện tập, có thể sai và không thay thế kết quả thi chính thức hay đánh giá của giáo viên. Hãy đối chiếu góp ý với đề bài và bài làm gốc, chọn lỗi cần sửa rồi viết hoặc nói lại. Với Speaking, bản chữ nhận dạng cũng có thể nghe nhầm từ.</p>
      <p>VNDocs hoạt động độc lập, không phải đơn vị tổ chức thi và không đại diện cho các tổ chức sở hữu kỳ thi IELTS, TOEIC, TOPIK hoặc HSK. Tài liệu mẫu của nhà xuất bản được ghi nguồn tại nơi sử dụng.</p>

      <h2>Tài khoản và lịch sử luyện tập</h2>
      <p>Đăng nhập bằng Google để sử dụng các tính năng theo tài khoản và xem lại lịch sử bài làm. Số lượt chấm phụ thuộc gói đang dùng; xem <Link href="/premium">trang gói học tập</Link> và thông tin lượt còn lại trong phòng luyện trước khi nộp bài.</p>
      <p>Bạn có thể tìm hiểu cách xử lý bài viết, bản thu và dữ liệu tài khoản trong <Link href="/privacy">chính sách bảo mật</Link>.</p>

      <h2>Phản hồi và hỗ trợ</h2>
      <p>Nếu gặp lỗi kỹ thuật hoặc nhận xét chưa phù hợp, hãy gửi thông tin qua <Link href="/contact">trang liên hệ VNDocs</Link>. Nội dung phản hồi cụ thể giúp xác định vấn đề trong đề bài, bản chữ hoặc kết quả chấm.</p>
    </article>
  )
}

