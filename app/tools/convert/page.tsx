'use client'

import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertCircle, RefreshCw, ArrowRight, Download, FileText } from 'lucide-react';
import { Reveal } from '@/src/components/ui/Reveal';

type ConversionType = 'pdf-to-word' | 'word-to-pdf';

export default function ConvertPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>('pdf-to-word');
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gọi qua proxy route nội bộ thay vì gọi thẳng IP VPS (tránh lỗi HTTPS/HTTP Mixed Content)
  const API_URL = '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setDownloadUrl(null);
    
    // Validate file type based on conversion type
    if (conversionType === 'pdf-to-word' && file.type !== 'application/pdf') {
      setError('Vui lòng chọn file PDF hợp lệ.');
      return;
    }
    
    if (conversionType === 'word-to-pdf' && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setError('Vui lòng chọn file Word (.doc, .docx) hợp lệ.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('Dung lượng file vượt quá giới hạn 50MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setError(null);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const endpoint = conversionType === 'pdf-to-word' ? '/api/convert/pdf-to-word' : '/api/convert/word-to-pdf';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Có lỗi xảy ra trong quá trình chuyển đổi. (Vui lòng đảm bảo Backend VPS đang chạy)');
      }

      // Create a blob URL for download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối tới máy chủ chuyển đổi.');
    } finally {
      setIsConverting(false);
    }
  };

  const getNewFilename = () => {
    if (!selectedFile) return '';
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
    return conversionType === 'pdf-to-word' ? `${baseName}.docx` : `${baseName}.pdf`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Reveal animation="fade-down" duration={600}>
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Chuyển đổi <span className="text-blue-600">File Đa Năng</span>
            </h1>
            <p className="mt-3 text-base text-slate-500 sm:mt-4">
              Nhanh chóng, chính xác và bảo mật. File của bạn sẽ được xóa ngay sau khi chuyển đổi.
            </p>
          </div>
        </Reveal>

        <Reveal animation="fade-up" delay={200} duration={600}>
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => { setConversionType('pdf-to-word'); setSelectedFile(null); setDownloadUrl(null); setError(null); }}
                className={`flex-1 py-4 px-6 text-center text-sm font-semibold transition-colors ${
                  conversionType === 'pdf-to-word' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                PDF <ArrowRight className="inline w-4 h-4 mx-1" /> Word
              </button>
              <button
                onClick={() => { setConversionType('word-to-pdf'); setSelectedFile(null); setDownloadUrl(null); setError(null); }}
                className={`flex-1 py-4 px-6 text-center text-sm font-semibold transition-colors ${
                  conversionType === 'word-to-pdf' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Word <ArrowRight className="inline w-4 h-4 mx-1" /> PDF
              </button>
            </div>

            <div className="p-6 sm:p-10">
              {/* Dropzone */}
              {!downloadUrl && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`relative flex justify-center px-6 pt-10 pb-12 border-2 border-dashed rounded-xl transition-all ${
                    isConverting ? 'border-blue-300 bg-blue-50 opacity-70' : 'border-slate-300 hover:border-blue-500 bg-slate-50/50'
                  }`}
                >
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="mt-4 flex justify-center text-sm leading-6 text-slate-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 px-3 py-1 shadow-sm border border-slate-200"
                      >
                        <span>Tải file lên</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept={conversionType === 'pdf-to-word' ? '.pdf' : '.doc,.docx'}
                          disabled={isConverting}
                        />
                      </label>
                      <p className="pl-2 flex items-center">hoặc kéo thả vào đây</p>
                    </div>
                    <p className="text-xs leading-5 text-slate-500 mt-2">
                      {conversionType === 'pdf-to-word' ? 'PDF' : 'DOC, DOCX'} lên tới 50MB
                    </p>
                  </div>
                </div>
              )}

              {/* Selected File State */}
              {selectedFile && !downloadUrl && (
                <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileType className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="ml-4 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isConverting ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Đang xử lý...</>
                    ) : (
                      'Chuyển Đổi'
                    )}
                  </button>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Success / Download State */}
              {downloadUrl && (
                <div className="mt-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Chuyển đổi hoàn tất!</h3>
                  <p className="text-sm text-slate-500 mb-6">File của bạn đã sẵn sàng để tải xuống.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <a
                      href={downloadUrl}
                      download={getNewFilename()}
                      className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Tải File Về Máy
                    </a>
                    <button
                      onClick={() => { setSelectedFile(null); setDownloadUrl(null); }}
                      className="inline-flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Chuyển đổi file khác
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </Reveal>

        {/* Feature list */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-slate-900">Giữ nguyên định dạng</h3>
              <p className="mt-1 text-sm text-slate-500">Giữ nguyên bố cục trang, font chữ và hình ảnh gốc.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-slate-900">An toàn tuyệt đối</h3>
              <p className="mt-1 text-sm text-slate-500">File tự động bị xóa khỏi máy chủ sau khi quá trình tải hoàn tất.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-purple-100">
              <RefreshCw className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-slate-900">Hoàn toàn miễn phí</h3>
              <p className="mt-1 text-sm text-slate-500">Không giới hạn số lần chuyển đổi, không cần đăng ký tài khoản.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
