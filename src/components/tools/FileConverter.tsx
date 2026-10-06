'use client'

import React, { useState, useRef } from 'react'
import { ImageIcon, ArrowRight, Upload, Download, Loader2, AlertCircle, RefreshCw, File } from 'lucide-react'
import { usePathname } from 'next/navigation'

type Format = 'jpg' | 'png' | 'webp' | 'bmp' | 'gif' | 'ico' | 'tiff' | 'heic'

interface ConversionOption {
  from: Format
  to: Format
  label: string
  supported: boolean
}

const getFormatColor = (fmt: Format) => {
  switch (fmt) {
    case 'jpg': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'png': return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'webp': return 'text-green-600 bg-green-50 border-green-200'
    case 'bmp': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    case 'gif': return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'ico': return 'text-pink-600 bg-pink-50 border-pink-200'
    case 'tiff': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
    case 'heic': return 'text-rose-600 bg-rose-50 border-rose-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function FileConverter() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const CONVERSION_OPTIONS: ConversionOption[] = [
    { from: 'jpg', to: 'png', label: isEn ? 'JPG to PNG' : 'JPG sang PNG', supported: true },
    { from: 'png', to: 'jpg', label: isEn ? 'PNG to JPG' : 'PNG sang JPG', supported: true },
    
    { from: 'jpg', to: 'webp', label: isEn ? 'JPG to WEBP' : 'JPG sang WEBP', supported: true },
    { from: 'png', to: 'webp', label: isEn ? 'PNG to WEBP' : 'PNG sang WEBP', supported: true },
    
    { from: 'webp', to: 'jpg', label: isEn ? 'WEBP to JPG' : 'WEBP sang JPG', supported: true },
    { from: 'webp', to: 'png', label: isEn ? 'WEBP to PNG' : 'WEBP sang PNG', supported: true },
    
    { from: 'jpg', to: 'bmp', label: isEn ? 'JPG to BMP' : 'JPG sang BMP', supported: true },
    { from: 'png', to: 'bmp', label: isEn ? 'PNG to BMP' : 'PNG sang BMP', supported: true },

    { from: 'gif', to: 'jpg', label: isEn ? 'GIF to JPG' : 'GIF sang JPG', supported: true },
    { from: 'gif', to: 'png', label: isEn ? 'GIF to PNG' : 'GIF sang PNG', supported: true },
    
    { from: 'jpg', to: 'ico', label: isEn ? 'JPG to ICO' : 'JPG sang ICO', supported: true },
    { from: 'png', to: 'ico', label: isEn ? 'PNG to ICO' : 'PNG sang ICO', supported: true },
    
    { from: 'heic', to: 'jpg', label: isEn ? 'HEIC to JPG' : 'HEIC sang JPG', supported: true },
    { from: 'tiff', to: 'jpg', label: isEn ? 'TIFF to JPG' : 'TIFF sang JPG', supported: true },
  ]

  const [selectedOption, setSelectedOption] = useState<ConversionOption>(CONVERSION_OPTIONS[0])
  const [file, setFile] = useState<File | null>(null)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultUrls, setResultUrls] = useState<{url: string, name: string}[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (!selected.type.startsWith('image/')) {
        setError(isEn ? 'Please select an image file.' : 'Vui lòng chọn file hình ảnh.')
        return
      }
      setFile(selected)
      setError(null)
      setResultUrls([])
      e.target.value = ''
    }
  }

  const convertImageFormat = async () => {
    if (!file) return

    return new Promise<void>((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error(isEn ? 'Could not initialize 2D Canvas' : 'Không thể khởi tạo Canvas 2D'))
          return
        }

        // Handle background color for transparent formats converting to JPG
        if (selectedOption.to === 'jpg' || selectedOption.to === 'bmp') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0)

        let mimeType = 'image/jpeg'
        let ext = 'jpg'
        
        switch (selectedOption.to) {
          case 'png': mimeType = 'image/png'; ext = 'png'; break;
          case 'webp': mimeType = 'image/webp'; ext = 'webp'; break;
          case 'bmp': mimeType = 'image/bmp'; ext = 'bmp'; break;
          case 'jpg': default: mimeType = 'image/jpeg'; ext = 'jpg'; break;
        }

        canvas.toBlob((blob) => {
          if (blob) {
            setResultUrls([{ url: URL.createObjectURL(blob), name: `VNDocs-Converted-${file.name.split('.')[0]}.${ext}` }])
            resolve()
          } else {
            reject(new Error(isEn ? 'Error exporting image. Please try again.' : 'Lỗi khi xuất ảnh. Hãy thử lại.'))
          }
        }, mimeType, 0.9)
      }
      
      img.onerror = () => reject(new Error(isEn ? 'Invalid or corrupted file' : 'File không hợp lệ hoặc bị hỏng'))
      img.src = URL.createObjectURL(file)
    })
  }

  const processFile = async () => {
    if (!file) return
    setIsProcessing(true)
    setError(null)
    setResultUrls([])
    
    try {
      await convertImageFormat()
    } catch (err: any) {
      console.error(err)
      setError(err.message || (isEn ? 'An error occurred during conversion.' : 'Có lỗi xảy ra trong quá trình chuyển đổi.'))
    } finally {
      setIsProcessing(false)
    }
  }

  const resetAll = () => {
    setFile(null)
    setResultUrls([])
    setError(null)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Option Selector */}
      <div className="bg-surface rounded-2xl border border-line p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" /> {isEn ? 'Select conversion type' : 'Chọn loại chuyển đổi'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${getFormatColor(opt.from)}`}>{opt.from}</span>
                <ArrowRight className="w-3 h-3 opacity-40 text-slate-400" />
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${getFormatColor(opt.to)}`}>{opt.to}</span>
              </div>
              <span className="font-semibold text-[13px] text-slate-700">{opt.label}</span>
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
                accept="image/*"
                className="hidden" 
              />
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-primary">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{isEn ? 'Upload image' : 'Tải ảnh lên'}</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {isEn ? 'Click here to select an image from your device.' : 'Nhấn vào đây để chọn ảnh từ thiết bị của bạn.'} 
                {isEn ? ' Supports JPG, PNG, WEBP, BMP, GIF.' : ' Hỗ trợ JPG, PNG, WEBP, BMP, GIF.'}
              </p>
              <button className="bg-primary text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
                {isEn ? 'Select File' : 'Chọn File'}
              </button>
            </div>
          </div>
        ) : resultUrls.length > 0 ? (
          <div className="py-8">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{isEn ? 'Conversion complete!' : 'Chuyển đổi hoàn tất!'}</h3>
            <p className="text-slate-500 mb-8">{isEn ? 'Your image is ready to download.' : 'Ảnh của bạn đã sẵn sàng để tải xuống.'}</p>
            
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              {resultUrls.map((res, i) => (
                <a 
                  key={i}
                  href={res.url} 
                  download={res.name}
                  className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-xl hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 hover:-translate-y-0.5"
                >
                  <Download className="w-5 h-5" /> {isEn ? 'Download' : 'Tải xuống'} ({res.name})
                </a>
              ))}
              <button 
                onClick={resetAll}
                className="mt-2 text-primary font-semibold hover:underline"
              >
                {isEn ? 'Convert another image' : 'Chuyển đổi ảnh khác'}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 max-w-sm truncate">{file?.name}</h3>
            <p className="text-slate-500 text-sm mb-8">
              {(file?.size! / 1024 / 1024).toFixed(2)} MB • {isEn ? 'Preparing to convert to' : 'Đang chuẩn bị chuyển đổi sang'} {selectedOption.to.toUpperCase()}
            </p>

            {error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex flex-col items-center gap-3 w-full max-w-md mx-auto">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-5 h-5" /> {isEn ? 'An error occurred' : 'Đã xảy ra lỗi'}
                </div>
                <p className="text-sm">{error}</p>
                <button 
                  onClick={resetAll}
                  className="mt-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
                >
                  {isEn ? 'Retry' : 'Thử lại'}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={resetAll}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl border border-line font-semibold text-ink-muted hover:bg-page transition-colors disabled:opacity-50"
                >
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
                <button 
                  onClick={processFile}
                  disabled={isProcessing}
                  className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 min-w-[140px] justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> {isEn ? 'Processing...' : 'Đang xử lý...'}
                    </>
                  ) : (
                    isEn ? 'Convert now' : 'Chuyển đổi ngay'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
