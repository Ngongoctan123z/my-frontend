import { Maximize2, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from '../ui/Button'

// Use unpkg CDN which worked previously
pdfjs.GlobalWorkerOptions.workerSrc = '/exam-media/pdf.worker.min.mjs'


type Props = {
  src: string
  title: string
}

export function PDFViewer({ src, title }: Props) {
  const [zoom, setZoom] = useState(100)
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState(1)
  const [isInView, setIsInView] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>()

  useEffect(() => {
    let rafId: number
    const observer = new ResizeObserver((entries) => {
      // debounce bằng rAF: chỉ update 1 lần mỗi frame, tránh setState mỗi pixel khi resize
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (entries[0]) {
          setContainerWidth(entries[0].contentRect.width)
        }
      })
    })
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '500px' }
    )
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1));
  }

  return (
    <div id="pdf-preview" className="bg-surface border-line overflow-hidden rounded-2xl border">
      <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <p className="text-sm font-medium">Nội dung PDF - {title}</p>
          <p className="text-ink-muted text-xs">zoom và xem toàn màn hình</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setZoom((value) => Math.max(75, value - 10))}>
            <Minus size={16} />
          </Button>
          <span className="text-ink-muted w-12 text-center text-sm">{zoom}%</span>
          <Button variant="ghost" onClick={() => setZoom((value) => Math.min(160, value + 10))}>
            <Plus size={16} />
          </Button>
          <a href={src} target="_blank" rel="noreferrer">
            <Button variant="ghost">
              <Maximize2 size={16} /> Toàn màn hình
            </Button>
          </a>
        </div>
      </div>
      <div ref={containerRef} className="bg-page flex h-[70vh] flex-col items-center gap-4 overflow-auto py-4 px-2 md:px-4 min-h-[400px]">
        {isInView ? (
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div className="text-ink-muted">Đang tải PDF...</div>}
            error={<div className="text-color-danger">Lỗi khi tải PDF</div>}
          >
            <div className="mb-4 shadow-md bg-white max-w-full overflow-hidden">
              <Page
                pageNumber={pageNumber}
                scale={zoom / 100}
                width={containerWidth ? Math.min(containerWidth - 16, 900) : undefined}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
            {numPages && (
              <div className="flex items-center gap-4 mt-2 mb-8 bg-surface px-4 py-2 rounded-full border border-line shadow-sm">
                <Button variant="ghost" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
                  <ChevronLeft size={20} /> Trước
                </Button>
                <span className="text-sm font-medium">Trang {pageNumber} / {numPages}</span>
                <Button variant="ghost" onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
                  Sau <ChevronRight size={20} />
                </Button>
              </div>
            )}
          </Document>
        ) : (
          <div className="flex items-center justify-center h-full w-full text-ink-muted">Cuộn xuống để tải PDF...</div>
        )}
      </div>
    </div>
  )
}
