import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
  children: ReactNode
}

const variants = {
  primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--color-secondary)] text-white hover:opacity-90',
  accent: 'bg-[var(--color-accent)] text-white hover:opacity-90',
  ghost: 'bg-transparent text-ink border border-line hover:bg-page',
  danger: 'bg-[var(--color-danger)] text-white hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
