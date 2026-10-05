'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Loader2, Search, Send, User } from 'lucide-react'

export function ChatTab() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [activeMessages, setActiveMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
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
      // Re-fetch only messages for active user
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !activeUserId) return

    const messageText = input
    setInput('')
    setSending(true)
    
    // Optimistic UI
    setActiveMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: activeUserId,
      isAdmin: true,
      content: messageText,
      createdAt: Date.now()
    }])

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText, toUserId: activeUserId })
      })
      await fetchConversations()
    } catch (e) {
      alert('Gửi tin nhắn thất bại')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(c => 
    c.userId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">Chưa có tin nhắn nào.</div>
          ) : (
            filteredConversations.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1]
              const isUnread = !lastMsg.isAdmin && !lastMsg.isRead
              
              return (
                <button
                  key={conv.userId}
                  onClick={() => setActiveUserId(conv.userId)}
                  className={`w-full text-left p-4 border-b border-gray-100 transition-colors flex flex-col gap-1 ${activeUserId === conv.userId ? 'bg-blue-50' : 'hover:bg-white'} ${isUnread ? 'bg-emerald-50' : ''}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`font-medium truncate ${isUnread ? 'font-bold text-emerald-700' : 'text-gray-900'}`}>{conv.userId}</span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                      {new Date(lastMsg.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${isUnread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                    {lastMsg.isAdmin ? 'Bạn: ' : ''}{lastMsg.content}
                  </p>
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
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{activeUserId}</h3>
                <p className="text-xs text-emerald-600 font-medium">Đang trực tuyến</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {activeMessages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${msg.isAdmin ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Nhắn tin cho ${activeUserId}...`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sending}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
            <User size={64} className="opacity-20" />
            <p>Chọn một cuộc hội thoại để bắt đầu chat</p>
          </div>
        )}
      </div>
    </div>
  )
}
