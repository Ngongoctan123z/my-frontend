import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger'
  children: ReactNode
}

const variants = {
  primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
  accent: 'bg-[var(--color-accent)] text-white hover:opacity-90',
  ghost: 'bg-transparent text-ink border border-line hover:bg-page',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  return (
    <button
      type="button"
      className={`btn-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
