'use client'

import React, { useState, useRef } from 'react'
import { FileText, Image as ImageIcon, ArrowRight, Upload, Download, Loader2, AlertCircle, RefreshCw, File } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type Format = 'pdf' | 'jpg' | 'png' | 'docx' | 'pptx' | 'xlsx'

interface ConversionOption {
  from: Format
  to: Format
  label: string
  supported: boolean
  serverSide?: boolean
}

import { BASE_URL } from '../../utils/constants'

const BACKEND_URL = BASE_URL

const CONVERSION_OPTIONS: ConversionOption[] = [
  // Server-side (LibreOffice) — thiết thực nhất, đặt lên đầu
  { from: 'pdf', to: 'docx', label: 'PDF sang Word', supported: true, serverSide: true },
  { from: 'docx', to: 'pdf', label: 'Word sang PDF', supported: true, serverSide: true },
  { from: 'pdf', to: 'pptx', label: 'PDF sang PowerPoint', supported: true, serverSide: true },
  { from: 'pptx', to: 'pdf', label: 'PowerPoint sang PDF', supported: true, serverSide: true },
  // Client-side (pdf-lib / pdfjs) — xử lý trên trình duyệt
  { from: 'jpg', to: 'pdf', label: 'JPG sang PDF', supported: true },
  { from: 'png', to: 'pdf', label: 'PNG sang PDF', supported: true },
  { from: 'pdf', to: 'jpg', label: 'PDF sang JPG', supported: true },
  { from: 'pdf', to: 'png', label: 'PDF sang PNG', supported: true },
]

