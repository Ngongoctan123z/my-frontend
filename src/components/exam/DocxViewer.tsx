import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { Download, Maximize2, Minus, Plus, Printer } from 'lucide-react'
import { Button } from '../ui/Button'

type Props = {
  src: string
  title: string
}

export function DocxViewer({ src, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    async function loadDocx() {
      try {
        const response = await fetch(src)
        if (!response.ok) {
          throw new Error(`Không thể tải tài liệu (HTTP ${response.status})`)
        }
        const buffer = await response.arrayBuffer()
        if (!active) return

        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          await renderAsync(buffer, containerRef.current, undefined, {
            className: 'docx-preview-rendered',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            experimental: true
          })
        }
        if (active) setLoading(false)
      } catch (err: any) {
        if (!active) return
        console.error('Docx render error:', err)
        setError(err.message || 'Lỗi hiển thị tài liệu Word')
        setLoading(false)
      }
    }

    loadDocx()
    return () => {
      active = false
    }
  }, [src])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div id="docx-preview" className="bg-surface border-line overflow-hidden rounded-2xl border">
      <div className="border-line flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <p className="text-sm font-medium">Nội dung tài liệu (Word) - {title}</p>
          <p className="text-ink-muted text-xs">Đang hiển thị trực tiếp · Bạn có thể In hoặc Xuất sang PDF</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => setZoom((v) => Math.max(60, v - 10))}>
            <Minus size={16} />
          </Button>
          <span className="text-ink-muted w-12 text-center text-sm">{zoom}%</span>
          <Button variant="ghost" onClick={() => setZoom((v) => Math.min(150, v + 10))}>
            <Plus size={16} />
          </Button>
          <Button variant="ghost" onClick={handlePrint} title="In hoặc Lưu thành file PDF">
            <Printer size={16} className="mr-1" /> Xuất / In PDF
          </Button>
          <a href={src} download>
            <Button variant="ghost">
              <Download size={16} className="mr-1" /> Tải về
            </Button>
          </a>
        </div>
      </div>

      <div className="bg-page relative flex min-h-[60vh] max-h-[75vh] flex-col items-center overflow-auto p-4 md:p-6">
        {loading && (
          <div className="my-auto flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-ink-muted">Đang chuyển đổi và kết xuất văn bản...</p>
          </div>
        )}

        {error && (
          <div className="my-auto flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-sm text-color-danger font-medium">{error}</p>
            <a href={src} download>
              <Button>
                <Download size={16} className="mr-1" /> Tải file Word về máy để xem
              </Button>
            </a>
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className={`w-full max-w-4xl transition-opacity duration-200 ${loading || error ? 'hidden' : 'block'}`}
        />
      </div>
    </div>
  )
}
