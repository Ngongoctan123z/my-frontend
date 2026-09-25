'use client'

import React, { useState } from 'react'
import { Key, Eye, EyeOff } from 'lucide-react'
import { useAiKey } from '@/src/contexts/AiContext'

export function AiKeyInput() {
  const { apiKey, setApiKey } = useAiKey()
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="-mx-6 bg-surface px-6 py-2.5 shadow-sm md:-mx-10 md:px-10 rounded-b-xl">
      <div className="mx-auto max-w-5xl relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-[var(--color-primary)]" />
          <span className="font-semibold text-[13px] text-ink">API Key Gemini</span>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-primary)] hover:underline ml-2 hidden sm:inline-block"
          >
            Lấy key miễn phí →
          </a>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input 
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Dán API Key vào đây..."
              className="w-full h-8 px-3 pr-9 rounded-lg border border-line bg-page text-xs focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink transition-colors"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-[var(--color-primary)] hover:underline sm:hidden whitespace-nowrap"
          >
            Lấy key →
          </a>
        </div>
      </div>
    </div>
  )
}
