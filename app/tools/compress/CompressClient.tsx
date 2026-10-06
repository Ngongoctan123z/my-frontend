'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileImage, Archive, UploadCloud, Download, Loader2, X, Settings, FileBox } from 'lucide-react'
import JSZip from 'jszip'
import { usePathname } from 'next/navigation'

type Tab = 'IMAGE' | 'ZIP'

export function CompressClient() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const [activeTab, setActiveTab] = useState<Tab>('IMAGE')
  const [files, setFiles] = useState<File[]>([])
  
  // Image Compression State
  const [quality, setQuality] = useState<number>(0.7)
  const [maxWidth, setMaxWidth] = useState<number>(1920)
  const [compressedImages, setCompressedImages] = useState<{name: string, url: string, originalSize: number, newSize: number}[]>([])
  
  // ZIP State
  const [isZipping, setIsZipping] = useState(false)
  const [zipUrl, setZipUrl] = useState<string | null>(null)
  const [zipSize, setZipSize] = useState<number>(0)
  const [zipName, setZipName] = useState<string>('compressed_files.zip')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up ObjectURLs
  useEffect(() => {
    return () => {
      compressedImages.forEach(img => URL.revokeObjectURL(img.url))
      if (zipUrl) URL.revokeObjectURL(zipUrl)
    }
  }, [compressedImages, zipUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
      setCompressedImages([])
      if (zipUrl) URL.revokeObjectURL(zipUrl)
      setZipUrl(null)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // IMAGE COMPRESSION
  const compressImages = async () => {
    if (files.length === 0) return
    const results = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue

      const compressedUrl = await compressSingleImage(file)
      if (compressedUrl) {
        // fetch blob to get size
        const blob = await fetch(compressedUrl).then(r => r.blob())
        results.push({
          name: `compressed_${file.name}`,
          url: compressedUrl,
          originalSize: file.size,
          newSize: blob.size
        })
      }
    }
    setCompressedImages(results)
  }

  const compressSingleImage = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)

        ctx.drawImage(img, 0, 0, width, height)
        // Convert to WebP or JPEG based on original, fallback to JPEG
        const type = file.type === 'image/png' ? 'image/jpeg' : file.type // PNGs can't be lossy compressed easily natively, better to output JPEG or WebP
        const outType = type === 'image/webp' ? 'image/webp' : 'image/jpeg'
        
        const dataUrl = canvas.toDataURL(outType, quality)
        resolve(dataUrl)
      }
      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  }

  // ZIP COMPRESSION
  const createZip = async () => {
    if (files.length === 0) return
    setIsZipping(true)
    try {
      const zip = new JSZip()
      files.forEach(file => {
        zip.file(file.name, file)
      })
      
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      const url = URL.createObjectURL(content)
      setZipUrl(url)
      setZipSize(content.size)
    } catch (e) {
      console.error(e)
      alert(isEn ? 'An error occurred while creating the ZIP file.' : 'Đã xảy ra lỗi khi tạo file ZIP.')
    } finally {
      setIsZipping(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="bg-white dark:bg-[#161B22] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => { setActiveTab('IMAGE'); setFiles([]); setCompressedImages([]) }}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${
            activeTab === 'IMAGE' 
              ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--bg-secondary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          <FileImage className="w-5 h-5" /> {isEn ? 'Compress Image (Reduce Size)' : 'Nén ảnh (Giảm dung lượng)'}
        </button>
        <button
          onClick={() => { setActiveTab('ZIP'); setFiles([]); setZipUrl(null) }}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${
            activeTab === 'ZIP' 
              ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--bg-secondary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
          }`}
        >
          <Archive className="w-5 h-5" /> {isEn ? 'Package (Create .ZIP file)' : 'Đóng gói (Tạo file .ZIP)'}
        </button>
      </div>

      <div className="p-6 md:p-10 space-y-8">
        
        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[var(--bg-secondary)] hover:border-[var(--color-primary)] transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] group-hover:bg-blue-100 flex items-center justify-center mb-4 transition-colors">
            <UploadCloud className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
            {isEn ? 'Click to select file' : 'Nhấn để chọn file'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {activeTab === 'IMAGE' ? (isEn ? 'Supports JPG, PNG, WEBP.' : 'Hỗ trợ JPG, PNG, WEBP.') : (isEn ? 'Supports all file formats.' : 'Hỗ trợ mọi định dạng file.')}
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept={activeTab === 'IMAGE' ? "image/*" : "*"}
            onChange={handleFileChange}
          />
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileBox className="w-5 h-5" /> {isEn ? `File list (${files.length})` : `Danh sách file (${files.length})`}
              </h4>
              <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:underline">{isEn ? 'Clear all' : 'Xóa tất cả'}</button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 border border-[var(--border-color)] rounded-xl p-2 bg-[var(--bg-secondary)]">
              {files.map((file, i) => (
                <div key={i} className="flex justify-between items-center bg-white dark:bg-[#0D1117] p-3 rounded-lg shadow-sm border border-[var(--border-color)]">
                  <div className="truncate flex-1 mr-4 text-sm font-medium text-[var(--text-primary)]">
                    {file.name}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-[var(--text-secondary)] font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded">
                      {formatSize(file.size)}
                    </span>
                    <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Area */}
        {files.length > 0 && activeTab === 'IMAGE' && compressedImages.length === 0 && (
          <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] space-y-6">
            <h4 className="font-bold flex items-center gap-2"><Settings className="w-5 h-5" /> {isEn ? 'Customize Image Compression' : 'Tùy chỉnh Nén ảnh'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">{isEn ? `Image quality: ${Math.round(quality * 100)}%` : `Chất lượng ảnh: ${Math.round(quality * 100)}%`}</label>
                <input 
                  type="range" min="0.1" max="1" step="0.1" 
                  value={quality} 
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">{isEn ? 'Lower quality means smaller file size but the image will be blurrier.' : 'Chất lượng càng thấp, dung lượng càng nhỏ nhưng ảnh sẽ mờ hơn.'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{isEn ? 'Max width (px)' : 'Chiều ngang tối đa (px)'}</label>
                <select 
                  value={maxWidth} 
                  onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-white dark:bg-[#0D1117] outline-none focus:border-blue-500"
                >
                  <option value={800}>{isEn ? '800px (Lightest)' : '800px (Nhẹ nhất)'}</option>
                  <option value={1280}>{isEn ? '1280px (Medium)' : '1280px (Vừa)'}</option>
                  <option value={1920}>{isEn ? '1920px (Good)' : '1920px (Tốt)'}</option>
                  <option value={3840}>{isEn ? '3840px (Very sharp)' : '3840px (Rất nét)'}</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={compressImages}
              className="w-full py-4 bg-[var(--color-primary)] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20"
            >
              {isEn ? `Start compressing ${files.length} images` : `Bắt đầu nén ${files.length} ảnh`}
            </button>
          </div>
        )}

        {files.length > 0 && activeTab === 'ZIP' && !zipUrl && (
          <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">{isEn ? 'Archive name (.zip)' : 'Tên file nén (.zip)'}</label>
              <input 
                type="text" 
                value={zipName}
                onChange={(e) => setZipName(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-white dark:bg-[#0D1117] outline-none focus:border-blue-500"
                placeholder={isEn ? "Ex: study_materials.zip" : "VD: tailieu_hoctap.zip"}
              />
            </div>
            <button 
              onClick={createZip}
              disabled={isZipping}
              className="w-full py-4 bg-[var(--color-primary)] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isZipping ? <><Loader2 className="w-5 h-5 animate-spin" /> {isEn ? 'Packaging...' : 'Đang đóng gói...'}</> : <><Archive className="w-5 h-5" /> {isEn ? 'Create ZIP File' : 'Tạo File ZIP'}</>}
            </button>
          </div>
        )}

        {/* Results */}
        {compressedImages.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-[var(--border-color)]">
            <h4 className="font-bold text-green-600 text-xl flex items-center gap-2">
              {isEn ? `Successfully compressed ${compressedImages.length} images!` : `Nén thành công ${compressedImages.length} ảnh!`}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compressedImages.map((img, i) => (
                <div key={i} className="bg-white dark:bg-[#161B22] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col items-center text-center shadow-sm">
                  <img src={img.url} alt="Preview" className="h-32 object-contain mb-4 rounded-lg bg-[var(--bg-secondary)] w-full" />
                  <p className="text-sm font-semibold mb-2 truncate w-full px-2">{img.name}</p>
                  
                  <div className="flex gap-4 mb-4 text-xs">
                    <div className="text-[var(--text-secondary)] line-through">{formatSize(img.originalSize)}</div>
                    <div className="font-bold text-green-600">
                      {formatSize(img.newSize)} 
                      <span className="ml-1 text-xs">(-{Math.round((1 - img.newSize / img.originalSize) * 100)}%)</span>
                    </div>
                  </div>

                  <a 
                    href={img.url} 
                    download={img.name}
                    className="w-full py-2 bg-green-100 text-green-700 hover:bg-green-200 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" /> {isEn ? 'Download' : 'Tải về'}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {zipUrl && (
          <div className="pt-6 border-t border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Archive className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-green-600 mb-2">{isEn ? 'ZIP file created successfully!' : 'Tạo file ZIP thành công!'}</h4>
              <p className="text-[var(--text-secondary)] font-medium">{isEn ? 'Size:' : 'Dung lượng:'} {formatSize(zipSize)}</p>
            </div>
            <a 
              href={zipUrl} 
              download={zipName.endsWith('.zip') ? zipName : `${zipName}.zip`}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full flex items-center gap-2 transition-all shadow-lg shadow-green-500/30 text-lg hover:scale-105"
            >
              <Download className="w-6 h-6" /> {isEn ? `Download ${zipName}` : `Tải File ${zipName}`}
            </a>
          </div>
        )}

      </div>
    </div>
  )
}
