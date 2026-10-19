'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
const loading=()=> <div role="status" className="flex h-80 w-[360px] max-w-[calc(100vw-24px)] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400 shadow-lg">Đang mở công cụ…</div>
const CalculatorBubble=dynamic(()=>import('../floating/CalculatorBubble').then(m=>m.CalculatorBubble),{loading})
const TranslateBubble=dynamic(()=>import('../floating/TranslateBubble').then(m=>m.TranslateBubble),{loading})
const ChatBubble=dynamic(()=>import('../floating/ChatBubble').then(m=>m.ChatBubble),{loading})
import { FloatingToolDock, type FloatingToolId } from '../floating/FloatingToolDock'

export function ChatWidget() {
  const [activeWidget, setActiveWidget] = useState<FloatingToolId | null>(null)

  return (
    <>
      {activeWidget && (
        <div className="fixed bottom-4 right-3 z-50 max-w-[calc(100vw-24px)] sm:bottom-6 sm:right-22">
          {activeWidget === 'calc' && <CalculatorBubble onClose={() => setActiveWidget(null)} />}
          {activeWidget === 'translate' && <TranslateBubble onClose={() => setActiveWidget(null)} />}
          {activeWidget === 'chat' && <ChatBubble onClose={() => setActiveWidget(null)} />}
        </div>
      )}
      <FloatingToolDock activeTool={activeWidget}
        onToggle={id => setActiveWidget(previous => previous === id ? null : id)}
        onDismiss={id => setActiveWidget(previous => previous === id ? null : previous)} />
    </>
  )
}
