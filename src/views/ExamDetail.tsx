'use client'

import { Suspense, useEffect, useRef, useState, use } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Download, Share2, Star } from 'lucide-react'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { ExamList } from '../components/exam/ExamList'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useNotify } from '../context/NotificationContext'
import { useUser } from '../context/UserContext'
import { getRelatedExams, recordView, requestDownload } from '../services/examService'
import { BASE_URL, SUBJECTS, PROVINCES } from '../utils/constants'
import { formatNumber } from '../utils/dateFormat'
import { setJsonLd, useSeo } from '../utils/seo'
import { examTypeLabel, pathToExamType, slugify } from '../utils/slug'

const PDFViewer = dynamic(
  () => import('../components/exam/PDFViewer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="w-full h-[600px] flex items-center justify-center text-ink-muted">Đang tải trình xem PDF...</div> }
)
const DocxViewer = dynamic(
  () => import('../components/exam/DocxViewer').then((mod) => mod.DocxViewer),
  { ssr: false, loading: () => <div className="w-full h-[600px] flex items-center justify-center text-ink-muted">Đang tải trình xem DOCX...</div> }
)

export function ExamDetail({ initialExam, initialRelated, slug }: { initialExam: any, initialRelated: any[], slug: string[] }) {
  
  const id = slug.length === 1 ? slug[0] : undefined
  const examType = slug.length >= 4 ? slug[0] : 'vao-10'
  const subject = slug.length >= 4 ? slug[1] : 'toan'
  const province = slug.length >= 4 ? slug[2] : 'nam-dinh'
  const year = slug.length >= 4 ? slug[3] : '2024'

  const parsedType = pathToExamType(examType)
  const fallbackSubject = SUBJECTS.find((item) => slugify(item) === subject) ?? subject
  const fallbackProvince = PROVINCES.find((item) => slugify(item) === province) ?? province
  const fallbackYear = Number(year)

  const { isFavorite, toggleFavorite } = useUser()
  const { notify } = useNotify()
  const [downloading, setDownloading] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  const exam = initialExam
  const type = exam ? exam.examType : parsedType
  const subjectLabel = exam?.subject ?? fallbackSubject
  const provinceLabel = exam?.province ?? fallbackProvince
  const yearNumber = exam?.year ?? fallbackYear
  const title = exam?.title || `Đề thi ${subjectLabel} ${examTypeLabel(type) === 'Vào 10' ? 'vào 10' : 'THPT'} ${provinceLabel} ${yearNumber}`

  useSeo(
    exam?.seoTitle || `${title} | Tải PDF`,
    exam?.sourceUrl && exam?.description ? exam.description : `${title}. Xem online và tải PDF hoàn toàn miễn phí.`,
  )

  useEffect(() => {
    if (exam?.id) recordView(exam.id)
  }, [exam?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const tryTypeset = () => {
      const mj = (window as any).MathJax
      if (mj?.typesetPromise) {
        try { mj.typesetPromise() } catch {}
        return true
      }
      return false
    }

    if (!tryTypeset()) {
      // Poll every 300ms tối đa 15 lần (~4.5s) cho đến khi MathJax load xong
      let attempts = 0
      const interval = setInterval(() => {
        if (tryTypeset() || ++attempts >= 15) clearInterval(interval)
      }, 300)
      return () => clearInterval(interval)
    }
  }, [exam?.seoStructure, exam?.contentHtml])



  const relatedExams = initialRelated

  const handleDownload = async (bulk: boolean) => {
    if (!exam) return
    setDownloading(true)
    try {
      const result = await requestDownload(exam.id, bulk)
      if (bulk && result.paymentLink) {
        notify('Gói 10k: chuyển tới thanh toán (demo)', 'info')
        window.open(result.paymentLink, '_blank')
      } else {
        notify('Tải đề thành công', 'success')
        // fileUrl từ backend là relative ("/files/...") → join qua proxy /backend-files
        const fullUrl = result.fileUrl.startsWith('http')
          ? result.fileUrl
          : `/backend-files${result.fileUrl.replace('/files', '')}`
        window.open(fullUrl, '_blank')
      }
    } catch {
      notify('Không tải được đề', 'danger')
    } finally {
      setDownloading(false)
    }
  }

  const shareExam = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      notify('Đã copy link để chia sẻ', 'success')
    } catch {
      notify('Không chia sẻ được link', 'danger')
    }
  }



  if (!exam) {
    return (
      <div className="space-y-4 py-16 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-3">🔍</div>
        <h1 className="text-2xl font-bold">Không tìm thấy đề này</h1>
        <p className="text-ink-muted">
          Đề thi môn {subjectLabel} tỉnh {provinceLabel} năm {yearNumber} chưa có hoặc đang cập nhật.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <Link prefetch={false} href="/" className="btn-press bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-medium inline-block">
            Về trang chủ tìm kiếm
          </Link>
          <Link prefetch={false} href={`/`} className="btn-press border border-line px-5 py-2.5 rounded-xl font-medium inline-block hover:bg-page">
            Xem tất cả đề thi
          </Link>
        </div>
      </div>
    )
  }

  const favorite = isFavorite(exam.id)

  const renderContent = (htmlContent: string, title: string) => {
    return (
      <div className="prose prose-sm max-w-none rounded-xl border border-line bg-surface p-4 md:p-6 text-sm leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    )
  }

  const renderFileViewer = (fileUrl: string | undefined, fileTitle: string) => {
    if (!fileUrl) {
      return (
        <div className="flex flex-col min-h-[30vh] items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-ink font-semibold">Tài liệu không có nội dung xem trước</p>
          <p className="text-ink-muted mt-2 mb-4">Vui lòng tải xuống hoặc xem nội dung khác.</p>
        </div>
      )
    }
    // Handle CORS issues by proxying files through Next.js rewrite
    const proxiedFileUrl = fileUrl.startsWith('http') 
      ? fileUrl 
      : `/backend-files${fileUrl.replace('/files', '')}`;
      
    const absoluteFileUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_URL}${fileUrl}`
    const fileExt = fileUrl.split('.').pop()?.toLowerCase()
    const isPdf = fileExt === 'pdf'
    const isDocx = ['docx', 'doc'].includes(fileExt ?? '')
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileExt ?? '')
    
    if (isPdf) {
      return (
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-line bg-surface"><p className="text-ink-muted">Đang khởi tạo trình xem PDF...</p></div>}>
          <PDFViewer src={proxiedFileUrl} title={fileTitle} />
        </Suspense>
      )
    }

    if (isDocx) {
      return (
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-line bg-surface"><p className="text-ink-muted">Đang kết xuất tài liệu Word...</p></div>}>
          <DocxViewer src={proxiedFileUrl} title={fileTitle} />
        </Suspense>
      )
    }
    
    if (isImage) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-4">
          <img src={proxiedFileUrl} alt={fileTitle} className="max-w-full max-h-[80vh] rounded-xl shadow-md object-contain" />
        </div>
      )
    }
    
    return (
        <div className="flex flex-col min-h-[30vh] items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-ink font-semibold">Tài liệu không hỗ trợ xem trước online (Định dạng {fileExt?.toUpperCase()})</p>
          <p className="text-ink-muted mt-2 mb-4">Vui lòng tải xuống để xem nội dung chi tiết.</p>
          <a href={proxiedFileUrl} download>
            <Button>
              <Download size={18} className="mr-2" /> Tải về máy
            </Button>
          </a>
        </div>
    )
  }

  return (
    <div className="py-12 md:py-16 flex flex-col lg:flex-row gap-8 items-start">
      {/* Main Content (3/4 width on desktop) */}
      <div className="w-full lg:w-3/4 space-y-6">
        <Breadcrumb
          items={[
          { label: 'Trang chủ', to: '/' },
          { label: examTypeLabel(type), to: `/tai-lieu?examType=${encodeURIComponent(type)}` },
          { label: subjectLabel, to: `/tai-lieu?examType=${encodeURIComponent(type)}&subject=${encodeURIComponent(subjectLabel)}` },
          { label: provinceLabel, to: `/tai-lieu?examType=${encodeURIComponent(type)}&subject=${encodeURIComponent(subjectLabel)}&province=${encodeURIComponent(provinceLabel)}` },
          { label: String(yearNumber) },
        ]}
      />
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl leading-tight">{title}</h1>
          {exam.sourceUrl && <p className="mt-2 text-xs leading-relaxed text-ink-muted">Nguồn: <a href={exam.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{exam.sourcePublisher || 'Trang công bố đề'}</a>{exam.pdfPageCount ? ` · PDF ${exam.pdfPageCount} trang` : ''}</p>}
          <p className="mt-1 text-ink-muted text-xs">
            Mã đề: <span className="font-mono text-[var(--color-primary)]">{exam.examCode}</span> · {formatNumber(exam.downloadCount)} lượt tải · {formatNumber(exam.viewCount)} lượt xem
          </p>
        </div>
      </div>

      <div className="mb-4">
        {exam.seoStructure ? (() => {
          const cleaned = exam.seoStructure
            .replace(/<\/?details[^>]*>/g, '')
            .replace(/<\/?summary[^>]*>[\s\S]*?<\/summary>/gi, '')
            .replace(/<strong[^>]*>(Câu\s+\w+[:.]?)<\/strong>/gi, '<span class="font-semibold">$1</span>')

          // Tách phần cấu trúc và phần nội dung đề (AI cũ nhét cả 2 vào seoStructure)
          const noContentIdx = cleaned.search(/<h4[^>]*>/i)
          const h4Content = noContentIdx >= 0 ? cleaned.slice(noContentIdx) : ''
          const isExamContent = h4Content.toLowerCase().includes('n\u1ed9i dung \u0111\u1ec1 thi')
          const structurePart = (noContentIdx >= 0 && isExamContent) ? cleaned.slice(0, noContentIdx) : cleaned

          return (
            <>
              <details className="group rounded-lg border border-line bg-surface overflow-hidden">
                <summary className="flex items-center justify-between px-3 py-2 cursor-pointer select-none text-sm font-semibold text-ink hover:bg-page transition-colors list-none">
                  <span>Cấu trúc đề thi</span>
                  <svg className="w-4 h-4 text-ink-muted transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-3 pb-3 pt-2 text-sm text-ink border-t border-line">
                  <div dangerouslySetInnerHTML={{ __html: structurePart }} />
                </div>
              </details>
              {noContentIdx >= 0 && isExamContent && (
                <div className="mt-6 prose prose-sm max-w-none overflow-x-auto overflow-y-hidden break-words w-full">
                  <div dangerouslySetInnerHTML={{ __html: h4Content }} />
                </div>
              )}
            </>
          )
        })() : null}
      </div>

      <div ref={pdfRef} className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-ink">Đề thi dạng PDF</h2>
        {exam.contentHtml ? renderContent(exam.contentHtml, "Đề thi") : renderFileViewer(exam.fileUrl, exam.title || exam.examCode)}
        {!exam.contentHtml && exam.plainText && (
          <div className="sr-only">
            {exam.plainText}
          </div>
        )}
      </div>

      {/* Phần hiển thị đáp án */}
      <div className="mb-12">
        {exam.answerFileUrl ? (
          <>
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Đáp án / Hướng dẫn giải</h2>
            <div className="mb-10">
              {exam.answerHtml ? renderContent(exam.answerHtml, "Đáp án") : renderFileViewer(exam.answerFileUrl, `Đáp án ${exam.title || exam.examCode}`)}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-12 text-center text-ink-muted shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-primary)] text-[var(--color-primary)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>
              </div>
            </div>
            <p className="text-xl font-semibold text-ink">Tài liệu này không có đáp án</p>
            <p className="mt-2 text-base">Hiện tại hệ thống chưa cập nhật file đáp án cho đề thi này.</p>
          </div>
        )}
      </div>

      <Card className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between" padding={false}>
        <div className="p-6 md:p-8">
          <p className="text-xl font-semibold">Tải đề thi miễn phí</p>
          <p className="mt-2 text-ink-muted">Bạn có thể xem online đầy đủ hoặc tải tài liệu này về máy hoàn toàn miễn phí.</p>
        </div>
        <div className="flex flex-wrap gap-3 bg-[var(--bg-primary)] p-6 md:p-8 md:rounded-r-2xl">
          <a
            href={`/files/${exam.slugIdentifier || exam.examCode}${exam.fileUrl ? `?url=${encodeURIComponent(exam.fileUrl)}` : ''}`}
            download
            className="inline-block"
            onClick={(e) => {
              if (navigator.sendBeacon) {
                navigator.sendBeacon(`/api/exams/${exam.id}/download`);
              }
            }}
          >
            <Button className="min-h-[48px] px-6">
              <Download size={20} className="mr-1" />
              Tải đề thi
            </Button>
          </a>
          {exam.answerFileUrl && (
            <a
              href={exam.answerFileUrl.startsWith('http') ? exam.answerFileUrl : `${BASE_URL}${exam.answerFileUrl}`}
              download
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="secondary" className="min-h-[48px] px-5">
                <Download size={20} className="mr-1" />
                Tải đáp án
              </Button>
            </a>
          )}
          <Button variant="ghost" className="min-h-[48px]" onClick={shareExam}>
            <Share2 size={20} className="mr-1" />
            Chia sẻ
          </Button>
          <Button
            variant={favorite ? 'accent' : 'ghost'}
            className="min-h-[48px]"
            onClick={() => {
              const next = toggleFavorite(exam.id)
              notify(next ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích', next ? 'success' : 'info')
            }}
          >
            <Star size={20} className="mr-1" fill={favorite ? 'currentColor' : 'none'} />
            Yêu thích
          </Button>
        </div>
      </Card>
      </div>

      {/* Right Column - Related Exams (1/4 width on desktop) */}
      {relatedExams && relatedExams.length > 0 && (
        <div className="w-full lg:w-1/4 lg:sticky lg:top-[100px]">
          <h2 className="mb-4 text-xl font-bold tracking-tight border-b border-line pb-3">
            Đề xuất liên quan
          </h2>
          <ExamList exams={relatedExams} compact={true} />
        </div>
      )}

    </div>
  )
}
