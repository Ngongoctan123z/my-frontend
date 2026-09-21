import { Maximize2, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from '../ui/Button'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type Props = {
  src: string
  title: string
}

export function PDFViewer({ src, title }: Props) {
  const [zoom, setZoom] = useState(100)
  const [numPages, setNumPages] = useState<number>()

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  // Show all pages
  const pagesToShow = numPages || 0

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
      <div className="bg-page flex h-[70vh] flex-col items-center gap-4 overflow-auto py-4">
        <Document
          file={src}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-ink-muted">Đang tải PDF...</div>}
          error={<div className="text-color-danger">Lỗi khi tải PDF</div>}
        >
          {Array.from(new Array(pagesToShow), (_el, index) => (
            <div key={`page_${index + 1}`} className="mb-4 shadow-md">
              <Page
                pageNumber={index + 1}
                scale={zoom / 100}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )
}
