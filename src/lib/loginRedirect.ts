export function safeLoginRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return '/'
  try {
    const url = new URL(value,'https://vndocs.net')
    return url.origin === 'https://vndocs.net' ? url.pathname + url.search + url.hash : '/'
  } catch { return '/' }
}
