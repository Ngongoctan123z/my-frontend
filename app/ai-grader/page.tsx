import { PAGE_SEO } from '@/src/lib/pageSeo'
import { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { getCoreMetadata, getCustomRouteSeo } from '@/src/utils/serverSeo'
import { FRONTEND_URL } from '@/src/utils/constants'
import { ArrowRight, Sparkles, CheckCircle2, History } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return getCoreMetadata('/ai-grader')
}

export default async function AiGraderHubPage() {
  const customSeo = await getCustomRouteSeo('/ai-grader')
  const h1Title = customSeo?.h1 || PAGE_SEO["/ai-grader"].h1

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
      }
    ]
  }

  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Phòng Luyện Viết Ngoại Ngữ Trực Tuyến VNDocs',
    operatingSystem: 'Web',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'VND',
    },
    description: 'Nền tảng luyện viết trực tuyến cho IELTS, TOEIC, TOPIK và HSK. Đánh giá chi tiết theo tiêu chí chính thức và lưu trữ an toàn.',
    url: `${FRONTEND_URL}/ai-grader`
  }

  const cards = [
    {
      href: '/ai-grader/ielts',
      badge: 'Cambridge IELTS',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'IELTS Writing',
      subtitle: 'Academic Task 1 & Task 2',
      desc: 'Phân tích biểu đồ và viết luận xã hội. Đánh giá chi tiết 4 tiêu chí TR, CC, LR, GRA theo barem 9.0.',
      iconText: 'IELTS',
      iconBg: 'bg-blue-600 text-white',
      accentColor: 'hover:border-blue-500',
    },
    {
      href: '/ai-grader/toeic',
      badge: 'ETS Standard',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'TOEIC Writing',
      subtitle: 'Email phản hồi & Viết luận',
      desc: 'Thực hành Email Q6-7 và Luận quan điểm Q8. Chữa lỗi ngữ pháp công sở và từ vựng thương mại.',
      iconText: 'TOEIC',
      iconBg: 'bg-indigo-600 text-white',
      accentColor: 'hover:border-indigo-500',
    },
    {
      href: '/ai-grader/topik',
      badge: 'NIIED Hàn Quốc',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'TOPIK II 쓰기',
      subtitle: 'Câu 51, 52, 53 & 54',
      desc: 'Luyện điền khuyết, miêu tả biểu đồ và bài luận 700 chữ. Sửa lỗi chính tả, trợ từ và đuôi câu văn viết.',
      iconText: 'TOPIK',
      iconBg: 'bg-emerald-600 text-white',
      accentColor: 'hover:border-emerald-500',
    },
    {
      href: '/ai-grader/hsk',
      badge: 'Hanban Khảo thí',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      title: 'HSK Writing',
      subtitle: 'HSK 5 & HSK 6 Trọn bộ',
      desc: 'Sắp xếp câu, viết đoạn văn 80 chữ và tóm tắt 400 chữ. Rà soát trật tự từ và ngữ pháp chuẩn bản ngữ.',
      iconText: 'HSK',
      iconBg: 'bg-rose-600 text-white',
      accentColor: 'hover:border-rose-500',
    },
  ]

  return (
    <div className="py-4 sm:py-8 max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
      <Script
        id="software-jsonld-ai-grader-hub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd).replace(/</g, '\\u003c') }}
      />
      <Script
        id="breadcrumb-jsonld-ai-grader-hub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Header gọn gàng */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          {h1Title}
        </h1>
        <p className="text-slate-500 font-medium text-xs sm:text-sm">
          Chọn kỳ thi để vào phòng luyện viết và nhận kết quả chấm điểm AI tức thì theo barem quốc tế.
        </p>
      </div>

      {/* 4 Cards chứng chỉ - thiết kế tinh gọn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:shadow-md ${c.accentColor} transition-all duration-150 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`h-9 w-9 rounded-lg ${c.iconBg} flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                    {c.iconText}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {c.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {c.subtitle}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badgeColor} shrink-0`}>
                  {c.badge}
                </span>
              </div>

              <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed mb-3">
                {c.desc}
              </p>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
              <span>Bắt đầu luyện tập</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* 3 tính năng cốt lõi tinh giản */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200">
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2.5 text-xs">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-700">Chấm điểm tức thì trong 5 giây</span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-700">Chuẩn barem khảo thí chính thức</span>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2.5 text-xs">
          <History className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-semibold text-slate-700">Tự động lưu lịch sử bài viết</span>
        </div>
      </div>
    </div>
  )
}
