'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Download, Eye, Search, Star, Filter, X, ExternalLink, FileText } from 'lucide-react'
import {
  getDocuments, recordDocumentView, recordDocumentDownload,
  DOCUMENT_CATEGORIES, DOCUMENT_LEVELS,
  type DocumentItem,
} from '@/src/services/documentService'
import { BASE_URL } from '@/src/utils/constants'

function DocumentCard({ doc }: { doc: DocumentItem }) {
  const categoryLabel = doc.category ? DOCUMENT_CATEGORIES[doc.category] ?? doc.category : null
  const levelLabel = doc.level ? DOCUMENT_LEVELS[doc.level] ?? doc.level : null
  const fileExt = doc.fileUrl?.split('.').pop()?.toUpperCase() ?? 'FILE'

  const downloadUrl = doc.fileUrl?.startsWith('http')
    ? doc.fileUrl
    : `${BASE_URL}${doc.fileUrl}`

  const handleDownload = () => {
    recordDocumentDownload(doc.id)
  }
  const handleView = () => {
    recordDocumentView(doc.id)
  }

  return (
    <article className="group relative flex flex-col bg-surface border border-line rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200">
      {/* Thumbnail */}
      <div className="relative w-full aspect-[4/3] bg-page flex items-center justify-center overflow-hidden">
        {doc.thumbnailUrl ? (
          <img
            src={doc.thumbnailUrl.startsWith('http') ? doc.thumbnailUrl : `${BASE_URL}${doc.thumbnailUrl}`}
            alt={doc.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-muted">
            <FileText size={40} className="opacity-30" />
            <span className="text-xs font-mono font-bold opacity-50">{fileExt}</span>
          </div>
        )}
        {doc.isFeatured && (
          <span className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Star size={10} fill="currentColor" /> Nổi bật
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {categoryLabel && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {categoryLabel}
            </span>
          )}
          {levelLabel && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              {levelLabel}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 flex-1">
          {doc.title}
        </h3>

        {doc.author && (
          <p className="text-xs text-ink-muted font-medium truncate">
            ✍️ {doc.author}
          </p>
        )}

        {doc.description && (
          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
            {doc.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[11px] text-ink-muted pt-1 border-t border-line mt-auto">
          <span className="flex items-center gap-1"><Eye size={11} />{doc.viewCount.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Download size={11} />{doc.downloadCount.toLocaleString()}</span>
          {doc.fileSize && (
            <span className="ml-auto">{(doc.fileSize / 1024 / 1024).toFixed(1)} MB</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            download
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Download size={13} /> Tải về
          </a>
          {doc.sourceUrl && (
            <a
              href={doc.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleView}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-line text-xs font-medium text-ink hover:bg-page transition-colors"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden">
      <div className="skeleton w-full aspect-[4/3]" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  )
}

export function DocumentLibraryClient() {
  const [category, setCategory] = useState('')
  const [level, setLevel] = useState('')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['documents', category, level, q, page],
    queryFn: () => getDocuments({ category: category || undefined, level: level || undefined, q: q || undefined, page, limit: 12 }),
  })

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 12))
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
    <div className="space-y-6 py-8 md:py-10">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-2">
          <BookOpen size={13} /> Tài Liệu Tổng Hợp Miễn Phí
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-ink tracking-tight">
          Tài liệu từ thầy cô &amp; trung tâm nổi tiếng
        </h1>
        <p className="text-ink-muted text-sm">
          Tổng hợp tài liệu học tập chất lượng cao — hoàn toàn miễn phí cho tất cả mọi người
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="sticky top-[76px] z-30 -mx-6 bg-surface/95 px-6 pb-3 pt-3 backdrop-blur-md border-b border-line shadow-sm md:-mx-10 md:px-10">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Tìm tài liệu, tác giả..."
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-line bg-page text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <button type="submit" className="px-4 h-10 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
              Tìm
            </button>
          </form>

          {/* Category filter */}
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(0) }}
            className="h-10 px-3 rounded-xl border border-line bg-page text-sm font-medium text-ink focus:outline-none cursor-pointer"
          >
            <option value="">Môn: Tất cả</option>
            {Object.entries(DOCUMENT_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Level filter */}
          <select
            value={level}
            onChange={e => { setLevel(e.target.value); setPage(0) }}
            className="h-10 px-3 rounded-xl border border-line bg-page text-sm font-medium text-ink focus:outline-none cursor-pointer"
          >
            <option value="">Cấp: Tất cả</option>
            {Object.entries(DOCUMENT_LEVELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {hasFilters && (
            <button onClick={resetFilters} className="h-10 px-3 flex items-center gap-1 rounded-xl border border-line text-xs font-medium text-ink-muted hover:text-ink transition-colors">
              <X size={13} /> Xóa
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-ink-muted">
          Tìm thấy <strong className="text-ink">{data?.total ?? 0}</strong> tài liệu
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">📂</span>
          <p className="text-lg font-semibold text-ink">Chưa có tài liệu nào</p>
          <p className="text-ink-muted text-sm">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.data.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            disabled={page === 0}
            onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="min-h-10 rounded-xl px-4 border border-line bg-surface text-xs font-medium disabled:opacity-40"
          >
            Trước
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
            <button
              key={i}
              onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`min-h-10 min-w-10 rounded-xl px-3 text-xs font-semibold transition-colors ${
                page === i ? 'bg-[var(--color-primary)] text-white' : 'border border-line bg-surface text-ink hover:bg-page'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= totalPages - 1}
            onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="min-h-10 rounded-xl px-4 border border-line bg-surface text-xs font-medium disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
