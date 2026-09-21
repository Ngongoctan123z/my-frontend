import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, Share2, Star } from 'lucide-react'
import { Breadcrumb } from '../components/common/Breadcrumb'
import { ExamList } from '../components/exam/ExamList'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useNotify } from '../context/NotificationContext'
import { useUser } from '../context/UserContext'
import { getExamById, getExamByPath, getExams, getRelatedExams, recordView, requestDownload } from '../services/examService'
import { BASE_URL, SUBJECTS, PROVINCES } from '../utils/constants'
import { formatNumber } from '../utils/dateFormat'
import { setJsonLd, useSeo } from '../utils/seo'
import { examTypeLabel, pathToExamType, slugify } from '../utils/slug'

const PDFViewer = lazy(() =>
  import('../components/exam/PDFViewer').then((mod) => ({ default: mod.PDFViewer })),
)
const DocxViewer = lazy(() =>
  import('../components/exam/DocxViewer').then((mod) => ({ default: mod.DocxViewer })),
)

export function ExamDetail() {
  const params = useParams<{ id?: string; examType?: string; subject?: string; province?: string; year?: string }>()
  const { id } = params
  const examType = params.examType ?? 'vao-10'
  const subject = params.subject ?? 'toan'
  const province = params.province ?? 'nam-dinh'
  const year = params.year ?? '2024'

  const parsedType = pathToExamType(examType)
  const fallbackSubject = SUBJECTS.find((item) => slugify(item) === subject) ?? subject
  const fallbackProvince = PROVINCES.find((item) => slugify(item) === province) ?? province
  const fallbackYear = Number(year)

  const { isFavorite, toggleFavorite } = useUser()
  const { notify } = useNotify()
  const [downloading, setDownloading] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  const examQuery = useQuery({
    queryKey: ['exam', id, examType, fallbackSubject, fallbackProvince, fallbackYear],
    queryFn: async () => {
      // 1. Nếu có param id -> truy vấn trực tiếp bằng ID
      if (id && !isNaN(Number(id))) {
        return await getExamById(Number(id))
      }

      // 2. Thử lookup theo path chuẩn
      try {
        const found = await getExamByPath({
          examType,
          subject: fallbackSubject,
          province: fallbackProvince,
          year: fallbackYear,
        })
        if (found) return found
      } catch (e) {
        console.warn('Path lookup error, trying fallback search...', e)
      }

      // 3. Fallback: tìm theo danh sách đề theo năm và so khớp slug
      try {
        const res = await getExams({
          examType: parsedType,
          year: fallbackYear,
          limit: 50,
        })
        const match = res.data.find(
          (e) =>
            slugify(e.subject) === subject &&
            slugify(e.province) === province &&
            e.year === fallbackYear,
        )
        if (match) return match
      } catch (err) {
        console.error('Fallback search error:', err)
      }

      return undefined
    },
  })

  const exam = examQuery.data
  const type = exam ? exam.examType : parsedType
  const subjectLabel = exam?.subject ?? fallbackSubject
  const provinceLabel = exam?.province ?? fallbackProvince
  const yearNumber = exam?.year ?? fallbackYear
  const title = exam?.title || `Đề thi ${subjectLabel} ${examTypeLabel(type) === 'Vào 10' ? 'vào 10' : 'THPT'} ${provinceLabel} ${yearNumber}`

  useSeo(
    `${title} | Tải PDF`,
    `${title}. Xem online và tải PDF hoàn toàn miễn phí.`,
  )

  useEffect(() => {
    if (exam?.id) recordView(exam.id)
  }, [exam?.id])

  useEffect(() => {
    if (!exam) {
      setJsonLd('exam-jsonld', null)
      return
    }
    setJsonLd('exam-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: title,
      identifier: exam.examCode,
      educationalLevel: examTypeLabel(type),
      about: subjectLabel,
      spatialCoverage: provinceLabel,
      datePublished: String(yearNumber),
      url: window.location.href,
    })
    return () => setJsonLd('exam-jsonld', null)
  }, [exam, title, type, subjectLabel, provinceLabel, yearNumber])

  const related = useQuery({
    queryKey: ['related', exam?.id],
    queryFn: () => getRelatedExams(exam!.id),
    enabled: Boolean(exam?.id),
  })



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
        // fileUrl từ backend là relative ("/files/...") → join với BASE_URL
        const fullUrl = result.fileUrl.startsWith('http')
          ? result.fileUrl
          : `${BASE_URL}${result.fileUrl}`
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

  if (examQuery.isLoading) {
    return <p className="text-ink-muted">Đang tải đề thi...</p>
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
          <Link to="/" className="btn-press bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-medium inline-block">
            Về trang chủ tìm kiếm
          </Link>
          <Link to={`/`} className="btn-press border border-line px-5 py-2.5 rounded-xl font-medium inline-block hover:bg-page">
            Xem tất cả đề thi
          </Link>
        </div>
      </div>
    )
  }

  const favorite = isFavorite(exam.id)

  const renderFileViewer = (fileUrl: string, fileTitle: string) => {
    const absoluteFileUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE_URL}${fileUrl}`
    const fileExt = fileUrl.split('.').pop()?.toLowerCase()
    const isPdf = fileExt === 'pdf'
    const isDocx = ['docx', 'doc'].includes(fileExt ?? '')
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileExt ?? '')
    
    if (isPdf) {
      return (
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-line bg-surface"><p className="text-ink-muted">Đang khởi tạo trình xem PDF...</p></div>}>
          <PDFViewer src={absoluteFileUrl} title={fileTitle} />
        </Suspense>
      )
    }

    if (isDocx) {
      return (
        <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-line bg-surface"><p className="text-ink-muted">Đang kết xuất tài liệu Word...</p></div>}>
          <DocxViewer src={absoluteFileUrl} title={fileTitle} />
        </Suspense>
      )
    }
    
    if (isImage) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-line bg-surface p-4">
          <img src={absoluteFileUrl} alt={fileTitle} className="max-w-full max-h-[80vh] rounded-xl shadow-md object-contain" />
        </div>
      )
    }
    
    return (
        <div className="flex flex-col min-h-[30vh] items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-ink font-semibold">Tài liệu không hỗ trợ xem trước online (Định dạng {fileExt?.toUpperCase()})</p>
          <p className="text-ink-muted mt-2 mb-4">Vui lòng tải xuống để xem nội dung chi tiết.</p>
          <a href={absoluteFileUrl} download>
            <Button>
              <Download size={18} className="mr-2" /> Tải về máy
            </Button>
          </a>
        </div>
    )
  }

  return (
    <div className="space-y-6 py-12 md:py-16">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: examTypeLabel(type), to: `/category/${examType}` },
          { label: subjectLabel, to: `/exams/${examType}/${subject}` },
          { label: provinceLabel, to: `/exams/${examType}/${subject}/${province}` },
          { label: String(yearNumber) },
        ]}
      />
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-2 text-ink-muted text-base">
            Mã đề: <span className="font-mono text-[var(--color-primary)]">{exam.examCode}</span> · {formatNumber(exam.downloadCount)} lượt tải · {formatNumber(exam.viewCount)} lượt xem
          </p>
        </div>

      </div>

      <div ref={pdfRef} className="mb-10">
        {renderFileViewer(exam.fileUrl, exam.title || exam.examCode)}
      </div>

      <Card className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between" padding={false}>
        <div className="p-6 md:p-8">
          <p className="text-xl font-semibold">Tải đề thi miễn phí</p>
          <p className="mt-2 text-ink-muted">Bạn có thể xem online đầy đủ hoặc tải tài liệu này về máy hoàn toàn miễn phí.</p>
        </div>
        <div className="flex flex-wrap gap-3 bg-[var(--bg-primary)] p-6 md:p-8 md:rounded-r-2xl">
          <Button className={`min-h-[48px] px-6 ${downloading ? 'pulse-blue' : ''}`} onClick={() => handleDownload(false)}>
            <Download size={20} className="mr-1" />
            Tải đề thi
          </Button>
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

      {/* Phần hiển thị đáp án */}
      <div className="mb-12">
        {exam.answerFileUrl ? (
          <>
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Đáp án / Hướng dẫn giải</h2>
            <div className="mb-10">
              {renderFileViewer(exam.answerFileUrl, `Đáp án ${exam.title || exam.examCode}`)}
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

      {related.data && related.data.length > 0 ? (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            Xem thêm đề {subjectLabel} tại {provinceLabel}
          </h2>
          <ExamList exams={related.data} />
        </section>
      ) : null}

    </div>
  )
}
