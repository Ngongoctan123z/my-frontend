import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  padding?: boolean
}

export function Card({ children, className = '', padding = true, ...props }: Props) {
  return (
    <div
      className={`bg-surface border-line rounded-2xl border shadow-card ${padding ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
