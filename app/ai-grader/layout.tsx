import React from 'react'
import { AiBanner } from '@/src/components/ai-grader/AiBanner'
import { AiProvider } from '@/src/contexts/AiContext'

export default function AiGraderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AiProvider>
      <div className="pb-6 md:pb-10 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        <AiBanner />
        <div className="pt-2">
          {children}
        </div>
      </div>
    </AiProvider>
  )
}
