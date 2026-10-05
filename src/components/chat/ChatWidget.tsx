'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, User, ShieldAlert } from 'lucide-react'
import { useSession } from 'next-auth/react'

export function ChatWidget() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Polling for real-time messages
  useEffect(() => {
    if (!isOpen || !session?.user) return

    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [isOpen, session])

  useEffect(() => {
    // Auto scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat')
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !session?.user) return

    const messageText = input
    setInput('')
    setLoading(true)
    
    // Optimistic UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: session.user?.email,
      isAdmin: false,
      content: messageText,
      createdAt: Date.now()
    }])

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText })
      })
      await fetchMessages()
    } catch (e) {
      alert('Gửi tin nhắn thất bại')
    } finally {
      setLoading(false)
    }
  }

  // Nếu chưa đăng nhập thì không hiển thị bong bóng chat
  if (!session?.user) return null

  return (
    <>
      {/* Nút bấm nổi */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 hover:scale-110 transition-all z-50 flex items-center justify-center ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Cửa sổ chat */}
      <div className={`fixed bottom-6 right-6 w-[350px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px', maxHeight: 'calc(100vh - 40px)' }}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <ShieldAlert size={20} className="text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-indigo-600 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-sm">Hỗ trợ VNDocs</h3>
              <p className="text-xs text-blue-100 opacity-90">Chúng tôi luôn sẵn sàng hỗ trợ</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2">
              <MessageSquare size={48} className="opacity-20" />
              <p className="text-sm">Hãy gửi tin nhắn nếu bạn cần trợ giúp.<br/>Admin sẽ phản hồi sớm nhất.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${msg.isAdmin ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center w-10 h-10"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
