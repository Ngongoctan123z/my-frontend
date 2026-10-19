'use client'

import { FloatingToolPanel } from './FloatingToolPanel'
import React, { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, X, Send, ShieldAlert, Paperclip, 
  FileText, Download, Image as ImageIcon, Loader2, LogIn, Maximize2 
} from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'

interface ParsedMessage {
  text: string
  attachment?: {
    type: 'image' | 'file'
    name: string
    size: number
    url: string
  }
}

function parseMessageContent(raw: string): ParsedMessage {
  if (typeof raw === 'string' && raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.attachment || parsed.text !== undefined) {
        return {
          text: parsed.text || '',
          attachment: parsed.attachment
        }
      }
    } catch {
      // Fallback
    }
  }
  return { text: raw }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ChatBubble({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<{
    file: File
    type: 'image' | 'file'
    dataUrl: string
    name: string
    size: number
  } | null>(null)

  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Polling for messages
  const inflightRef = useRef(false)

  useEffect(() => {
    if (!session?.user) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchMessages = async () => {
    if (inflightRef.current) return // Tránh gọp request khi chưa xong
    inflightRef.current = true
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      inflightRef.current = false
    }
  }

  // Handle selecting file/image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')

    // Đối với tệp tài liệu (PDF, Word, Zip...): D1 Database giới hạn dung lượng lưu trữ trực tiếp
    if (!isImage && file.size > 50 * 1024) {
      alert(`Tệp "${file.name}" có dung lượng ${(file.size / 1024).toFixed(0)} KB (vượt mức 50KB của chat trực tiếp).\n\nĐối với tài liệu học tập, PDF hoặc file nặng, bạn vui lòng tải lên Google Drive / OneDrive rồi dán link vào ô chat hoặc gửi về email admin@vndocs.net để admin hỗ trợ nhé!`)
      if (!input.trim()) {
        setInput(`Link tài liệu (${file.name}): `)
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploadingFile(true)

    try {
      if (isImage) {
        // Nén ảnh thích ứng tự động nhiều bước (Adaptive Multi-pass Compression)
        // Đảm bảo chuỗi Base64 luôn < 65KB để chui lọt qua tham số Cloudflare D1 Database an toàn 100%
        const compressedDataUrl = await compressImage(file)
        setSelectedFile({
          file,
          type: 'image',
          dataUrl: compressedDataUrl,
          name: file.name,
          size: Math.round(compressedDataUrl.length * 0.75)
        })
      } else {
        // Đọc file nhỏ thành Data URL
        const dataUrl = await readFileAsDataUrl(file)
        if (dataUrl.length > 70000) {
          alert('Tệp đính kèm quá lớn sau khi mã hóa. Vui lòng chia sẻ qua đường link Google Drive.')
          return
        }
        setSelectedFile({
          file,
          type: 'file',
          dataUrl,
          name: file.name,
          size: file.size
        })
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Lỗi xử lý tệp tin. Vui lòng thử lại.')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Nén ảnh thông minh đa tầng: Tự động co kích thước và điều chỉnh chất lượng sao cho chuỗi Base64 < 65KB
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const tryCompress = (maxDim: number, quality: number) => {
            let w = img.width
            let h = img.height
            if (w > h) {
              if (w > maxDim) {
                h = Math.round((h * maxDim) / w)
                w = maxDim
              }
            } else {
              if (h > maxDim) {
                w = Math.round((w * maxDim) / h)
                h = maxDim
              }
            }
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')
            if (!ctx) return ''
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, w, h)
            ctx.drawImage(img, 0, 0, w, h)
            return canvas.toDataURL('image/jpeg', quality)
          }

          // Lần 1: 850px @ 0.65 (đủ sắc nét đọc đề, bảng biểu)
          let result = tryCompress(850, 0.65)
          // Lần 2: nếu vẫn > 65KB, hạ xuống 700px @ 0.55
          if (result.length > 65000) {
            result = tryCompress(700, 0.55)
          }
          // Lần 3: nếu ảnh gốc quá phức tạp, hạ xuống 550px @ 0.45
          if (result.length > 65000) {
            result = tryCompress(550, 0.45)
          }
          // Lần 4: mức đảm bảo an toàn tuyệt đối
          if (result.length > 65000) {
            result = tryCompress(450, 0.35)
          }

          resolve(result)
        }
        img.onerror = () => reject(new Error('Không thể đọc file ảnh này.'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Lỗi đọc dữ liệu ảnh.'))
      reader.readAsDataURL(file)
    })
  }

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || (!input.trim() && !selectedFile) || !session?.user) return

    setLoading(true)

    let payloadContent = ''
    if (selectedFile) {
      payloadContent = JSON.stringify({
        text: input.trim(),
        attachment: {
          type: selectedFile.type,
          name: selectedFile.name,
          size: selectedFile.size,
          url: selectedFile.dataUrl
        }
      })
    } else {
      payloadContent = input.trim()
    }

    const currentInput = input
    const currentFile = selectedFile

    // Reset input
    setInput('')
    setSelectedFile(null)

    // Optimistic message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: session.user?.email,
      isAdmin: false,
      content: payloadContent,
      createdAt: Date.now()
    }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payloadContent })
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `Lỗi máy chủ (${res.status})`)
      }
      await fetchMessages()
    } catch (e: any) {
      alert(e.message || 'Không thể gửi tin nhắn hoặc tệp đính kèm. Vui lòng thử lại.')
      setInput(currentInput)
      setSelectedFile(currentFile)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <FloatingToolPanel title="Hỗ trợ VNDocs" onClose={onClose}>
        
        {/* Header */}
        <div className="bg-white px-4 py-3.5 text-slate-800 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <ShieldAlert size={18} className="text-blue-600" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Hỗ trợ VNDocs</h3>
              <p className="text-[11px] text-slate-400">Gửi câu hỏi đến đội ngũ hỗ trợ</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} aria-label="Đóng hỗ trợ vndocs"
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Not Logged In View */}
        {!session?.user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
              <MessageSquare size={28} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Đăng nhập để liên hệ hỗ trợ</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Bạn cần đăng nhập tài khoản để nhận phản hồi và lưu lại lịch sử tin nhắn với đội ngũ hỗ trợ.
            </p>
            <button
              onClick={() => signIn('google')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <LogIn size={15} />
              <span>Đăng nhập ngay</span>
            </button>
          </div>
        ) : (
          <>
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2 p-4">
                  <MessageSquare size={40} className="opacity-20 text-blue-600" />
                  <p className="text-xs leading-relaxed">
                    Chào bạn! Bạn cần hỗ trợ về đề thi, phòng luyện thi hay tài khoản?<br />
                    Hãy gửi tin nhắn hoặc tài liệu cho đội ngũ hỗ trợ nhé.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const parsed = parseMessageContent(msg.content)
                  const isUser = !msg.isAdmin

                  return (
                    <div key={msg.id || i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 ${
                        isUser 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}>
                        
                        {/* Attachment (Image) */}
                        {parsed.attachment && parsed.attachment.type === 'image' && (
                          <div className="relative group rounded-xl overflow-hidden border border-black/10 bg-black/5 cursor-pointer max-w-full">
                            <img 
                              src={parsed.attachment.url} 
                              alt={parsed.attachment.name || 'Ảnh đính kèm'}
                              className="max-h-48 w-full object-contain rounded-lg"
                              onClick={() => setPreviewImage(parsed.attachment!.url)}
                            />
                            <div 
                              onClick={() => setPreviewImage(parsed.attachment!.url)}
                              className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                              <div className="bg-black/60 px-2.5 py-1 rounded-md text-[10px] flex items-center gap-1">
                                <Maximize2 size={12} />
                                <span>Phóng to</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Attachment (Document / File) */}
                        {parsed.attachment && parsed.attachment.type === 'file' && (
                          <a
                            href={parsed.attachment.url}
                            download={parsed.attachment.name || 'download-file'}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                              isUser 
                                ? 'bg-blue-700/60 border-blue-400/40 text-white hover:bg-blue-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${isUser ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate leading-tight">{parsed.attachment.name}</p>
                              <p className={`text-[10px] ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                                {formatFileSize(parsed.attachment.size)}
                              </p>
                            </div>
                            <Download size={15} className="shrink-0 opacity-80" />
                          </a>
                        )}

                        {/* Text Caption / Message */}
                        {parsed.text && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{parsed.text}</p>
                        )}

                        {/* Time */}
                        <div className={`text-[9px] text-right font-medium ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>

                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected Attachment Preview Strip */}
            {selectedFile && (
              <div className="px-3 py-2 bg-blue-50/80 border-t border-blue-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {selectedFile.type === 'image' ? (
                    <img 
                      src={selectedFile.dataUrl} 
                      alt="Preview" 
                      className="w-9 h-9 object-cover rounded-lg border border-blue-200 shrink-0" 
                    />
                  ) : (
                    <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Xóa tệp đính kèm"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="flex items-center gap-1.5">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.xlsx"
                  className="hidden"
                />

                {/* Paperclip Button */}
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || loading}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                  title="Đính kèm ảnh hoặc file"
                >
                  {uploadingFile ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Paperclip size={18} />}
                </button>

                {/* Input Text */}
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedFile ? "Thêm ghi chú cho tệp..." : "Nhập tin nhắn..."}
                  aria-label="Tin nhắn hỗ trợ" className="min-w-0 flex-1 px-3 py-3 bg-slate-100 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 transition-all"
                  disabled={loading}
                />

                {/* Send Button */}
                <button 
                  type="submit"
                  disabled={(!input.trim() && !selectedFile) || loading}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-xs active:scale-95"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </>
        )}

      </FloatingToolPanel>

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors shadow-lg"
              title="Đóng ảnh"
            >
              <X size={18} />
            </button>
            <img 
              src={previewImage} 
              alt="Ảnh phóng to" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  )
}

