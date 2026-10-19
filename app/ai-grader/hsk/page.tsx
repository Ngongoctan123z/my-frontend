import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
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
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Luyện viết phần thi HSK 5 đoạn văn 80 chữ và HSK 6 tóm tắt 400 chữ. Rà soát ngữ pháp, lỗi dùng từ và gợi ý diễn đạt tự nhiên chuẩn bản xứ.',
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
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Phòng thi hỗ trợ luyện viết những cấp độ HSK nào?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hệ thống hỗ trợ chuyên sâu cho các cấp độ thi Viết chính: HSK 4, HSK 5 (viết đoạn văn kết hợp từ khóa cho sẵn hoặc dựa trên tranh ảnh ~80 chữ) và HSK 6 (đọc hiểu và tóm tắt văn bản ~400 chữ).'
        }
      },
      {
        '@type': 'Question',
        name: 'Hệ thống kiểm tra những lỗi sai ngữ pháp nào trong tiếng Trung?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hệ thống phân tích trật tự từ trong câu, cách sử dụng các trợ từ động thái (了, 着, 过), cấu trúc câu đặc biệt (câu chữ 把, câu chữ 被), cách dùng liên từ nối câu và phát hiện chữ Hán viết sai ngữ cảnh.'
        }
      },
      {
        '@type': 'Question',
        name: 'Bài viết và điểm số của tôi có được lưu lại không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Có. Khi bạn đăng nhập tài khoản, mọi bài viết cùng kết quả đánh giá và gợi ý sửa lỗi sẽ được lưu trữ an toàn trong mục Lịch sử bài viết riêng tư để bạn tiện ôn tập lại bất cứ khi nào.'
        }
      },
      {
        '@type': 'Question',
        name: 'Thông tin bài làm của tôi có được bảo mật không?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Dữ liệu làm bài được bảo mật an toàn, chỉ hiển thị trong tài khoản của bạn và cam kết không chia sẻ ra bên ngoài.'
        }
      }
    ]
  }

  return (
    <div className="py-2.5 sm:py-6 md:px-16 lg:px-20 max-w-[1248px] mx-auto">
      <Script
        id="software-jsonld-hsk"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-hsk"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
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
          Rà soát ngữ pháp, từ vựng tiếng Trung, phân tích cấu trúc câu và gợi ý cách hành văn tự nhiên chuẩn người bản ngữ cho các cấp độ thi HSK.
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
            2. Tiêu chuẩn đánh giá chuẩn khảo thí
          </h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            Hệ thống chấm chữa bài viết mô phỏng cách đánh giá của giám khảo khảo thí tiếng Trung:
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
            Khi đăng nhập tài khoản, mọi bài viết của bạn sẽ được lưu giữ an toàn trong mục <strong>Lịch sử bài viết</strong>. Bạn có thể mở lại bài làm bất kỳ lúc nào để học theo bài mẫu chuẩn bản xứ, xem lại lời giải thích sửa lỗi chi tiết và tự tin hơn trước ngày thi thực tế.
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
                IELTS Writing chuẩn band
              </Link>, phòng thi{' '}
              <Link href="/ai-grader/toeic" className="text-blue-600 font-semibold hover:underline">
                TOEIC Writing chuẩn ETS
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
        </article>
      </div>
    </div>
  )
}
