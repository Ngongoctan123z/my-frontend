'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Eye, Search, Star, X, ExternalLink, FileText } from 'lucide-react'
import {
  getDocuments, recordDocumentView, recordDocumentDownload,
  DOCUMENT_CATEGORIES, DOCUMENT_LEVELS,
  type DocumentItem,
} from '@/src/services/documentService'
import { BASE_URL } from '@/src/utils/constants'

/* ─── Document Row — style giống ExamCard ─────────────────────────── */
function DocumentRow({ doc }: { doc: DocumentItem }) {
  const categoryLabel = doc.category ? DOCUMENT_CATEGORIES[doc.category] ?? doc.category : null
  const levelLabel = doc.level ? DOCUMENT_LEVELS[doc.level] ?? doc.level : null
  const fileExt = doc.fileUrl?.split('.').pop()?.toUpperCase() ?? 'FILE'

  const downloadUrl = doc.fileUrl?.startsWith('http')
    ? doc.fileUrl
    : `${BASE_URL}${doc.fileUrl}`

  return (
    <article className="group flex items-start gap-4 py-4 border-b border-[var(--border-color)] last:border-b-0 transition-colors">
      {/* Thumbnail */}
      <div className="shrink-0 w-[80px] h-[113px] border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-[6px] overflow-hidden flex items-center justify-center group-hover:border-[var(--border-color-hover)] group-hover:shadow-[var(--shadow-sm)] transition-all">
        {doc.thumbnailUrl ? (
          <img
            src={doc.thumbnailUrl.startsWith('http') ? doc.thumbnailUrl : `${BASE_URL}${doc.thumbnailUrl}`}
            alt={doc.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[var(--text-tertiary)]">
            <FileText size={24} className="opacity-40" />
            <span className="text-[10px] font-mono font-bold opacity-50">{fileExt}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          {categoryLabel && (
            <span className="inline-flex items-center rounded-[4px] bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 text-[11px] font-[600] text-blue-600 dark:text-blue-400">
              {categoryLabel}
            </span>
          )}
          {levelLabel && (
            <span className="inline-flex items-center rounded-[4px] bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 text-[11px] font-[500] text-purple-700 dark:text-purple-400">
              {levelLabel}
            </span>
          )}
          {doc.isFeatured && (
            <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 text-[11px] font-[600] text-amber-700 dark:text-amber-400">
              <Star size={9} fill="currentColor" /> Nổi bật
            </span>
          )}
        </div>

        <h3 className="text-[14px] font-[600] text-[var(--text-primary)] leading-[1.4] line-clamp-2 mb-1">
          {doc.title}
        </h3>

        {doc.author && (
          <p className="text-[12px] text-[var(--text-secondary)] mb-1.5 truncate">
            ✍️ {doc.author}
          </p>
        )}

        <div className="flex items-center gap-3 text-[12px] text-[var(--text-tertiary)] mb-3">
          <span className="flex items-center gap-1"><Eye size={11} />{doc.viewCount.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Download size={11} />{doc.downloadCount.toLocaleString()}</span>
          {doc.fileSize && (
            <span>{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            download
            onClick={() => recordDocumentDownload(doc.id)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[var(--color-primary)] text-white text-[12px] font-[600] hover:opacity-90 transition-opacity"
          >
            <Download size={12} /> Tải về
          </a>
          {doc.sourceUrl && (
            <a
              href={doc.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => recordDocumentView(doc.id)}
              className="inline-flex items-center gap-1 h-8 px-3 rounded-[6px] border border-[var(--border-color)] text-[12px] font-[500] text-[var(--text-secondary)] hover:border-[var(--border-color-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ExternalLink size={12} /> Nguồn
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

/* ─── Skeleton ──────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[var(--border-color)]">
      <div className="skeleton shrink-0 w-[80px] h-[113px] rounded-[6px]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-4 w-1/4 rounded-[4px]" />
        <div className="skeleton h-4 w-full rounded-[4px]" />
        <div className="skeleton h-4 w-3/4 rounded-[4px]" />
        <div className="skeleton h-3 w-1/3 rounded-[4px]" />
      </div>
    </div>
  )
}

/* ─── Main Component ────────────────────────────────────────────────── */
export function DocumentLibraryClient() {
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['documents', category, level, q, page],
    queryFn: () => getDocuments({ category: category || undefined, level: level || undefined, q: q || undefined, page, limit: 15 }),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 15))
  const hasFilters = Boolean(category || level || q)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setQ(searchInput.trim())
    setPage(0)
  }

  const resetFilters = () => {
    setCategory(''); setLevel(''); setQ(''); setSearchInput(''); setPage(0)
  }

  return (
    <div className="py-6">
      {/* Compact filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm tài liệu, tác giả..."
              className="w-full h-9 pl-8 pr-3 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-primary)] text-[13px] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <button type="submit" className="h-9 px-3 rounded-[6px] bg-[var(--color-primary)] text-white text-[13px] font-[600] hover:opacity-90 transition-opacity">
            Tìm
          </button>
        </form>

        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(0) }}
          className="h-9 px-2.5 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-primary)] text-[13px] text-[var(--text-primary)] focus:outline-none cursor-pointer"
        >
          <option value="">Môn: Tất cả</option>
          {Object.entries(DOCUMENT_CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={level}
          onChange={e => { setLevel(e.target.value); setPage(0) }}
          className="h-9 px-2.5 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-primary)] text-[13px] text-[var(--text-primary)] focus:outline-none cursor-pointer"
        >
          <option value="">Cấp: Tất cả</option>
          {Object.entries(DOCUMENT_LEVELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {hasFilters && (
          <button onClick={resetFilters} className="h-9 px-2.5 flex items-center gap-1 rounded-[6px] border border-[var(--border-color)] text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color-hover)] transition-colors">
            <X size={12} /> Xóa
          </button>
        )}
      </div>

      {/* Result count */}
      {!isLoading && (
        <p className="text-[13px] text-[var(--text-secondary)] mb-3">
          Tìm thấy <strong className="text-[var(--text-primary)]">{data?.total ?? 0}</strong> tài liệu
        </p>
      )}

      {/* List */}
      <div>
        {isLoading ? (
          Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">📂</span>
            <p className="text-[15px] font-[600] text-[var(--text-primary)]">Chưa có tài liệu nào</p>
            <p className="text-[13px] text-[var(--text-secondary)]">Thử tìm kiếm với từ khóa khác</p>
          </div>
        ) : (
          data.data.map(doc => <DocumentRow key={doc.id} doc={doc} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-6">
          <button
            disabled={page === 0}
            onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="h-9 px-3 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[13px] disabled:opacity-40 hover:border-[var(--border-color-hover)] transition-colors"
          >
            ← Trước
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`h-9 min-w-9 px-2 rounded-[6px] text-[13px] font-[600] transition-colors ${
                page === i
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--border-color-hover)]'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="h-9 px-3 rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[13px] disabled:opacity-40 hover:border-[var(--border-color-hover)] transition-colors"
          >
            Sau →
          </button>
        </div>
      )}

      {/* SEO Content Section */}
      <section className="mt-12 pt-8 border-t border-[var(--border-color)]">
        <div className="prose prose-sm sm:prose-base max-w-none text-[var(--text-secondary)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Kho Tài Liệu Học Tập & Luyện Thi Miễn Phí Tại VNDocs</h2>
          <p className="mb-4 leading-relaxed">
            Chào mừng bạn đến với kho <strong>Tài Liệu Tổng Hợp Miễn Phí</strong> của VNDocs. Tại đây, chúng tôi tuyển chọn và chia sẻ những nguồn tài liệu học tập, sách tham khảo, đề cương ôn tập chất lượng cao từ các thầy cô giáo và trung tâm uy tín trên toàn quốc. Mục tiêu của chúng tôi là mang cơ hội tiếp cận tri thức bình đẳng đến với mọi học sinh, sinh viên hoàn toàn miễn phí.
          </p>
          
          <h3 className="text-lg font-bold text-[var(--text-primary)] mt-6 mb-3">Tài Liệu Đa Dạng Các Cấp Học & Môn Học</h3>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li><strong>Luyện Thi IELTS & TOEIC:</strong> Cung cấp ebook, tài liệu hướng dẫn giải đề, tài liệu tăng band điểm các kỹ năng Reading, Listening, Speaking và Writing từ các chuyên gia.</li>
            <li><strong>Tuyển sinh vào lớp 10 & THPT Quốc Gia:</strong> Kho tàng đề thi thử, tài liệu tóm tắt kiến thức trọng tâm các môn Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa đáp ứng sát nhất với định dạng đề thi của Bộ Giáo dục.</li>
            <li><strong>Đại học & Chuyên ngành:</strong> Các tài liệu nghiên cứu, giáo trình đại cương hỗ trợ sinh viên trong quá trình học tập tại giảng đường đại học.</li>
          </ul>

          <h3 className="text-lg font-bold text-[var(--text-primary)] mt-6 mb-3">Tải Xuống Nhanh Chóng & Trải Nghiệm Mượt Mà</h3>
          <p className="leading-relaxed">
            Thư viện tài liệu được thiết kế tối ưu, cho phép bạn dễ dàng tìm kiếm theo môn học, cấp độ với tốc độ tức thì. Bạn có thể <strong>tải về trực tiếp</strong> hoặc xem tài liệu gốc nhanh chóng mà không gặp phải quảng cáo phiền toái. Kết hợp với kho <em>Đề thi trắc nghiệm trực tuyến</em> và <em>Phòng Luyện Viết</em>, VNDocs là nền tảng toàn diện đồng hành cùng hành trình tự học của bạn.
          </p>
        </div>
      </section>
    </div>
  )
}
