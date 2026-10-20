import { getCoreMetadata } from '@/src/utils/serverSeo'
import React from 'react'

export async function generateMetadata() { return getCoreMetadata('/contact') }

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Liên hệ hợp tác</h1>
      <p className="text-[var(--text-secondary)] text-base">VNDocs luôn mong muốn được kết nối với người dùng, các thầy cô giáo, trung tâm đào tạo và các đối tác có cùng chí hướng phát triển giáo dục cộng đồng.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Phản hồi & Hỗ trợ</h2>
      <p className="text-[var(--text-secondary)] text-base">Nếu bạn gặp sự cố kỹ thuật, phát hiện lỗi trên website, hoặc có ý tưởng cải tiến tính năng, đừng ngần ngại cho chúng tôi biết. Mọi đóng góp của bạn đều là tài sản quý giá giúp VNDocs hoàn thiện hơn mỗi ngày.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Góp ý nội dung luyện tập</h2>
      <p className="text-[var(--text-secondary)] text-base">Bạn có góp ý cho bài luyện Writing hoặc Speaking? Hãy liên hệ để giúp chúng tôi cải thiện nội dung, nhận xét và trải nghiệm luyện tập.</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4 text-[var(--text-primary)]">Hợp tác phát triển & Quảng cáo</h2>
      <p className="text-[var(--text-secondary)] text-base">Chúng tôi mở rộng cửa chào đón các cơ hội hợp tác với các tổ chức giáo dục, trung tâm Tiếng Anh, hoặc các đối tác muốn quảng bá sản phẩm giáo dục đến tệp người dùng học sinh, sinh viên năng động của VNDocs.</p>

      <div className="mt-10 p-6 bg-[var(--bg-secondary)] rounded-[12px] border border-[var(--border-color)] not-prose">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Thông tin liên hệ trực tiếp:</h3>
        <ul className="space-y-4 text-[var(--text-secondary)] text-base">
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <span><strong>Email:</strong> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=vndocsnet@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">vndocsnet@gmail.com</a></span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--color-primary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span><strong>Mạng xã hội:</strong> <a href="https://www.facebook.com/people/Vndocsnet/61595105977293/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] font-medium hover:underline">FanPage Vndocs</a></span>
          </li>
        </ul>
      </div>
    </div>
  )
}

