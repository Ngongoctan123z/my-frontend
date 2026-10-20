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
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
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
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Hệ thống hỗ trợ những dạng câu hỏi nào trong đề thi TOPIK II?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Phòng thi hỗ trợ đầy đủ 4 dạng câu trong phần Viết (쓰기) TOPIK II: Câu 51 và 52 (điền từ vào chỗ trống trong đoạn văn thực dụng/thông báo), Câu 53 (phân tích biểu đồ dữ liệu khoảng 200-300 chữ) và Câu 54 (bài luận nghị luận xã hội khoảng 600-700 chữ).'
        }
      },
      {
        '@type': 'Question',
        name: 'Hệ thống sửa những lỗi ngữ pháp tiếng Hàn nào?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hệ thống kiểm tra chi tiết quy tắc giãn cách từ (띄어쓰기), cách sử dụng tiểu từ chủ ngữ/tân ngữ (은/는, 이/가, 을/를), tính thống nhất của đuôi câu văn viết (-ㄴ/는다) và gợi ý các cấu trúc ngữ pháp trung cao cấp.'
        }
      },
      {
        '@type': 'Question',
        name: 'Lịch sử bài viết có được lưu lại không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có. Khi bạn đăng nhập tài khoản, toàn bộ bài làm cùng điểm số và lời giải thích sửa lỗi sẽ được lưu trữ an toàn trong mục Lịch sử bài viết để bạn theo dõi tiến bộ từng ngày.'
        }
      },
      {
        '@type': 'Question',
        name: 'Bài viết của tôi có được bảo mật không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Toàn bộ nội dung luyện tập được mã hóa và chỉ hiển thị trong tài khoản học tập cá nhân của bạn, đảm bảo quyền riêng tư tối đa.'
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
          Luyện tập các câu 51, 52, 53 và 54 trong đề thi TOPIK II tiếng Hàn. Hệ thống phân tích lỗi ngữ pháp, chính tả, cách chia đuôi câu và gợi ý biểu hiện cao cấp giúp bài viết đạt điểm tối ưu.
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
              <strong>Câu 53 (Phân tích biểu đồ):</strong> Tập trung vào các biểu hiện miêu tả xu hướng biến động (tăng, giảm, duy trì, đạt đỉnh), phân tích nguyên nhân và triển vọng. Cần hạn chế nêu ý kiến cá nhân trong câu này.
            </li>
            <li>
              <strong>Câu 54 (Nghị luận xã hội):</strong> Yêu cầu bài luận 600-700 chữ với lập luận chặt chẽ, chia đều các ý theo 3 câu hỏi gợi ý của đề bài, sử dụng linh hoạt các ngữ pháp cao cấp (cấp 4-6) và từ vựng Hán Hàn trang trọng.
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
            Mọi bài viết của bạn sau khi gửi chấm sẽ được lưu giữ trong mục <strong>Lịch sử bài viết</strong> của tài khoản cá nhân. Bạn có thể mở lại bài làm bất kỳ lúc nào để học theo bài mẫu đạt điểm cao, kiểm tra lại những lỗi sai ngữ pháp đã được giải thích chi tiết và theo dõi tiến trình tiến bộ của mình.
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
                IELTS Writing chuẩn Cambridge
              </Link>, phòng thi{' '}
              <Link href="/ai-grader/toeic" className="text-blue-600 font-semibold hover:underline">
                TOEIC Writing chuẩn ETS
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
        </article>
      </div>
    </div>
  )
}

