'use client'

import React, { useState, useRef } from 'react'
import { Lock, Unlock, Upload, Download, FileText, Key, Shield, AlertTriangle } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

import { encryptPDF } from '@pdfsmaller/pdf-encrypt'
import { decryptPDF } from '@pdfsmaller/pdf-decrypt'
import { usePathname } from 'next/navigation'

export function PdfLockUnlock() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/') || pathname === '/en'

  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'lock' | 'unlock'>('lock')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== 'application/pdf') {
        setError(isEn ? 'Please select a valid PDF file.' : 'Vui lòng chọn file PDF hợp lệ.')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setSuccessMsg(null)
      e.target.value = ''
    }
  }

  const processPdf = async () => {
    if (!file) {
      setError(isEn ? 'Please select a PDF file.' : 'Vui lòng chọn một file PDF.')
      return
    }
    if (!password) {
      setError(isEn ? 'Please enter a password.' : 'Vui lòng nhập mật khẩu.')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      let resultBytes: Uint8Array

      if (mode === 'lock') {
        // Encrypt the PDF
        try {
          resultBytes = await encryptPDF(uint8Array, password, { algorithm: 'AES-256' })
        } catch (e: any) {
          if (e.code === 'ALREADY_ENCRYPTED') {
            throw new Error(isEn ? 'This file is already encrypted. Please select another file or unlock it first.' : 'File này đã được mã hóa từ trước. Vui lòng chọn file khác hoặc mở khóa trước.')
          }
          throw e
        }
      } else {
        // Unlock the PDF
        try {
          resultBytes = await decryptPDF(uint8Array, password)
        } catch (e: any) {
          throw new Error(isEn ? 'Incorrect password or file is not properly encrypted.' : 'Mật khẩu không chính xác hoặc file không được mã hóa đúng chuẩn.')
        }
      }

      // Download the processed file
      const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = mode === 'lock' ? `locked_${file!.name}` : `unlocked_${file!.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMsg(mode === 'lock' ? (isEn ? 'File successfully locked!' : 'Đã khóa file thành công!') : (isEn ? 'File successfully unlocked!' : 'Đã mở khóa file thành công!'))
    } catch (err: any) {
      console.error(err)
      setError(err.message || (isEn ? 'An error occurred during processing.' : 'Đã xảy ra lỗi trong quá trình xử lý.'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Mode Switcher */}
      <div className="flex p-1 bg-surface-hover rounded-xl mb-8 w-fit mx-auto border border-line">
        <button
          onClick={() => { setMode('lock'); setError(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'lock' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Lock className="w-4 h-4" /> {isEn ? 'Lock File' : 'Khóa File'}
        </button>
        <button
          onClick={() => { setMode('unlock'); setError(null); setSuccessMsg(null); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'unlock' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Unlock className="w-4 h-4" /> {isEn ? 'Unlock File' : 'Mở Khóa'}
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-line p-6 md:p-8 shadow-sm">
        <div className="space-y-6">
          
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {isEn ? 'PDF Document' : 'Tài liệu PDF'}
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-line hover:border-primary/50 hover:bg-primary/5 transition-colors rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf" 
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-ink font-medium text-lg">{file.name}</p>
                  <p className="text-ink-muted text-sm mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button className="mt-4 text-primary text-sm font-medium hover:underline">
                    {isEn ? 'Select another file' : 'Chọn file khác'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4 text-ink-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-ink font-medium">{isEn ? 'Click to select or drag and drop file here' : 'Nhấn để chọn hoặc kéo thả file vào đây'}</p>
                  <p className="text-ink-muted text-sm mt-1">{isEn ? 'Only PDF format supported' : 'Chỉ hỗ trợ định dạng PDF'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {mode === 'lock' ? (isEn ? 'Protection Password' : 'Mật khẩu bảo vệ') : (isEn ? 'Current file password' : 'Mật khẩu hiện tại của file')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                <Key className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEn ? 'Enter password...' : 'Nhập mật khẩu...'}
                className="w-full pl-10 pr-4 py-3 bg-surface border border-line rounded-xl text-ink focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            {mode === 'lock' && (
              <p className="text-xs text-ink-muted mt-2 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> {isEn ? 'Please remember this password as it cannot be recovered if lost.' : 'Hãy ghi nhớ mật khẩu này vì không thể khôi phục nếu quên.'}
              </p>
            )}
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          {successMsg && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 text-green-600">
              <Shield className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={processPdf}
            disabled={!file || !password || isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'lock' ? (
              <>
                <Lock className="w-5 h-5" /> Mã Khóa File PDF
              </>
            ) : (
              <>
                <Unlock className="w-5 h-5" /> Gỡ Khóa File PDF
              </>
            )}
          </button>
          
        </div>
      </div>
    </div>
  )
}
