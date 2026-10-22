'use client'
import { useEffect, useRef } from 'react'

// Scroll only when the selected task changes, never on typing/timer/API usage updates.
// A pending change waits for async content and open overlays to finish first.
export function usePracticeNavigation(key: string, ready = true, blocked = false) {
  const target = useRef<HTMLDivElement>(null)
  const previous = useRef(key), pending = useRef(false), mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; previous.current = key; return }
    if (key !== previous.current) { previous.current = key; pending.current = true }
    if (!pending.current || !ready || blocked) return
    let frame = 0, cancelled = false
    const settle = () => {
      if (cancelled || !target.current || !target.current.isConnected) return
      if (document.querySelector('[aria-modal="true"],dialog[open]')) return
      const element = target.current
      let topInset = 16
      for (const header of document.querySelectorAll('header, [data-sticky-header]')) {
        const style = getComputedStyle(header), rect = header.getBoundingClientRect()
        if ((style.position === 'fixed' || style.position === 'sticky') && rect.top <= 1 && rect.bottom > 0) topInset = Math.max(topInset, rect.bottom + 16)
      }
      // Use immediate positioning: even a long five-picture task must expose Q6
      // on the very next paint, including reduced-motion and touch browsers.
      element.focus({ preventScroll: true })
      element.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' })
      window.scrollTo({ top: Math.max(0, window.scrollY + element.getBoundingClientRect().top - topInset), behavior: 'instant' })
      pending.current = false
    }
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(settle) })
    return () => { cancelled = true; cancelAnimationFrame(frame) }
  }, [key, ready, blocked])
  return target
}
