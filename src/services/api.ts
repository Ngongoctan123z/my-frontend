import { API_BASE } from '../utils/constants'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Default: cache GET requests for 60s on the server (ISR-style),
  // mutations (POST/PUT/DELETE) bypass cache automatically via `init` override.
  const isReadRequest = !init?.method || init.method === 'GET'
  const separator = path.includes('?') ? '&' : '?'
  const finalPath = isReadRequest ? `${path}${separator}_cb=3` : path
  const response = await fetch(`${API_BASE}${finalPath}`, {
    next: isReadRequest ? { revalidate: 60 } : undefined,
    cache: isReadRequest ? undefined : 'no-store',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = 'Không thể kết nối máy chủ'
    try {
      const body = (await response.json()) as { message?: string }
      message = body.message ?? message
    } catch {
      message = response.statusText || message
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
