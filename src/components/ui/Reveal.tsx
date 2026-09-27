'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

type AnimationType = 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'bounce-in' | 'flip-up'

interface RevealProps {
  children: ReactNode
  animation?: AnimationType
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

const animationStyles: Record<AnimationType, { from: string; to: string }> = {
  'fade-up': {
    from: 'opacity-0 translate-y-8',
    to: 'opacity-100 translate-y-0',
  },
  'fade-down': {
    from: 'opacity-0 -translate-y-8',
    to: 'opacity-100 translate-y-0',
  },
  'slide-left': {
    from: 'opacity-0 -translate-x-12',
    to: 'opacity-100 translate-x-0',
  },
  'slide-right': {
    from: 'opacity-0 translate-x-12',
    to: 'opacity-100 translate-x-0',
  },
  'zoom-in': {
    from: 'opacity-0 scale-90',
    to: 'opacity-100 scale-100',
  },
  'bounce-in': {
    from: 'opacity-0 scale-75',
    to: 'opacity-100 scale-100',
  },
  'flip-up': {
    from: 'opacity-0 rotate-x-12 translate-y-4',
    to: 'opacity-100 rotate-x-0 translate-y-0',
  },
}

export function Reveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const styles = animationStyles[animation]

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] ease-out ${isVisible ? styles.to : styles.from} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/** Stagger children — each child gets a sequential delay */
export function StaggerReveal({
  children,
  animation = 'fade-up',
  baseDelay = 0,
  stagger = 100,
  duration = 500,
  className = '',
}: {
  children: ReactNode[]
  animation?: AnimationType
  baseDelay?: number
  stagger?: number
  duration?: number
  className?: string
}) {
  return (
    <>
      {children.map((child, i) => (
        <Reveal
          key={i}
          animation={animation}
          delay={baseDelay + i * stagger}
          duration={duration}
          className={className}
        >
          {child}
        </Reveal>
      ))}
    </>
  )
}
