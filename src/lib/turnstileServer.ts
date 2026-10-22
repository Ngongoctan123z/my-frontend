import { getCloudflareContext } from '@opennextjs/cloudflare'

// Only the public site key can cross the server/client boundary.
export function turnstileConfiguration(env: Record<string, unknown>) {
  const siteKey = typeof env.TURNSTILE_SITE_KEY === 'string' ? env.TURNSTILE_SITE_KEY.trim() : typeof env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === 'string' ? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.trim() : ''
  const secret = typeof env.TURNSTILE_SECRET_KEY === 'string' ? env.TURNSTILE_SECRET_KEY.trim() : ''
  const realKey = (value: string) => value.length >= 10 && !/^\dx0{8,}/i.test(value)
  return { siteKey: realKey(siteKey) && realKey(secret) ? siteKey : null }
}
export async function getTurnstileConfiguration() {
  let env: Record<string, unknown> = process.env
  try { const context = await getCloudflareContext(); env = { ...env, ...context.env } } catch {}
  return turnstileConfiguration(env)
}
