'use client'

import React, { useState } from 'react'
import { CalculatorBubble } from '../floating/CalculatorBubble'
import { TranslateBubble } from '../floating/TranslateBubble'
import { ChatBubble } from '../floating/ChatBubble'
import { FloatingToolDock, type FloatingToolId } from '../floating/FloatingToolDock'

export function ChatWidget() {
  const [activeWidget, setActiveWidget] = useState<FloatingToolId | null>(null)

  return (
    <>
      {activeWidget && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-22 z-50">
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
