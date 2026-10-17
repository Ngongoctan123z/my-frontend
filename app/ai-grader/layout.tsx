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
      <div className="-mx-4 sm:mx-0 pb-6 md:pb-10">
        {children}
      </div>
    </>
  )
}
