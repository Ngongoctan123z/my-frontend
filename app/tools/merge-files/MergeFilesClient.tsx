'use client'

import { useState, useRef } from 'react'
import { mergePDFs } from '../../../src/lib/pdfTools'
import { UploadCloud, Trash2, Download, Loader2, Settings2, Plus, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

type FileFormat = 'pdf'

export default function MergeFilesClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

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
        setError(isEn ? 'Some files are not PDF. They were automatically removed.' : 'Một số file không phải là PDF. Đã tự động loại bỏ.')
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
      if (multiFiles.length < 2) throw new Error(isEn ? "At least 2 files are required to merge" : "Cần ít nhất 2 file để gộp")
      const newPdfBlob = await mergePDFs(multiFiles)
      
      const url = URL.createObjectURL(newPdfBlob)
      setResultUrl(url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || (isEn ? 'An error occurred while processing files.' : 'Có lỗi xảy ra khi xử lý file.'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExecuteOtherFormats = async () => {
    setIsProcessing(true)
    setError('')
    setResultUrl(null)
    try {
      if (multiFiles.length < 2) throw new Error(isEn ? "At least 2 files are required to merge" : "Cần ít nhất 2 file để gộp")
      
      const formData = new FormData()
      formData.append('format', format)
      multiFiles.forEach(file => {
        formData.append('files', file)
      })

      // Sử dụng Proxy nội bộ của Next.js để vượt qua lỗi Mixed Content và DNS
      const apiUrl = '/api/aws-merge'
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || (isEn ? 'Error from AWS server when merging files. Please check the server.' : 'Lỗi từ máy chủ AWS khi gộp file. Vui lòng kiểm tra lại server.'))
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } catch (err: any) {
      console.error(err)
      setError(err.message || (isEn ? 'Error connecting to AWS server. Please ensure the Backend is running.' : 'Có lỗi kết nối đến máy chủ AWS. Vui lòng đảm bảo Backend đang chạy.'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExecute = () => {
    if (format === 'pdf') handleExecutePDF()
    else handleExecuteOtherFormats()
  }

  const getFormatLabel = () => '.PDF'

  return (
    <div className="py-12 max-w-5xl mx-auto space-y-8 px-4">




      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">{isEn ? 'List of files to merge' : 'Danh sách file cần gộp'}</h3>
            <button 
              onClick={() => multiFileInputRef.current?.click()}
              className="flex items-center gap-2 text-primary font-medium hover:underline"
            >
              <Plus className="w-4 h-4" /> {isEn ? 'Add file' : 'Thêm file'}
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
              <p className="text-ink-muted">{isEn ? `No files yet. Click to upload multiple ${getFormatLabel()} files.` : `Chưa có file nào. Click để tải lên nhiều file ${getFormatLabel()}.`}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {multiFiles.map((f, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-page border border-line rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 text-primary rounded text-xs font-bold w-8 text-center">{index + 1}</div>
                    <p className="font-medium truncate max-w-[100px] xs:max-w-[150px] sm:max-w-xs">{f.name}</p>
                    <span className="text-[10px] sm:text-xs text-ink-muted whitespace-nowrap">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
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
              <h3 className="text-2xl font-bold text-emerald-800">{isEn ? 'Processing successful!' : 'Xử lý thành công!'}</h3>
              <p className="text-emerald-600 mt-2">{isEn ? `Successfully merged ${multiFiles.length} files into a single document.` : `Đã gộp thành công ${multiFiles.length} file tài liệu lại thành 1 bản duy nhất.`}</p>
            </div>
            <a 
              href={resultUrl} 
              download={`VNDocs-Merged.${format}`}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-emerald-700 transition-all hover:scale-105 shadow-lg"
            >
              <Download className="w-5 h-5" /> {isEn ? 'Download Merged file now' : 'Tải xuống file Gộp ngay'}
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
              {isEn ? `Proceed to Merge ${multiFiles.length} ${getFormatLabel()} files` : `Tiến hành Gộp ${multiFiles.length} file ${getFormatLabel()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
