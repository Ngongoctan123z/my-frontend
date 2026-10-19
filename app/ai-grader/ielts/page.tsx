import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { AiGraderClient } from './AiGraderClient'
import { getRouteMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata(
    '/ai-grader/ielts',
    'Luyện Viết IELTS Writing Online Chuẩn Barem | VNDocs',
    'Phòng luyện IELTS Writing Task 1 & 2 trực tuyến. Đánh giá chi tiết 4 tiêu chí chuẩn giám khảo, phát hiện lỗi ngữ pháp, từ vựng và lưu bài làm an toàn.'
  )
}

export default async function IeltsGraderPage() {
  const customSeo = await getCustomRouteSeo('/ai-grader/ielts')
  const h1Title = customSeo?.h1 || 'Phòng Luyện IELTS Writing Online'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Phòng Luyện Viết IELTS Writing Trực Tuyến VNDocs',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Thực hành luyện viết IELTS Writing Task 1 & 2 trực tuyến. Nhận xét chi tiết 4 tiêu chí TR, CC, LR, GRA và lưu lịch sử bài làm an toàn.',
    url: `${FRONTEND_URL}/ai-grader/ielts`
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
        name: 'IELTS Writing',
        item: `${FRONTEND_URL}/ai-grader/ielts`,
      }
    ]
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Hệ thống chấm IELTS Writing theo những tiêu chí nào?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hệ thống đánh giá bài viết dựa trên 4 tiêu chí chính thức của kỳ thi IELTS: Task Response / Task Achievement (mức độ hoàn thành đề bài), Coherence and Cohesion (tính mạch lạc và liên kết câu đoạn), Lexical Resource (vốn từ vựng và sự đa dạng ngữ nghĩa), và Grammatical Range and Accuracy (độ chính xác và độ đa dạng ngữ pháp).'
        }
      },
      {
        '@type': 'Question',
        name: 'Tôi có thể luyện tập cả Task 1 và Task 2 không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có. Bạn có thể chọn luyện tập cho cả IELTS Writing Task 1 (miêu tả biểu đồ, bản đồ, quy trình) và Task 2 (bài luận nghị luận xã hội). Hệ thống hỗ trợ nhập đề bài tùy chọn hoặc tải ngẫu nhiên các đề thi mẫu thực tế.'
        }
      },
      {
        '@type': 'Question',
        name: 'Bài viết và điểm số của tôi có được lưu lại không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có. Khi bạn đăng nhập vào tài khoản, toàn bộ bài làm, số điểm ước lượng và phần nhận xét chi tiết sẽ được tự động lưu vào mục Lịch sử bài viết riêng tư để bạn tiện theo dõi sự tiến bộ theo thời gian.'
        }
      },
      {
        '@type': 'Question',
        name: 'Thông tin bài viết của tôi có được bảo mật không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Mọi bài viết của người học đều được bảo mật an toàn qua giao thức mã hóa SSL. Dữ liệu chỉ hiển thị trong tài khoản học tập cá nhân của bạn và không được chia sẻ cho bất kỳ bên thứ ba nào.'
        }
      }
    ]
  }

  return (
    <div className="py-2.5 sm:py-6 md:px-16 lg:px-20 max-w-[1248px] mx-auto">
      <Script
        id="software-jsonld-ielts"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-ielts"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="faq-jsonld-ielts"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="w-full">
        <AiGraderClient />
      </div>

      {/* H1 + Description moved below the grader tool */}
      <div className="w-full mt-6 sm:mt-8 px-4 sm:px-0">
        <h1 className="text-2xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium mb-2 text-sm">
          Đánh giá chi tiết 4 tiêu chí chuẩn IELTS, phát hiện các điểm cần hoàn thiện về ngữ pháp và từ vựng, hỗ trợ bạn rèn luyện phản xạ viết tự tin mỗi ngày.
        </p>
        <p className="text-slate-600 font-medium text-sm">
          Hỗ trợ luyện tập cả Task 1 và Task 2 với phản hồi khách quan, giúp bạn nhận diện chính xác lỗi diễn đạt và theo dõi sự tiến bộ qua từng bài viết.
        </p>
      </div>

      {/* Educational Article & Internal Links */}
      <div className="w-full mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-slate-200 px-4 sm:px-0">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Phương pháp tối ưu bài viết IELTS Writing Task 1 & Task 2
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Kỹ năng Viết trong kỳ thi IELTS luôn đòi hỏi thí sinh phải kết hợp hài hòa giữa khả năng tư duy logic và sự chính xác trong ngữ pháp, từ vựng. Khi luyện tập tại phòng viết trực tuyến của VNDocs, bạn có thể thực hiện theo quy trình chuẩn sau để đạt kết quả tốt nhất:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Bước 1 - Phân tích đề bài:</strong> Chọn dạng bài (Task 1 miêu tả số liệu hoặc Task 2 nghị luận xã hội). Bạn có thể bấm "Lấy đề mới" để luyện các đề thi thật hoặc tự dán đề bài của riêng mình.
            </li>
            <li>
              <strong>Bước 2 - Thực hành viết bài:</strong> Hoàn thành bài viết trong khung soạn thảo với số từ khuyến nghị (tối thiểu 150 từ cho Task 1 và 250 từ cho Task 2).
            </li>
            <li>
              <strong>Bước 3 - Nhận xét và rút kinh nghiệm:</strong> Nhấn "Chấm Điểm" để nhận phân tích chi tiết. Hãy chú ý đọc kỹ các lỗi ngữ pháp được chỉ ra và bài mẫu gợi ý để viết lại những câu văn chưa tự nhiên.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Bản chất 4 tiêu chí chấm điểm chính thức của IELTS
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Mỗi bài viết được hệ thống phân tích dựa trên khung barem của giám khảo bản xứ:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Task Response (TR) / Task Achievement (TA):</strong> Đo lường việc trả lời trọng tâm câu hỏi, luận điểm có được phát triển đầy đủ và dẫn chứng rõ ràng hay không.
            </li>
            <li>
              <strong>Coherence and Cohesion (CC):</strong> Đánh giá bố cục đoạn văn, sự liên kết tự nhiên giữa các ý tưởng và cách sử dụng các từ nối tránh lặp lại.
            </li>
            <li>
              <strong>Lexical Resource (LR):</strong> Xem xét sự phong phú của từ vựng học thuật, độ chuẩn xác về ngữ cảnh (collocations) và hạn chế lỗi chính tả.
            </li>
            <li>
              <strong>Grammatical Range and Accuracy (GRA):</strong> Rà soát tỷ lệ câu đơn, câu ghép, câu phức cũng như mức độ chính xác của các thì, mệnh đề quan hệ và dấu câu.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Lưu trữ lịch sử học tập & Bảo mật thông tin
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            Toàn bộ bài làm của bạn sau khi gửi chấm sẽ được đồng bộ an toàn vào tài khoản cá nhân. Bạn có thể mở lại mục <strong>Lịch sử bài viết</strong> bất kỳ lúc nào để xem lại những lỗi sai trước đây, so sánh điểm số giữa các lần viết và quan sát rõ nét sự tiến bộ của bản thân theo thời gian. Chúng tôi cam kết bảo mật tuyệt đối nội dung học tập của người dùng.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Các phòng luyện Writing và Speaking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Để mở rộng vốn từ vựng và cấu trúc ngữ pháp, bạn có thể tham khảo thêm các tài nguyên học tập hữu ích tại VNDocs:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
            <li><Link href="/speaking" className="text-blue-600 font-semibold hover:underline">Luyện Speaking IELTS và TOEIC</Link>: ghi âm, nghe lại và nhận góp ý cho bài nói.</li>
            <li>
              Thực hành thêm kỹ năng viết cho các chứng chỉ quốc tế khác: phòng luyện{' '}
              <Link href="/ai-grader/toeic" className="text-blue-600 font-semibold hover:underline">
                TOEIC Writing trực tuyến
              </Link>, phòng thi{' '}
              <Link href="/ai-grader/topik" className="text-blue-600 font-semibold hover:underline">
                TOPIK II 쓰기 tiếng Hàn
              </Link>, và phòng luyện{' '}
              <Link href="/ai-grader/hsk" className="text-blue-600 font-semibold hover:underline">
                Viết tiếng Trung HSK
              </Link>.
            </li>
          </ul>

          {/* Visible FAQ Section */}
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
            Câu hỏi thường gặp về phòng luyện IELTS Writing
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
