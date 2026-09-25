import React from 'react'
import { AiBanner } from '@/src/components/ai-grader/AiBanner'
import { AiKeyInput } from '@/src/components/ai-grader/AiKeyInput'
import { AiProvider } from '@/src/contexts/AiContext'

export default function AiGraderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AiProvider>
      <div className="py-6 md:py-10 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        <div className="sticky top-14 md:top-16 z-40 space-y-4 bg-page/95 backdrop-blur py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <AiBanner />
          <AiKeyInput />
        </div>
        {children}
      </div>
    </AiProvider>
  )
}
