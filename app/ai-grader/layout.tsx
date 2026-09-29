import React from 'react'
import { AiBanner } from '@/src/components/ai-grader/AiBanner'

export default function AiGraderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AiBanner />
      <div className="pb-6 md:pb-10">
        {children}
      </div>
    </>
  )
}
