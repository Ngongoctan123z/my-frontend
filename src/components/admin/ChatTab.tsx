'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Loader2, Search, Send, User, Paperclip, FileText, Download, X, Maximize2 } from 'lucide-react'

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

export function ChatTab() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Attachment state for Admin
  const [selectedFile, setSelectedFile] = useState<{
    file: File
    type: 'image' | 'file'
    dataUrl: string
    name: string
    size: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(() => {
      fetchConversations()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeUserId) {
      const msgs = conversations.find(c => c.userId === activeUserId)?.messages || []
      setActiveMessages(msgs)
    }
  }, [conversations, activeUserId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeMessages])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chat')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let w = img.width
          let h = img.height
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w)
            w = maxWidth
          }
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(e.target?.result as string)
            return
          }
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(dataUrl)
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Tệp quá lớn. Vui lòng chọn tệp dưới 5MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const isImage = file.type.startsWith('image/')
    try {
      if (isImage) {
        const compressed = await compressImage(file, 1200, 0.8)
        setSelectedFile({
          file,
          type: 'image',
          dataUrl: compressed,
          name: file.name,
          size: file.size
        })
      } else {
        const dataUrl = await readFileAsDataUrl(file)
        setSelectedFile({
          file,
          type: 'file',
          dataUrl,
          name: file.name,
          size: file.size
        })
      }
    } catch (err) {
      console.error(err)
      alert('Lỗi xử lý tệp.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedFile) || !activeUserId) return

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

    setInput('')
    setSelectedFile(null)
    setSending(true)
    
    // Optimistic UI
    setActiveMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: activeUserId,
      isAdmin: true,
      content: payloadContent,
      createdAt: Date.now()
    }])

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: payloadContent, toUserId: activeUserId })
      })
      await fetchConversations()
    } catch (e) {
      alert('Gửi tin nhắn thất bại')
      setInput(currentInput)
      setSelectedFile(currentFile)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(c => 
    c.userId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="flex h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Sidebar - Users */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="font-bold text-lg mb-4">Hỗ Trợ Khách Hàng</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Tìm email khách..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Đang tải tin nhắn...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Không có cuộc trò chuyện nào
              </div>
            ) : (
              filteredConversations.map(c => {
                const lastMsg = c.messages[c.messages.length - 1]
                const parsedLast = lastMsg ? parseMessageContent(lastMsg.content) : null
                const isSelected = c.userId === activeUserId

                return (
                  <button
                    key={c.userId}
                    onClick={() => setActiveUserId(c.userId)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-gray-100 ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {c.userId.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{c.userId}</h4>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(lastMsg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {parsedLast?.attachment ? `[Tệp: ${parsedLast.attachment.name}] ${parsedLast.text || ''}` : (parsedLast?.text || '...')}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeUserId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {activeUserId.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{activeUserId}</h3>
                  <p className="text-xs text-emerald-600 font-medium">Hội thoại trực tiếp</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {activeMessages.map((msg: any) => {
                  const parsed = parseMessageContent(msg.content)
                  const isAdminMsg = msg.isAdmin

                  return (
                    <div key={msg.id} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm space-y-2 ${
                        isAdminMsg 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}>
                        {/* Image attachment */}
                        {parsed.attachment && parsed.attachment.type === 'image' && (
                          <div className="relative group rounded-xl overflow-hidden border border-black/10 bg-black/5 cursor-pointer max-w-full">
                            <img 
                              src={parsed.attachment.url} 
                              alt={parsed.attachment.name || 'Ảnh đính kèm'}
                              className="max-h-56 w-full object-contain rounded-lg"
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

                        {/* File attachment */}
                        {parsed.attachment && parsed.attachment.type === 'file' && (
                          <a
                            href={parsed.attachment.url}
                            download={parsed.attachment.name || 'download-file'}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                              isAdminMsg 
                                ? 'bg-blue-700/60 border-blue-400/40 text-white hover:bg-blue-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg ${isAdminMsg ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate leading-tight">{parsed.attachment.name}</p>
                              <p className={`text-[10px] ${isAdminMsg ? 'text-blue-200' : 'text-slate-400'}`}>
                                {formatFileSize(parsed.attachment.size)}
                              </p>
                            </div>
                            <Download size={14} className="shrink-0 opacity-80" />
                          </a>
                        )}

                        {/* Text */}
                        {parsed.text && (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{parsed.text}</p>
                        )}

                        <p className={`text-[10px] text-right font-medium ${isAdminMsg ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Selected File Strip */}
              {selectedFile && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedFile.type === 'image' ? (
                      <img src={selectedFile.dataUrl} alt="Preview" className="w-8 h-8 object-cover rounded-md border" />
                    ) : (
                      <FileText size={18} className="text-blue-600" />
                    )}
                    <span className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-500">({formatFileSize(selectedFile.size)})</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-rose-600">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Chat Input */}
              <div className="p-3 border-t border-gray-200 bg-white">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.xlsx"
                    className="hidden"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title="Đính kèm ảnh hoặc tệp"
                  >
                    <Paperclip size={20} />
                  </button>

                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Nhắn tin cho ${activeUserId}...`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={sending}
                  />

                  <button 
                    type="submit"
                    disabled={(!input.trim() && !selectedFile) || sending}
                    className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
              <User size={64} className="opacity-20" />
              <p className="text-sm">Chọn một cuộc hội thoại từ danh sách bên trái để phản hồi</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/70 text-white rounded-full hover:bg-black"
            >
              <X size={18} />
            </button>
            <img src={previewImage} alt="Ảnh phóng to" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </>
  )
}
