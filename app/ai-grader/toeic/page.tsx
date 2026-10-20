import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import { ToeicGraderClient } from './ToeicGraderClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/ai-grader/toeic')
}

export default async function ToeicPage() {
  const customSeo = await getCustomRouteSeo('/ai-grader/toeic')
  const h1Title = customSeo?.h1 || PAGE_SEO["/ai-grader/toeic"].h1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Phòng Luyện Viết TOEIC Writing Trực Tuyến VNDocs',
    operatingSystem: 'Web',
    inLanguage: 'vi',
    applicationCategory: 'EducationalApplication',
    description: PAGE_SEO["/ai-grader/toeic"].description,
    url: `${FRONTEND_URL}/ai-grader/toeic`
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: FRONTEND_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Luyện Writing',
        item: `${FRONTEND_URL}/ai-grader`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'TOEIC Writing',
        item: `${FRONTEND_URL}/ai-grader/toeic`,
      }
    ]
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "TOEIC Writing có những dạng bài nào?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Luyện đủ 8 câu: câu 1–5 viết câu theo ảnh và dùng cả hai từ gợi ý; câu 6–7 trả lời hai email riêng; câu 8 viết bài luận quan điểm. Theo ETS, bài luận hiệu quả thường có ít nhất 300 từ và bạn có 30 phút để lập ý, viết, sửa."
        }
      },
      {
        "@type": "Question",
        "name": "Điểm AI có phải điểm thi chính thức không?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Không. Điểm và nhận xét là ước tính luyện tập, có thể bỏ sót hoặc nhận định sai. Hãy đọc lý do sửa lỗi, đối chiếu đề bài và tham khảo giáo viên khi cần; kết quả này không phải chứng nhận của đơn vị tổ chức kỳ thi."
        }
      },
      {
        "@type": "Question",
        "name": "Tôi nên dùng góp ý để cải thiện bài viết như thế nào?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Khi sửa câu theo ảnh, kiểm tra cả hai từ gợi ý và chi tiết thật sự nhìn thấy. Với email, đánh dấu từng yêu cầu của người gửi và đối chiếu với câu trả lời. Với bài luận, tìm một luận điểm chưa có ví dụ rồi viết thêm phần giải thích."
        }
      },
      {
        "@type": "Question",
        "name": "Tôi có thể xem lại bài đã nộp không?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Khi đăng nhập và nộp bài thành công, bạn có thể xem bài viết cùng kết quả trong mục lịch sử của tài khoản. Hãy so sánh các lỗi lặp lại giữa những lần luyện và tự lưu thêm bản nháp quan trọng."
        }
      },
      {
        "@type": "Question",
        "name": "Bài viết được xử lý như thế nào khi chấm AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nội dung bạn gửi được chuyển đến dịch vụ AI để tạo nhận xét. Tránh đưa mật khẩu, dữ liệu khách hàng hoặc thông tin cá nhân nhạy cảm vào bài luyện. Xem chính sách bảo mật để biết thêm về việc xử lý dữ liệu."
        }
      }
    ]
  }

  return (
    <div className="py-2.5 sm:py-6 md:px-16 lg:px-20 max-w-[1248px] mx-auto">
      <script
        id="software-jsonld-toeic"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="breadcrumb-jsonld-toeic"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="faq-jsonld-toeic"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="w-full">
        <ToeicGraderClient />
      </div>

      {/* H1 + Description moved below the grader tool */}
      <div className="w-full mt-6 sm:mt-8 px-4 sm:px-0">
        <h1 className="text-2xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium text-sm">
          Luyện tập các dạng bài TOEIC Writing gồm câu theo ảnh, trả lời email và bài luận. Dùng góp ý AI để kiểm tra mức độ trả lời đúng yêu cầu, ngữ pháp và từ vựng trong bài của bạn.
        </p>
      </div>

      {/* Educational Article & Internal Links */}
      <div className="w-full mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-slate-200 px-4 sm:px-0">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Kinh nghiệm làm bài thi TOEIC Writing đạt điểm cao
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Khác với các bài thi học thuật thuần túy, bài thi TOEIC Writing tập trung vào khả năng giao tiếp thực tế trong môi trường doanh nghiệp quốc tế. Để chuẩn bị chu đáo cho bài thi, người học cần nắm chắc cấu trúc và tiêu chuẩn chấm điểm sau:
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            1. Các dạng bài chính trong phần thi TOEIC Writing
          </h3>
          <ul className="text-slate-600 space-y-2 mb-6"><li><strong>Viết câu theo ảnh (Câu 1–5):</strong> Viết một câu mô tả mỗi ảnh, dùng đủ hai từ gợi ý. Tổng thời gian cho năm câu là 8 phút. Câu 6 và câu 7 là hai email riêng; câu 8 là bài luận quan điểm.</li>
            <li>
              <strong>Viết phản hồi thư điện tử (Questions 6-7):</strong> Thí sinh được yêu cầu đọc một email yêu cầu hoặc thắc mắc từ khách hàng, đối tác và viết thư phản hồi trong thời gian quy định (thường là 10 phút/email). Cần chú ý trả lời đầy đủ tất cả các câu hỏi hoặc nhiệm vụ được đề cập.
            </li>
            <li>
              <strong>Viết bài luận quan điểm (Question 8):</strong> Yêu cầu thí sinh viết một bài luận thường cần ít nhất 300 từ trong 30 phút để nêu quan điểm, phân tích lợi ích hoặc giải pháp cho một vấn đề nơi làm việc. Bài viết cần có bố cục mở bài, thân bài và kết bài rõ ràng.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            2. Tiêu chí đánh giá của giám khảo ETS
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Hệ thống phân tích bài viết dựa trên các khía cạnh cốt lõi mà ETS đặt ra:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Chất lượng phản hồi:</strong> Trả lời đúng trọng tâm câu hỏi, văn phong lịch sự, phù hợp với chuẩn mực giao tiếp kinh doanh.
            </li>
            <li>
              <strong>Vốn từ vựng thương mại (Business Vocabulary):</strong> Khả năng vận dụng linh hoạt các thuật ngữ công sở, danh ngữ chuyên nghiệp và tránh lặp từ đơn điệu.
            </li>
            <li>
              <strong>Ngữ pháp và liên kết câu:</strong> Sử dụng chính xác thì thời, câu bị động, câu điều kiện và các liên từ nối đoạn để bài viết mạch lạc.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            3. Lưu trữ lịch sử và theo dõi tiến độ
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            Khi đăng nhập tài khoản, mỗi bài làm của bạn sẽ được lưu giữ an toàn trong mục <strong>Lịch sử bài viết</strong>. Bạn có thể mở lại bài cũ bất cứ khi nào để đối chiếu với bài mẫu gợi ý, xem lại những lỗi sai ngữ pháp thường gặp và ghi nhận sự tiến bộ rõ rệt qua từng tuần học tập.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Các phòng luyện Writing và Speaking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Để nâng cao kỹ năng toàn diện, bạn có thể kết hợp ôn luyện với các tài nguyên học tập hữu ích tại VNDocs:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
            <li><Link href="/speaking" className="text-blue-600 font-semibold hover:underline">Luyện Speaking IELTS và TOEIC</Link>: ghi âm, nghe lại và nhận góp ý cho bài nói.</li>
            <li>
              Khám phá thêm các phòng luyện viết khác: phòng luyện{' '}
              <Link href="/ai-grader/ielts" className="text-blue-600 font-semibold hover:underline">
                Luyện IELTS Writing
              </Link>, phòng thi{' '}
              <Link href="/ai-grader/topik" className="text-blue-600 font-semibold hover:underline">
                TOPIK II tiếng Hàn
              </Link>, và phòng luyện{' '}
              <Link href="/ai-grader/hsk" className="text-blue-600 font-semibold hover:underline">
                Tiếng Trung HSK
              </Link>.
            </li>
          </ul>

          {/* Visible FAQ Section */}
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
            Câu hỏi thường gặp về phòng luyện TOEIC Writing
          </h3>
          <div className="space-y-4 not-prose">
            {faqJsonLd.mainEntity.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 text-sm sm:text-base mb-1.5">
                  {item.name}
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {item.acceptedAnswer.text}
                </p>
              </div>
            ))}
          </div>

          <aside aria-label="Đối chiếu với tài liệu của đơn vị tổ chức" className="mt-8 rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-sm leading-7 text-slate-600">
            <p>Điểm AI chỉ dùng để luyện tập; VNDocs không cấp kết quả khảo thí chính thức.</p>
            <p><a href="https://www.ets.org/pdfs/toeic/toeic-speaking-writing-sample-tests.pdf" className="font-semibold text-blue-600 hover:underline">ETS TOEIC Speaking and Writing Sample Tests</a> · <Link href="/privacy" className="text-blue-600 hover:underline">Chính sách bảo mật</Link></p>
          </aside>
        </article>
      </div>
    </div>
  )
}


