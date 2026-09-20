import type { ReactNode } from 'react'

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
      {children}
    </span>
  )
}
