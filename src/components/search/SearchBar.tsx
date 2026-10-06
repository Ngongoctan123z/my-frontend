'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { getSuggestions } from '../../services/searchService'
import { getSmartRoute } from '../../utils/searchRouting'

export function SearchBar({ isEn = false }: { isEn?: boolean }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(query, 350)
  const router = useRouter()
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    if (!debounced.trim()) {
      setSuggestions([])
      return
    }
    getSuggestions(debounced).then((items) => {
      if (!cancelled) setSuggestions(items)
    })
    return () => {
      cancelled = true
    }
  }, [debounced])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submit = (value = query) => {
    const next = value.trim()
    if (!next) return
    setOpen(false)
    router.push(getSmartRoute(next))
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <label className="sr-only" htmlFor="site-search">Tìm đề thi</label>
      <div className="flex h-9 items-center rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 transition-all focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-blue-500/10">
        <Search size={14} className="shrink-0 mr-2 text-[var(--text-tertiary)]" />
        <input
          id="site-search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder={isEn ? "Search tools & exams..." : "Tìm: Toán Nam Định 2024"}
          className="h-full w-full bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
        />
      </div>
      {open && suggestions.length > 0 ? (
        <ul className="absolute top-full z-20 mt-1.5 w-full overflow-hidden rounded-[6px] border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          {suggestions.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
                onClick={() => submit(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
