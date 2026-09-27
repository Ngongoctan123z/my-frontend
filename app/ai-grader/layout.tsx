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
      <AiBanner />
      <div className="pb-6 md:pb-10">
        {children}
      </div>
    </AiProvider>
  )
}
