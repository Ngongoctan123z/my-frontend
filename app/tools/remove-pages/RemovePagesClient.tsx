'use client'

import { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { removePDFPages } from '../../../src/lib/pdfTools'
import { UploadCloud, Trash2, Download, FileText, Loader2, Settings2, AlertCircle } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type FileFormat = 'pdf' | 'docx' | 'pptx'

export default function RemovePagesClient() {
  const [format, setFormat] = useState<FileFormat>('pdf')
  
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set())
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (format === 'pdf' && file.type !== 'application/pdf') {
      setError('Vui lòng chọn file PDF.')
      return
    }
    setSingleFile(file)
    setPagesToDelete(new Set())
    setResultUrl(null)
    setError('')
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleExecutePDF = async () => {
    setIsProcessing(true)
    setError('')
    setResultUrl(null)
    try {
      if (!singleFile) throw new Error("Chưa chọn file")
      const indices = Array.from(pagesToDelete)
      const newPdfBlob = await removePDFPages(singleFile, indices)
      
      const url = URL.createObjectURL(newPdfBlob)
      setResultUrl(url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra khi xử lý PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExecuteOtherFormats = () => {
    setError(`Định dạng ${format.toUpperCase()} hiện đang được nâng cấp để xử lý trên máy chủ. Tạm thời tính năng này chỉ khả dụng cho PDF.`)
  }

  const handleExecute = () => {
    if (format === 'pdf') handleExecutePDF()
    else handleExecuteOtherFormats()
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPagesToDelete(new Set())
  }

  const toggleDeletePage = (index: number) => {
    const newSet = new Set(pagesToDelete)
    if (newSet.has(index)) newSet.delete(index)
    else newSet.add(index)
    setPagesToDelete(newSet)
    setResultUrl(null) // Cần xử lý lại nếu đổi trang
  }

  const getFormatLabel = () => {
    if (format === 'pdf') return '.PDF'
    if (format === 'docx') return '.DOCX'
    if (format === 'pptx') return '.PPTX'
    return ''
  }

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4">


      <div className="flex items-center justify-center gap-4 bg-surface p-4 rounded-xl border border-line w-max mx-auto">
        <Settings2 className="w-5 h-5 text-ink-muted" />
        <span className="text-sm font-medium">Định dạng file:</span>
        <select 
          value={format} 
          onChange={(e) => { setFormat(e.target.value as FileFormat); setError(''); }}
          className="bg-page border border-line rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
        >
          <option value="pdf">Tài liệu PDF (.pdf)</option>
          <option value="docx">Word (.docx)</option>
          <option value="pptx">PowerPoint (.pptx)</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="space-y-6">
        {!singleFile ? (
          <div 
            className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-16 text-center cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept={format === 'pdf' ? '.pdf' : format === 'docx' ? '.docx' : '.pptx'}
              className="hidden" 
              ref={fileInputRef}
              onChange={handleSingleFileChange}
            />
            <UploadCloud className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Tải file {getFormatLabel()} lên đây</h3>
            <p className="text-ink-muted">Hỗ trợ xóa các trang không cần thiết</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-surface p-4 rounded-xl border border-line shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold truncate max-w-[200px] sm:max-w-md">{singleFile.name}</p>
                  <p className="text-sm text-ink-muted">
                    {(singleFile.size / 1024 / 1024).toFixed(2)} MB {format === 'pdf' && `• ${numPages} trang`}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4 sm:mt-0">
                <button onClick={() => { setSingleFile(null); setResultUrl(null); }} className="px-4 py-2 flex items-center gap-2 text-ink-muted hover:bg-surface-hover rounded-lg transition">
                  <Trash2 className="w-4 h-4" /> Đổi file khác
                </button>
              </div>
            </div>

            {/* QUẢNG CÁO CÓ THỂ ĐẶT Ở ĐÂY SAU NÀY */}
            
            {resultUrl ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Download className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-emerald-800">Xử lý thành công!</h3>
                  <p className="text-emerald-600 mt-2">File của bạn đã sẵn sàng để tải xuống. (Đã xóa {pagesToDelete.size} trang)</p>
                </div>
                <a 
                  href={resultUrl} 
                  download={`VNDocs-Cleaned-${singleFile.name}`}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all hover:scale-105 shadow-lg"
                >
                  <Download className="w-5 h-5" /> Tải xuống file ngay
                </a>
              </div>
            ) : format === 'pdf' && (
              <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">Click vào các trang bạn muốn XÓA</h3>
                    <p className="text-sm text-ink-muted">Trang bị chọn (Màu đỏ) sẽ bị loại bỏ khỏi file.</p>
                  </div>
                  <button 
                    onClick={handleExecute}
                    disabled={isProcessing || pagesToDelete.size === 0}
                    className="px-6 py-2.5 flex items-center gap-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition w-full md:w-auto justify-center"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings2 className="w-5 h-5" />}
                    Tiến hành Xóa {pagesToDelete.size} trang
                  </button>
                </div>
                
                <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar border border-line/50 rounded-xl p-4 bg-page">
                  <Document
                    file={singleFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="flex justify-center py-20 text-ink-muted"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang đọc file PDF...</div>}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                  >
                    {Array.from({ length: numPages }, (_, index) => {
                      const isDeleted = pagesToDelete.has(index)
                      return (
                        <div 
                          key={`page_${index}`} 
                          className={`relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all shadow-sm ${
                            isDeleted ? 'border-red-500 shadow-md ring-4 ring-red-500/20 opacity-80' : 'border-line hover:border-primary'
                          }`}
                          onClick={() => toggleDeletePage(index)}
                        >
                          <Page pageNumber={index + 1} width={200} renderTextLayer={false} renderAnnotationLayer={false} className="w-full flex justify-center bg-white" />
                          {isDeleted && (
                            <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                              <Trash2 className="w-10 h-10 text-red-500 drop-shadow-md" />
                            </div>
                          )}
                          <div className={`absolute bottom-0 inset-x-0 text-white text-xs font-medium py-1.5 text-center ${isDeleted ? 'bg-red-600' : 'bg-black/60'}`}>
                            Trang {index + 1}
                          </div>
                        </div>
                      )
                    })}
                  </Document>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
