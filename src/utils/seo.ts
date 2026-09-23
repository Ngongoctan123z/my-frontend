import { useEffect } from 'react'

export function useSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = title
    if (!description) return
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)
  }, [title, description])
}

export function setJsonLd(id: string, data: Record<string, unknown> | null) {
  if (typeof document === 'undefined') return
  const existing = document.getElementById(id)
  if (existing) existing.remove()
  if (!data) return
  const script = document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.text = JSON.stringify(data)
  document.head.appendChild(script)
}
