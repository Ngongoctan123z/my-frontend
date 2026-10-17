'use client'

import React, { useState } from 'react'
import { MessageSquare, Calculator, Languages, X } from 'lucide-react'
import { CalculatorBubble } from '../floating/CalculatorBubble'
import { TranslateBubble } from '../floating/TranslateBubble'
import { ChatBubble } from '../floating/ChatBubble'

type ActiveWidget = 'calc' | 'translate' | 'chat' | null

export function ChatWidget() {
  const [activeWidget, setActiveWidget] = useState<ActiveWidget>(null)

  const toggleWidget = (widget: ActiveWidget) => {
    setActiveWidget(prev => (prev === widget ? null : widget))
  }

  return (
    <>
      {/* Cửa sổ widget nổi đang mở */}
      {activeWidget && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-22 z-50">
          {activeWidget === 'calc' && (
            <CalculatorBubble onClose={() => setActiveWidget(null)} />
          )}
          {activeWidget === 'translate' && (
            <TranslateBubble onClose={() => setActiveWidget(null)} />
          )}
          {activeWidget === 'chat' && (
            <ChatBubble onClose={() => setActiveWidget(null)} />
          )}
        </div>
      )}

      {/* Thanh Dock 3 nút nổi siêu sang phong cách Glassmorphism Dock */}
      <aside 
        aria-label="Công cụ tiện ích nổi" 
        className="fixed bottom-5 sm:bottom-6 right-3 sm:right-5 z-40 flex flex-col items-center gap-2.5 p-2 sm:p-2.5 rounded-full bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_12px_40px_-4px_rgba(0,0,0,0.18),0_2px_8px_-2px_rgba(0,0,0,0.06)] ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300"
      >
        {/* Nút 1: Máy tính Casio fx-580 */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleWidget('calc')}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 relative overflow-hidden group-hover:scale-108 active:scale-95 cursor-pointer ${
              activeWidget === 'calc'
                ? 'bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 ring-4 ring-indigo-300/80 scale-105 shadow-lg shadow-indigo-500/50'
                : 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 shadow-md shadow-indigo-500/35 hover:shadow-lg hover:shadow-indigo-500/45'
            }`}
            aria-label="Máy tính Casio Online"
          >
            {/* Specular sheen phản chiếu ánh sáng */}
            <span className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-full"></span>
            
            {activeWidget === 'calc' ? (
              <X size={20} className="animate-in spin-in-90 duration-200" />
            ) : (
              <Calculator size={20} className="transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6 drop-shadow-xs" />
            )}
          </button>
          
          {/* Tooltip sang trọng */}
          <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none hidden sm:flex items-center gap-1.5">
            <Calculator size={13} className="text-violet-400" />
            <span>Máy tính Casio fx-580</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/95"></div>
          </div>
        </div>

        {/* Nút 2: Dịch thuật nhanh */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleWidget('translate')}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 relative overflow-hidden group-hover:scale-108 active:scale-95 cursor-pointer ${
              activeWidget === 'translate'
                ? 'bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 ring-4 ring-teal-300/80 scale-105 shadow-lg shadow-emerald-500/50'
                : 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 hover:from-emerald-300 hover:to-teal-500 shadow-md shadow-teal-500/35 hover:shadow-lg hover:shadow-teal-500/45'
            }`}
            aria-label="Dịch thuật nhanh"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-full"></span>
            
            {activeWidget === 'translate' ? (
              <X size={20} className="animate-in spin-in-90 duration-200" />
            ) : (
              <Languages size={20} className="transition-transform duration-300 group-hover:scale-115 group-hover:-rotate-6 drop-shadow-xs" />
            )}
          </button>
          
          <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none hidden sm:flex items-center gap-1.5">
            <Languages size={13} className="text-emerald-400" />
            <span>Dịch thuật song ngữ</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/95"></div>
          </div>
        </div>

        {/* Nút 3: Hỗ trợ & Chat với Admin */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleWidget('chat')}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 relative overflow-hidden group-hover:scale-108 active:scale-95 cursor-pointer ${
              activeWidget === 'chat'
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 ring-4 ring-blue-300/80 scale-105 shadow-lg shadow-blue-500/50'
                : 'bg-gradient-to-br from-blue-500 via-indigo-600 to-sky-600 hover:from-blue-400 hover:to-indigo-500 shadow-md shadow-blue-500/35 hover:shadow-lg hover:shadow-blue-500/45'
            }`}
            aria-label="Hỗ trợ & Chat với Admin"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-full"></span>
            
            {activeWidget === 'chat' ? (
              <X size={20} className="animate-in spin-in-90 duration-200" />
            ) : (
              <>
                <MessageSquare size={20} className="transition-transform duration-300 group-hover:scale-115 drop-shadow-xs" />
                {/* Radar beacon online */}
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border border-white shadow-xs"></span>
                </span>
              </>
            )}
          </button>
          
          <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-xl shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 pointer-events-none hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hỗ trợ trực tuyến 24/7</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/95"></div>
          </div>
        </div>
      </aside>
    </>
  )
}
