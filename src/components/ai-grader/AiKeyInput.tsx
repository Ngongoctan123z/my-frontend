'use client'

import React, { useState } from 'react'
import { Key, Eye, EyeOff } from 'lucide-react'
import { useAiKey } from '@/src/contexts/AiContext'

export function AiKeyInput() {
  const { apiKey, setApiKey } = useAiKey()
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="bg-surface border border-line rounded-xl p-5 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-ink flex items-center gap-2">
          <Key className="w-4 h-4 text-[var(--color-primary)]" /> API Key Gemini
        </h3>
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
        >
          Lấy key miễn phí tại đây 
          <span className="text-[10px]">→</span>
        </a>
      </div>
      <div className="relative">
        <input 
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Dán API Key của bạn vào đây..."
          className="w-full h-11 px-4 pr-12 rounded-lg border border-line bg-page text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-shadow"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink transition-colors"
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[11px] text-ink-muted mt-2">
        Key được lưu trên trình duyệt của bạn, không gửi lên server lưu trữ. API Key này sẽ dùng chung cho tất cả công cụ AI.
      </p>
    </div>
  )
}
