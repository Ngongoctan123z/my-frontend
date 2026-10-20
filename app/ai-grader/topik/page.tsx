import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import { TopikGraderClient } from './TopikGraderClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/ai-grader/topik')
}

export default async function TopikPage() {
  const customSeo = await getCustomRouteSeo('/ai-grader/topik')
  const h1Title = customSeo?.h1 || PAGE_SEO["/ai-grader/topik"].h1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Phòng Luyện Viết TOPIK II 쓰기 Trực Tuyến VNDocs',
    operatingSystem: 'Web',
    inLanguage: 'vi',
    applicationCategory: 'EducationalApplication',
    description: 'Luyện thi phần viết TOPIK II câu 51, 52, 53, 54 tiếng Hàn. Sửa lỗi ngữ pháp, chính tả, gợi ý từ vựng nâng cao và bài viết mẫu điểm cao.',
    url: `${FRONTEND_URL}/ai-grader/topik`
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
        name: 'TOPIK Writing',
        item: `${FRONTEND_URL}/ai-grader/topik`,
      }
    ]
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Phòng luyện TOPIK II theo cấu trúc nào?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Phòng luyện dùng các dạng câu 51–54 của TOPIK II trên giấy (PBT): điền câu 51–52, bài viết 200–300 ký tự tiếng Hàn ở câu 53 và bài luận 600–700 ký tự ở câu 54. Đây là số ký tự, không phải số từ; hãy kiểm tra định dạng kỳ thi bạn đăng ký vì IBT có thể khác."
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
          "text": "Với câu 51–52, đọc cả câu trước và sau chỗ trống để chọn cấu trúc phù hợp. Với câu 53, đối chiếu từng con số và chỉ dùng thông tin đề cho. Với câu 54, kiểm tra đã trả lời đủ ý được hỏi, dùng văn viết nhất quán và nằm trong giới hạn ký tự."
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
    <div className="py-2.5 sm:py-6 md:px-8 max-w-[1312px] mx-auto">
      <script
        id="software-jsonld-topik"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="breadcrumb-jsonld-topik"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="faq-jsonld-topik"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="w-full">
        <TopikGraderClient />
      </div>

      {/* H1 + Description moved below the grader tool */}
      <div className="w-full mt-6 sm:mt-8 px-4 sm:px-0">
        <h1 className="text-2xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium text-sm">
          Luyện tập các câu 51, 52, 53 và 54 trong đề thi TOPIK II tiếng Hàn. Hệ thống phân tích lỗi ngữ pháp, chính tả, cách chia đuôi câu và gợi ý biểu hiện cao cấp để bạn kiểm tra và sửa lại bài.
        </p>
      </div>

      {/* Educational Article & Internal Links */}
      <div className="w-full mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-slate-200 px-4 sm:px-0">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Bí quyết làm chủ phần thi Viết TOPIK II (쓰기)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Phần thi Viết luôn là thử thách lớn đối với thí sinh ôn thi TOPIK II bởi vừa đòi hỏi độ chính xác về ngữ pháp, vừa yêu cầu vốn từ vựng Hán Hàn học thuật và tốc độ làm bài hợp lý. Để đạt điểm số mong muốn, bạn nên chia thời gian và rèn luyện kỹ năng theo từng phần:
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            1. Trọng tâm ôn luyện từng dạng câu hỏi
          </h3>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Câu 51 & 52 (Điền chỗ trống):</strong> Cần xác định đúng ngữ cảnh văn bản (thư tín thực dụng, thông báo sinh hoạt hay giải thích khoa học) để chọn đúng đuôi câu văn phong trang trọng (-ㅂ/습니다) hoặc đuôi văn giải thích (-ㄴ/는다), kết hợp các liên từ điều kiện quen thuộc.
            </li>
            <li>
              <strong>Câu 53 (Phân tích biểu đồ):</strong> Tập trung vào các biểu hiện miêu tả xu hướng biến động (tăng, giảm, duy trì, đạt đỉnh), đối chiếu chính xác các thông tin được đề cung cấp. Cần hạn chế nêu ý kiến cá nhân trong câu này.
            </li>
            <li>
              <strong>Câu 54 (Nghị luận xã hội):</strong> Yêu cầu bài luận 600–700 ký tự tiếng Hàn với lập luận chặt chẽ, trả lời đủ những ý được hỏi trong đề, ưu tiên cấu trúc phù hợp, liên kết rõ ràng và văn phong nhất quán.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            2. Tiêu chuẩn đánh giá sát đề thi thật
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Hệ thống phân tích bài viết dựa trên các tiêu chí chấm thi của Viện Giáo dục Quốc tế Quốc gia Hàn Quốc (NIIED):
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Nội dung và cấu trúc (내용 및 과제 수행):</strong> Trả lời đủ các yêu cầu của đề bài, bố cục mở bài, thân bài, kết bài cân đối.
            </li>
            <li>
              <strong>Tính logic và liên kết (글의 전개 구조):</strong> Sử dụng khéo léo các từ nối (반면에, 그럼에도 불구하고, 이와 같이) để đoạn văn mượt mà.
            </li>
            <li>
              <strong>Ngôn ngữ và ngữ pháp (언어 사용):</strong> Đánh giá mức độ phong phú của từ vựng, độ chính xác của ngữ pháp và chuẩn chính tả giãn cách từ.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            3. Đồng bộ lịch sử học tập & Bảo mật
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            Mọi bài viết của bạn sau khi gửi chấm sẽ được lưu giữ trong mục <strong>Lịch sử bài viết</strong> của tài khoản cá nhân. Bạn có thể mở lại bài làm bất kỳ lúc nào để học theo bài mẫu gợi ý, kiểm tra lại những lỗi sai ngữ pháp đã được giải thích chi tiết và theo dõi tiến trình tiến bộ của mình.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Các phòng luyện Writing và Speaking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Để trau dồi thêm kỹ năng làm bài và mở rộng vốn từ vựng, bạn có thể tham khảo thêm các tài nguyên học tập hữu ích tại VNDocs:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
            <li><Link href="/speaking" className="text-blue-600 font-semibold hover:underline">Luyện Speaking IELTS và TOEIC</Link>: ghi âm, nghe lại và nhận góp ý cho bài nói.</li>
            <li>
              Tham khảo thêm các phòng luyện viết ngoại ngữ khác: phòng thi{' '}
              <Link href="/ai-grader/ielts" className="text-blue-600 font-semibold hover:underline">
                Luyện IELTS Writing
              </Link>, phòng thi{' '}
              <Link href="/ai-grader/toeic" className="text-blue-600 font-semibold hover:underline">
                Luyện TOEIC Writing
              </Link>, và phòng luyện{' '}
              <Link href="/ai-grader/hsk" className="text-blue-600 font-semibold hover:underline">
                Viết tiếng Trung HSK
              </Link>.
            </li>
          </ul>

          {/* Visible FAQ Section */}
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
            Câu hỏi thường gặp về phòng luyện viết TOPIK II
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
            <p><a href="https://exam.topik.go.kr/nasdata/webnas/raonkeditordata/uploadId/2024/02/20240227_175504804_07236.pdf" className="font-semibold text-blue-600 hover:underline">TOPIK II Writing Task Types and Assessment Guide</a> · <Link href="/privacy" className="text-blue-600 hover:underline">Chính sách bảo mật</Link></p>
          </aside>
        </article>
      </div>
    </div>
  )
}


