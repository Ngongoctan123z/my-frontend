'use client'

import { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { extractPDFPages } from '../../../src/lib/pdfTools'
import { UploadCloud, CheckCircle2, Download, Trash2, FileText, Loader2 } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Cấu hình worker cho react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function SplitMergeClient() {
  const [file, setFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setSelectedPages(new Set())
      setError('')
    } else {
      setError('Vui lòng chọn một file PDF hợp lệ.')
    }
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    // Mặc định chọn tất cả
    const allPages = new Set(Array.from({ length: numPages }, (_, i) => i))
    setSelectedPages(allPages)
  }

  const togglePageSelection = (pageIndex: number) => {
    const newSelection = new Set(selectedPages)
    if (newSelection.has(pageIndex)) {
      newSelection.delete(pageIndex)
    } else {
      newSelection.add(pageIndex)
    }
    setSelectedPages(newSelection)
  }

  const handleSplit = async () => {
    if (!file || selectedPages.size === 0) return
    
    setIsProcessing(true)
    setError('')
    try {
      const pageIndices = Array.from(selectedPages).sort((a, b) => a - b)
      const newPdfBlob = await extractPDFPages(file, pageIndices)
      
      // Tạo link download
      const url = URL.createObjectURL(newPdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `VNDocs-Split-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError('Có lỗi xảy ra khi xử lý PDF. Vui lòng thử lại.')
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setFile(null)
    setNumPages(0)
    setSelectedPages(new Set())
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Cắt và Trích Xuất Trang PDF</h1>
        <p className="text-ink-muted">
          Chọn file PDF của bạn, sau đó nhấp vào các trang bạn muốn giữ lại và tải xuống file mới. Hoạt động 100% trên trình duyệt, bảo mật tuyệt đối!
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {!file ? (
        <div 
          className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-12 text-center cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <UploadCloud className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Tải file PDF lên đây</h3>
          <p className="text-ink-muted">Click để chọn file hoặc kéo thả file vào đây (Tối đa 50MB)</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between bg-surface p-4 rounded-xl border border-line shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                <p className="text-sm text-ink-muted">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {numPages} trang
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button 
                onClick={reset}
                className="px-4 py-2 flex items-center gap-2 text-ink-muted hover:bg-surface-hover rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" /> Hủy bỏ
              </button>
              <button 
                onClick={handleSplit}
                disabled={isProcessing || selectedPages.size === 0}
                className="px-6 py-2 flex items-center gap-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition shadow-sm"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                Tách {selectedPages.size} trang
              </button>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">Chọn trang cần giữ lại</h3>
              <div className="space-x-3 text-sm">
                <button 
                  onClick={() => setSelectedPages(new Set(Array.from({ length: numPages }, (_, i) => i)))}
                  className="text-primary hover:underline font-medium"
                >
                  Chọn tất cả
                </button>
                <button 
                  onClick={() => setSelectedPages(new Set())}
                  className="text-ink-muted hover:underline"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>
            
            <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center py-20 text-ink-muted gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" /> Đang tải trang PDF...
                  </div>
                }
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {Array.from({ length: numPages }, (_, index) => (
                  <div 
                    key={`page_${index + 1}`} 
                    className={`relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPages.has(index) 
                        ? 'border-primary shadow-md ring-4 ring-primary/20' 
                        : 'border-transparent hover:border-line'
                    }`}
                    onClick={() => togglePageSelection(index)}
                  >
                    <Page 
                      pageNumber={index + 1} 
                      width={200}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="w-full flex justify-center bg-white"
                    />
                    
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedPages.has(index)
                        ? 'bg-primary border-primary text-white'
                        : 'border-white bg-black/20 text-transparent group-hover:border-primary/50'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs font-medium py-1.5 text-center">
                      Trang {index + 1}
                    </div>
                  </div>
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
