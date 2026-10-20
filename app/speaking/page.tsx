import { getCoreMetadata } from '@/src/utils/serverSeo'
import { Metadata } from 'next'
import { Suspense } from 'react'
import { FRONTEND_URL } from '@/src/utils/constants'
import { SpeakingClient } from './SpeakingClient'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> { return getCoreMetadata('/speaking') }

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Phòng Luyện Speaking IELTS & TOEIC Trực Tuyến VNDocs',
  operatingSystem: 'Web',
  inLanguage: 'vi',
  applicationCategory: 'EducationalApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
  description: 'Luyện IELTS và TOEIC Speaking với bản thu, nhận xét luyện tập và lịch sử theo tài khoản.',
  url: `${FRONTEND_URL}/speaking`
}

export default function SpeakingPage() {
  return (
    <div className="py-2.5 sm:py-6">
      <script
        id="speaking-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold">Đang tải phòng luyện Speaking...</div>}>
        <SpeakingClient />
      </Suspense>
      <section aria-labelledby="speaking-guide" className="mx-auto mt-8 max-w-4xl space-y-4 px-4 text-sm leading-7 text-slate-600">
        <h2 id="speaking-guide" className="text-xl font-bold text-slate-800">Cách luyện IELTS và TOEIC Speaking trên VNDocs</h2>
        <p>Chọn kỳ thi và đề luyện tập, cho phép trình duyệt sử dụng micro rồi ghi âm câu trả lời. Nghe lại bản thu, kiểm tra bản chép lời và đọc góp ý AI để xác định câu cần diễn đạt rõ hơn.</p>
        <h3 className="text-lg font-semibold text-slate-800">Luyện lại sau mỗi lần nhận góp ý</h3>
        <p>Ghi lại từ vựng và cấu trúc cần sửa, sau đó thu lại cùng một đề. So sánh hai bản thu về cách triển khai ý và độ trôi chảy. Đăng nhập để xem lịch sử luyện tập trong tài khoản.</p>
        <h3 className="text-lg font-semibold text-slate-800">Điểm AI có phải điểm thi chính thức không?</h3>
        <p>Điểm và nhận xét AI chỉ phục vụ luyện tập, có thể sai và không thay thế đánh giá của giám khảo. Bản chép lời cũng có thể nhận sai từ do tiếng ồn hoặc chất lượng micro; hãy đối chiếu với bản thu trước khi sửa bài.</p>
        <p>Kết hợp luyện nói với <Link href="/ai-grader/ielts" className="font-semibold text-blue-600 hover:underline">IELTS Writing Task 1 và Task 2</Link> hoặc <Link href="/ai-grader/toeic" className="font-semibold text-blue-600 hover:underline">TOEIC Writing</Link> để luyện cách tổ chức ý và sử dụng từ vựng.</p>
      </section>
    </div>
  )
}


