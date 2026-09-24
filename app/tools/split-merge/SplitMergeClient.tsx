'use client'

import { useState, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { removePDFPages, mergePDFs } from '../../../src/lib/pdfTools'
import { UploadCloud, Trash2, Download, FileText, Loader2, ArrowUp, ArrowDown, Settings2, Plus, AlertCircle } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type ToolMode = 'remove' | 'merge'
type FileFormat = 'pdf' | 'docx' | 'pptx'

export default function SplitMergeClient() {
  const [mode, setMode] = useState<ToolMode>('remove')
  const [format, setFormat] = useState<FileFormat>('pdf')
  
  // State cho chế độ Xóa trang
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set())
  
  // State cho chế độ Gộp file
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  
  // Global State
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multiFileInputRef = useRef<HTMLInputElement>(null)

  // -- LOGIC CƠ BẢN --
  
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check format
    if (format === 'pdf' && file.type !== 'application/pdf') {
      setError('Vui lòng chọn file PDF.')
      return
    }
    
    setSingleFile(file)
    setPagesToDelete(new Set())
    setError('')
  }

  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Check format for PDF
    if (format === 'pdf') {
      const validFiles = files.filter(f => f.type === 'application/pdf')
      if (validFiles.length !== files.length) {
        setError('Một số file không phải là PDF. Đã tự động loại bỏ.')
      }
      setMultiFiles(prev => [...prev, ...validFiles])
    } else {
      setMultiFiles(prev => [...prev, ...files])
    }
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === multiFiles.length - 1) return
    
    const newFiles = [...multiFiles]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newFiles[index]
    newFiles[index] = newFiles[swapIndex]
    newFiles[swapIndex] = temp
    setMultiFiles(newFiles)
  }

  const removeFileFromList = (index: number) => {
    setMultiFiles(prev => prev.filter((_, i) => i !== index))
  }

  // -- LOGIC XỬ LÝ (PDF) --

  const handleExecutePDF = async () => {
    setIsProcessing(true)
    setError('')
    try {
      let newPdfBlob: Blob
      let downloadName = ''

      if (mode === 'remove') {
        if (!singleFile) throw new Error("Chưa chọn file")
        const indices = Array.from(pagesToDelete)
        newPdfBlob = await removePDFPages(singleFile, indices)
        downloadName = `VNDocs-Cleaned-${singleFile.name}`
      } else {
        if (multiFiles.length < 2) throw new Error("Cần ít nhất 2 file để gộp")
        newPdfBlob = await mergePDFs(multiFiles)
        downloadName = `VNDocs-Merged.pdf`
      }
      
      const url = URL.createObjectURL(newPdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
    if (format === 'pdf') {
      handleExecutePDF()
    } else {
      handleExecuteOtherFormats()
    }
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
  }

  const getFormatLabel = () => {
    if (format === 'pdf') return '.PDF'
    if (format === 'docx') return '.DOCX'
    if (format === 'pptx') return '.PPTX'
    return ''
  }

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Công cụ Xóa Trang & Gộp File</h1>
        <p className="text-ink-muted max-w-2xl mx-auto">
          Xử lý tài liệu nhanh chóng. Loại bỏ các trang không cần thiết hoặc gộp nhiều tài liệu thành một file hoàn chỉnh.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-surface border border-line p-1 rounded-xl inline-flex shadow-sm">
          <button
            onClick={() => { setMode('remove'); setError(''); }}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'remove' ? 'bg-primary text-white shadow-md' : 'text-ink-muted hover:text-ink'
            }`}
          >
            ✂️ Xóa trang
          </button>
          <button
            onClick={() => { setMode('merge'); setError(''); }}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'merge' ? 'bg-primary text-white shadow-md' : 'text-ink-muted hover:text-ink'
            }`}
          >
            🔗 Gộp file
          </button>
        </div>
      </div>

      {/* Cấu hình Định dạng */}
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

      {/* VIEW: XÓA TRANG */}
      {mode === 'remove' && (
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
              <p className="text-ink-muted">Hỗ trợ cắt và xóa các trang không cần thiết</p>
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
                  <button onClick={() => setSingleFile(null)} className="px-4 py-2 flex items-center gap-2 text-ink-muted hover:bg-surface-hover rounded-lg transition">
                    <Trash2 className="w-4 h-4" /> Hủy
                  </button>
                  <button 
                    onClick={handleExecute}
                    disabled={isProcessing || (format === 'pdf' && pagesToDelete.size === 0)}
                    className="px-6 py-2 flex items-center gap-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    {format === 'pdf' ? `Xóa ${pagesToDelete.size} trang & Tải xuống` : 'Xử lý file'}
                  </button>
                </div>
              </div>

              {format === 'pdf' && (
                <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-semibold text-lg">Click vào các trang bạn muốn XÓA</h3>
                      <p className="text-sm text-ink-muted">Trang bị chọn (Màu đỏ) sẽ bị loại bỏ khỏi file.</p>
                    </div>
                  </div>
                  
                  <div className="h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    <Document
                      file={singleFile}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={<div className="flex justify-center py-20 text-ink-muted"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải trang...</div>}
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    >
                      {Array.from({ length: numPages }, (_, index) => {
                        const isDeleted = pagesToDelete.has(index)
                        return (
                          <div 
                            key={`page_${index}`} 
                            className={`relative cursor-pointer group rounded-lg overflow-hidden border-2 transition-all ${
                              isDeleted ? 'border-red-500 shadow-md ring-4 ring-red-500/20 opacity-80' : 'border-transparent hover:border-line'
                            }`}
                            onClick={() => toggleDeletePage(index)}
                          >
                            <Page pageNumber={index + 1} width={200} renderTextLayer={false} renderAnnotationLayer={false} className="w-full flex justify-center bg-white" />
                            {isDeleted && (
                              <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                                <Trash2 className="w-10 h-10 text-red-500" />
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs font-medium py-1.5 text-center">
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
      )}

      {/* VIEW: GỘP FILE */}
      {mode === 'merge' && (
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Danh sách file cần gộp</h3>
              <button 
                onClick={() => multiFileInputRef.current?.click()}
                className="flex items-center gap-2 text-primary font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Thêm file
              </button>
              <input 
                type="file" multiple accept={format === 'pdf' ? '.pdf' : format === 'docx' ? '.docx' : '.pptx'}
                className="hidden" ref={multiFileInputRef} onChange={handleMultiFileChange}
              />
            </div>

            {multiFiles.length === 0 ? (
              <div 
                className="border-2 border-dashed border-line rounded-xl p-12 text-center cursor-pointer hover:bg-surface-hover"
                onClick={() => multiFileInputRef.current?.click()}
              >
                <UploadCloud className="w-12 h-12 text-ink-muted mx-auto mb-3" />
                <p className="text-ink-muted">Chưa có file nào. Click để tải lên nhiều file {getFormatLabel()}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {multiFiles.map((f, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-page border border-line rounded-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-primary/10 text-primary rounded text-xs font-bold w-8 text-center">{index + 1}</div>
                      <p className="font-medium truncate">{f.name}</p>
                      <span className="text-xs text-ink-muted whitespace-nowrap">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveFile(index, 'up')} disabled={index === 0} className="p-1.5 text-ink-muted hover:bg-surface rounded disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                      <button onClick={() => moveFile(index, 'down')} disabled={index === multiFiles.length - 1} className="p-1.5 text-ink-muted hover:bg-surface rounded disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                      <div className="w-px h-4 bg-line mx-1"></div>
                      <button onClick={() => removeFileFromList(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <button 
              onClick={handleExecute}
              disabled={isProcessing || multiFiles.length < 2}
              className="px-8 py-3 flex items-center gap-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition shadow-lg"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Tiến hành Gộp {multiFiles.length} file
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
