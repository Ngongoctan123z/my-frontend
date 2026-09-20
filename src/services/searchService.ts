import { apiFetch } from './api'

export async function getSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return []
  return await apiFetch<string[]>(`/search/suggest?q=${encodeURIComponent(query)}`)
}
