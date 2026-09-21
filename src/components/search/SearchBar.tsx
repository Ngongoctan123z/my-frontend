'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { getSuggestions } from '../../services/searchService'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(query, 200)
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
    router.push(`/?q=${encodeURIComponent(next)}`)
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <label className="sr-only" htmlFor="site-search">
        Tìm đề thi
      </label>
      <div className="border-line bg-page flex min-h-11 items-center rounded-xl border px-3">
        <Search size={18} className="text-ink-muted mr-2 shrink-0" />
        <input
          id="site-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit()
          }}
          placeholder="Tìm: Toán Nam Định 2024"
          className="h-11 w-full bg-transparent text-sm outline-none"
        />
      </div>
      {open && suggestions.length > 0 ? (
        <ul className="border-line bg-surface absolute top-full z-20 mt-2 w-full overflow-hidden rounded-xl border shadow-card">
          {suggestions.map((item) => (
            <li key={item}>
              <button
                type="button"
                className="hover:bg-page w-full px-4 py-2.5 text-left text-sm"
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
