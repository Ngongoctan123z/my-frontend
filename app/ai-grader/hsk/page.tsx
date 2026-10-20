import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import { HskGraderClient } from './HskGraderClient'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/ai-grader/hsk')
}

export default async function HskPage() {
  const customSeo = await getCustomRouteSeo('/ai-grader/hsk')
  const h1Title = customSeo?.h1 || PAGE_SEO["/ai-grader/hsk"].h1

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Phòng Luyện Viết HSK Writing Trực Tuyến VNDocs',
    operatingSystem: 'Web',
    inLanguage: 'vi',
    applicationCategory: 'EducationalApplication',
    description: 'Luyện viết phần thi HSK 5 đoạn văn 80 chữ và HSK 6 tóm tắt 400 chữ. Rà soát ngữ pháp, lỗi dùng từ và gợi ý diễn đạt tự nhiên hơn.',
    url: `${FRONTEND_URL}/ai-grader/hsk`
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
        name: 'HSK Writing',
        item: `${FRONTEND_URL}/ai-grader/hsk`,
      }
    ]
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "VNDocs hỗ trợ luyện viết HSK ở cấp độ nào?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Phòng luyện tập trung vào dạng viết HSK 5 và HSK 6 trong các mẫu đề hệ 1–6: sắp xếp câu, đoạn khoảng 80 chữ Hán ở HSK 5 và tóm tắt khoảng 400 chữ ở HSK 6. Kiểm tra thông báo của đơn vị tổ chức để chọn đúng cấu trúc kỳ thi bạn đăng ký."
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
          "text": "Với HSK 5, kiểm tra trật tự từ và dùng đủ từ khóa đúng ngữ cảnh; đừng ghép từ khóa thành các câu rời rạc. Với HSK 6, gạch ra các sự kiện chính để đối chiếu bản tóm tắt, bỏ chi tiết phụ và tránh thêm quan điểm không có trong văn bản."
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
        id="software-jsonld-hsk"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="breadcrumb-jsonld-hsk"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        id="faq-jsonld-hsk"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="w-full">
        <HskGraderClient />
      </div>

      {/* H1 + Description moved below the grader tool */}
      <div className="w-full mt-6 sm:mt-8 px-4 sm:px-0">
        <h1 className="text-2xl font-black text-slate-800 mb-2">{h1Title}</h1>
        <p className="text-slate-600 font-medium text-sm">
          Rà soát ngữ pháp, từ vựng tiếng Trung, phân tích cấu trúc câu và gợi ý cách hành văn tự nhiên rõ ràng hơn cho các cấp độ thi HSK.
        </p>
      </div>

      {/* Educational Article & Internal Links */}
      <div className="w-full mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-slate-200 px-4 sm:px-0">
        <article className="prose prose-slate max-w-none text-justify">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Bí quyết nâng cao điểm số phần thi Viết HSK (书写)
          </h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Phần thi Viết trong kỳ thi năng lực Hán ngữ (HSK) luôn đòi hỏi thí sinh phải kết hợp giữa vốn chữ Hán chuẩn xác, cấu trúc ngữ pháp chặt chẽ và khả năng biểu đạt tư tưởng một cách mạch lạc. Khi luyện tập tại phòng viết VNDocs, bạn có thể áp dụng các kinh nghiệm sau:
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            1. Trọng tâm ôn luyện theo từng cấp độ
          </h3>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>HSK 5 (Phần viết đoạn văn ~80 chữ):</strong> Bạn sẽ gặp 2 dạng: hoàn thành đoạn văn dựa trên 5 từ vựng cho sẵn hoặc viết đoạn văn dựa trên tranh ảnh minh họa. Yêu cầu quan trọng là dùng đúng ngữ cảnh của các từ khóa, câu văn liên kết tự nhiên và không viết sai chữ Hán.
            </li>
            <li>
              <strong>HSK 6 (Tóm tắt văn bản ~400 chữ):</strong> Thí sinh đọc một văn bản khoảng 1000 chữ trong 10 phút, sau đó viết lại bài tóm tắt khoảng 400 chữ mà không được mang theo tài liệu. Điểm cốt lõi là ghi nhớ đúng cốt truyện, nhân vật, diễn biến thời gian và rút ngắn câu chữ súc tích.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            2. Những điểm cần kiểm tra khi tự sửa bài
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Dùng các nhóm nhận xét sau để rà soát bản nháp; điểm AI là ước tính luyện tập:
          </p>
          <ul className="text-slate-600 space-y-2 mb-6">
            <li>
              <strong>Độ chính xác của từ vựng và chữ Hán:</strong> Nhận diện và sửa các lỗi sai do dùng nhầm từ gần nghĩa (近义词), lỗi dùng sai ngữ cảnh hoặc gõ sai pinyin.
            </li>
            <li>
              <strong>Ngữ pháp câu (语法):</strong> Sửa các lỗi trật tự từ (định ngữ, trạng ngữ, bổ ngữ), cách đặt câu chữ 把 / câu chữ 被 và cách dùng trợ từ kết cấu (的, 地, 得).
            </li>
            <li>
              <strong>Tính mạch lạc của bài viết:</strong> Đánh giá việc sử dụng liên từ nối ý (不但...而且..., 虽然...但是..., 从而) giúp đoạn văn tự nhiên và logic.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            3. Đồng bộ lịch sử học tập & Bảo mật
          </h3>
          <p className="text-slate-600 leading-relaxed mb-6">
            Khi đăng nhập tài khoản, mọi bài viết của bạn sẽ được lưu giữ an toàn trong mục <strong>Lịch sử bài viết</strong>. Bạn có thể mở lại bài làm bất kỳ lúc nào để học theo bài mẫu gợi ý, xem lại lời giải thích sửa lỗi chi tiết và tự tin hơn trước ngày thi thực tế.
          </p>

          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-3">
            Các phòng luyện Writing và Speaking
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Để mở rộng vốn từ vựng và ngữ pháp, bạn có thể tham khảo thêm các tài nguyên học tập hữu ích tại VNDocs:
          </p>
          <ul className="text-slate-600 space-y-2 mb-8">
            <li><Link href="/speaking" className="text-blue-600 font-semibold hover:underline">Luyện Speaking IELTS và TOEIC</Link>: ghi âm, nghe lại và nhận góp ý cho bài nói.</li>
            <li>
              Thực hành thêm kỹ năng viết cho các chứng chỉ ngoại ngữ khác: phòng thi{' '}
              <Link href="/ai-grader/ielts" className="text-blue-600 font-semibold hover:underline">
                Luyện IELTS Writing
              </Link>, phòng thi{' '}
              <Link href="/ai-grader/toeic" className="text-blue-600 font-semibold hover:underline">
                Luyện TOEIC Writing
              </Link>, và phòng luyện{' '}
              <Link href="/ai-grader/topik" className="text-blue-600 font-semibold hover:underline">
                TOPIK II 쓰기 tiếng Hàn
              </Link>.
            </li>
          </ul>

          {/* Visible FAQ Section */}
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
            Câu hỏi thường gặp về phòng luyện viết HSK
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
            <p><a href="https://www.chinesetest.cn/HSK/5" className="font-semibold text-blue-600 hover:underline">Chinese Testing International — HSK 5</a> · <a href="https://www.chinesetest.cn/HSK/6" className="font-semibold text-blue-600 hover:underline">HSK 6</a> · <Link href="/privacy" className="text-blue-600 hover:underline">Chính sách bảo mật</Link></p>
          </aside>
        </article>
      </div>
    </div>
  )
}


