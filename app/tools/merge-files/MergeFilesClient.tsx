'use client'

import { useState, useRef } from 'react'
import { mergePDFs } from '../../../src/lib/pdfTools'
import { UploadCloud, Trash2, Download, Loader2, Settings2, Plus, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'

type FileFormat = 'pdf' | 'docx' | 'pptx'

export default function MergeFilesClient() {
  const [format, setFormat] = useState<FileFormat>('pdf')
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  
  const multiFileInputRef = useRef<HTMLInputElement>(null)

  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    if (format === 'pdf') {
      const validFiles = files.filter(f => f.type === 'application/pdf')
      if (validFiles.length !== files.length) {
        setError('Một số file không phải là PDF. Đã tự động loại bỏ.')
      }
      setMultiFiles(prev => [...prev, ...validFiles])
    } else {
      setMultiFiles(prev => [...prev, ...files])
    }
    setResultUrl(null)
    // Reset input value
    e.target.value = ''
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
    setResultUrl(null)
  }

  const removeFileFromList = (index: number) => {
    setMultiFiles(prev => prev.filter((_, i) => i !== index))
    setResultUrl(null)
  }

  const handleExecutePDF = async () => {
    setIsProcessing(true)
    setError('')
    setResultUrl(null)
    try {
      if (multiFiles.length < 2) throw new Error("Cần ít nhất 2 file để gộp")
      const newPdfBlob = await mergePDFs(multiFiles)
      
      const url = URL.createObjectURL(newPdfBlob)
      setResultUrl(url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra khi xử lý file.')
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

  const getFormatLabel = () => {
    if (format === 'pdf') return '.PDF'
    if (format === 'docx') return '.DOCX'
    if (format === 'pptx') return '.PPTX'
    return ''
  }

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Công cụ Gộp File</h1>
        <p className="text-ink-muted max-w-2xl mx-auto">
          Ghép nhiều tài liệu thành một file duy nhất. Kéo thả để sắp xếp thứ tự dễ dàng.
        </p>
      </div>

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
              className="border-2 border-dashed border-line rounded-xl p-12 text-center cursor-pointer hover:bg-surface-hover transition-colors"
              onClick={() => multiFileInputRef.current?.click()}
            >
              <UploadCloud className="w-12 h-12 text-ink-muted mx-auto mb-3" />
              <p className="text-ink-muted">Chưa có file nào. Click để tải lên nhiều file {getFormatLabel()}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {multiFiles.map((f, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-page border border-line rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 text-primary rounded text-xs font-bold w-8 text-center">{index + 1}</div>
                    <p className="font-medium truncate max-w-[150px] sm:max-w-xs">{f.name}</p>
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
        
        {/* QUẢNG CÁO CÓ THỂ ĐẶT Ở ĐÂY SAU NÀY */}
        
        {resultUrl ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Download className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-emerald-800">Xử lý thành công!</h3>
              <p className="text-emerald-600 mt-2">Đã gộp thành công {multiFiles.length} file tài liệu lại thành 1 bản duy nhất.</p>
            </div>
            <a 
              href={resultUrl} 
              download={`VNDocs-Merged.pdf`}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all hover:scale-105 shadow-lg"
            >
              <Download className="w-5 h-5" /> Tải xuống file Gộp ngay
            </a>
          </div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={handleExecute}
              disabled={isProcessing || multiFiles.length < 2}
              className="px-8 py-3 flex items-center gap-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition shadow-lg"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Settings2 className="w-5 h-5" />}
              Tiến hành Gộp {multiFiles.length} file
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