export function FileConverter() {
  const [selectedOption, setSelectedOption] = useState<ConversionOption>(CONVERSION_OPTIONS[0])
  const [file, setFile] = useState<File | null>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  
  // Trạng thái kết quả
  const [resultUrls, setResultUrls] = useState<{url: string, name: string}[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selectedOption.from === 'pdf' && selected.type !== 'application/pdf') {
        setError('Vui lòng chọn file PDF.')
        return
      }
      if ((selectedOption.from === 'jpg' || selectedOption.from === 'png') && !selected.type.startsWith('image/')) {
        setError('Vui lòng chọn file hình ảnh.')
        return
      }
      if (selectedOption.from === 'docx' && !selected.name.toLowerCase().endsWith('.docx')) {
        setError('Vui lòng chọn file Word (.docx).')
        return
      }
      if (selectedOption.from === 'pptx' && !selected.name.toLowerCase().endsWith('.pptx')) {
        setError('Vui lòng chọn file PowerPoint (.pptx).')
        return
      }
      setFile(selected)
      setError(null)
      setResultUrls([])
      e.target.value = ''
    }
  }

  const convertViaServer = async () => {
    if (!file) return
    setProgress('Đang tải file lên máy chủ...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('from', selectedOption.from)
    formData.append('to', selectedOption.to)

    const response = await fetch(`${BACKEND_URL}/api/v1/convert`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || `Lỗi máy chủ (${response.status})`)
    }

    setProgress('Đang xử lý chuyển đổi...')
    const blob = await response.blob()
    const ext = selectedOption.to
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const outputName = `VNDocs-${baseName}.${ext}`
    setResultUrls([{ url: URL.createObjectURL(blob), name: outputName }])
  }

  const convertImageToPdf = async () => {
    if (!file) return
    const pdfDoc = await PDFDocument.create()
    const imageBytes = await file.arrayBuffer()
    let image
    
    if (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      image = await pdfDoc.embedJpg(imageBytes)
    } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      image = await pdfDoc.embedPng(imageBytes)
    } else {
      throw new Error('Chỉ hỗ trợ ảnh JPG và PNG.')
    }
    
    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
    setResultUrls([{ url: URL.createObjectURL(blob), name: `VNDocs-Converted-${file.name.split('.')[0]}.pdf` }])
  }

  const convertPdfToImages = async () => {
    if (!file) return
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    
    const urls: {url: string, name: string}[] = []
    const mimeType = selectedOption.to === 'png' ? 'image/png' : 'image/jpeg'
    const ext = selectedOption.to === 'png' ? 'png' : 'jpg'
    
    for (let i = 1; i <= numPages; i++) {
      setProgress(`Đang xử lý trang ${i}/${numPages}...`)
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2.0 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) continue
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      await page.render({ canvasContext: context, viewport } as any).promise
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, 0.9))
      if (blob) {
        urls.push({
          url: URL.createObjectURL(blob),
          name: `VNDocs-${file.name.split('.')[0]}-Page-${i}.${ext}`
        })
      }
    }
    setResultUrls(urls)
  }

  const processFile = async () => {
    if (!file) return
    setIsProcessing(true)
    setError(null)
    setProgress('')
    setResultUrls([])
    
    try {
      if (selectedOption.serverSide) {
        await convertViaServer()
      } else if (selectedOption.from === 'jpg' || selectedOption.from === 'png') {
        await convertImageToPdf()
      } else if (selectedOption.from === 'pdf' && (selectedOption.to === 'jpg' || selectedOption.to === 'png')) {
        await convertPdfToImages()
      }
      
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra trong quá trình chuyển đổi.')
    } finally {
      setIsProcessing(false)
      setProgress('')
    }
  }

  const resetAll = () => {
    setFile(null)
    setResultUrls([])
    setError(null)
    setProgress('')
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Option Selector */}
      <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" /> Chọn loại chuyển đổi
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CONVERSION_OPTIONS.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedOption(opt); resetAll(); }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center gap-2 text-center h-24 ${
                selectedOption.label === opt.label
                  ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                  : 'border-line bg-page text-ink-muted hover:border-primary/40 hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {opt.from === 'pdf' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                <ArrowRight className="w-3 h-3 opacity-50" />
                {opt.to === 'pdf' ? <FileText className="w-4 h-4" /> : <File className="w-4 h-4" />}
              </div>
              <span>{opt.label}</span>
              {!opt.supported && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider mt-1">Sắp ra mắt</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-line p-6 md:p-8 shadow-sm text-center">
        {!file && resultUrls.length === 0 ? (
          <div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors rounded-2xl p-12 text-center cursor-pointer flex flex-col items-center justify-center"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept={selectedOption.from === 'pdf' ? '.pdf' : '.jpg,.jpeg,.png'} 
                className="hidden" 
              />
              <Upload className="w-16 h-16 text-primary mb-4" />
              <h3 className="text-xl font-bold text-ink mb-2">Tải file {selectedOption.from.toUpperCase()} lên đây</h3>
              <p className="text-ink-muted">Hoặc kéo thả file vào khung này</p>
            </div>
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5" /> {error}
              </div>
            )}
          </div>
        ) : resultUrls.length > 0 ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-700">Chuyển đổi thành công!</h3>
            <p className="text-emerald-600 font-medium">Bạn có thể tải xuống kết quả ngay bây giờ.</p>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mt-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              {resultUrls.length === 1 ? (
                <a 
                  href={resultUrls[0].url} 
                  download={resultUrls[0].name}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:scale-105"
                >
                  <Download className="w-5 h-5" /> Tải Xuống File
                </a>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-emerald-800 mb-4 text-left">Đã tạo ra {resultUrls.length} file ảnh (Mỗi ảnh 1 trang PDF):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {resultUrls.map((res, i) => (
                      <a 
                        key={i}
                        href={res.url} 
                        download={res.name}
                        className="flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-lg hover:border-emerald-500 hover:shadow-md transition-all group text-left"
                      >
                        <span className="font-medium text-ink text-sm truncate max-w-[200px]">{res.name}</span>
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Download className="w-4 h-4" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-6">
              <button onClick={resetAll} className="text-primary font-bold hover:underline">Chuyển đổi file khác</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="bg-page p-6 rounded-xl border border-line flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                {selectedOption.from === 'pdf' ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink truncate">{file?.name}</p>
                <p className="text-sm text-ink-muted">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 font-medium text-left text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}
            
            {progress && (
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl flex items-center gap-3 font-medium text-left text-sm animate-pulse">
                <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> {progress}
              </div>
            )}
            
            <div className="flex gap-3">
              <button onClick={resetAll} className="flex-1 py-3 px-4 bg-surface hover:bg-surface-hover border border-line text-ink-muted font-bold rounded-xl transition">
                Hủy bỏ
              </button>
              <button 
                onClick={processFile}
                disabled={isProcessing}
                className="flex-[2] py-3 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Chuyển sang {selectedOption.to.toUpperCase()}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
