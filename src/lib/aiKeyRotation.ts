// Storage operations must be atomic: Workers and tabs share these cursors.
export interface KeyRotationStore {
  initialize(cursor: string, assignment: string, size: number): Promise<void>
  claim(key: string, initial: number, candidates: number[]): Promise<number>
  cooldowns(keys: string[]): Promise<Map<string, number>>
  coolDown(key: string, until: number): Promise<void>
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export function normalizeApiKeys(value: string): string[] {
  return [...new Set(value.split(',').map(key => key.trim()).filter(Boolean))]
}

export class KeyPoolExhaustedError extends Error {
  retryAfterSeconds: number
  constructor(retryAfterSeconds: number = 60) {
    super('AI_KEY_POOL_EXHAUSTED')
    this.retryAfterSeconds = retryAfterSeconds
  }
}

// Only validated integer indices enter this expression. The cursor key itself
// remains a bound SQL parameter in the store adapter.
export function claimValueSql(candidates: number[]): string {
  if (!candidates.length || candidates.some(index => !Number.isSafeInteger(index) || index < 0)) {
    throw new Error('Invalid key rotation candidates')
  }
  const sorted = [...new Set(candidates)].sort((a, b) => a - b)
  return `CASE ${sorted.map(index => `WHEN CAST("system_config"."value" AS INTEGER) < ${index} THEN ${index}`).join(' ')} ELSE ${sorted[0]} END`
}

export async function createKeyRotation(
  apiKeys: string[], accountId: string, store: KeyRotationStore, now = Date.now,
) {
  const keys = [...new Set(apiKeys.map(key => key.trim()).filter(Boolean))]
  if (!keys.length) throw new Error('GROQ_API_KEY_MISSING')
  if (!accountId.trim()) throw new Error('AI_ACCOUNT_MISSING')

  // A changed admin key list gets a fresh ring. Neither emails nor API keys
  // appear in database identifiers, logs or responses.
  const poolHash = await sha256Hex(JSON.stringify(keys))
  const accountHash = await sha256Hex(accountId.trim().toLowerCase())
  const cursor = `GRADER_KEY_CURSOR_${poolHash}_${accountHash}`
  const indices = keys.map((_, index) => index)
  const cooldownKeys = await Promise.all(keys.map(async key => `GRADER_KEY_COOLDOWN_${await sha256Hex(key)}`))

  // Assign a starting slot exactly once per account, even when its first
  // requests arrive concurrently on different Workers.
  await store.initialize(cursor, `GRADER_KEY_ASSIGN_${poolHash}`, keys.length)

  async function availability(excluded: Set<string> = new Set()) {
    const cooldowns = await store.cooldowns(cooldownKeys)
    const currentTime = now()
    const candidates = indices.filter(index => !excluded.has(keys[index])
      && (cooldowns.get(cooldownKeys[index]) || 0) <= currentTime)
    const waits = indices.filter(index => !excluded.has(keys[index]))
      .map(index => (cooldowns.get(cooldownKeys[index]) || currentTime) - currentTime)
      .filter(wait => wait > 0)
    return { candidates, retryAfterSeconds: waits.length ? Math.max(1, Math.ceil(Math.min(...waits) / 1000)) : 60 }
  }

  return {
    keys,
    availability,
    async next(excluded: Set<string> = new Set()): Promise<string> {
      const { candidates, retryAfterSeconds } = await availability(excluded)
      if (!candidates.length) throw new KeyPoolExhaustedError(retryAfterSeconds)
      const index = await store.claim(cursor, candidates[0], candidates)
      return keys[index]
    },
    async coolDown(key: string, milliseconds: number) {
      const index = keys.indexOf(key)
      if (index >= 0) await store.coolDown(cooldownKeys[index], now() + milliseconds)
    },
  }
}

interface ProviderError {
  status?: number
  message?: string
  headers?: { get?: (name: string) => string | null; [name: string]: unknown }
}

export function classifyProviderError(error: unknown): 'safety' | 'rate' | 'auth' | 'model' | 'transient' {
  const err = error as ProviderError
  const message = (err.message || '').toLowerCase()
  if (/safety|blocked|content_policy/.test(message)) return 'safety'
  if (err.status === 429 || /quota|rate.?limit|resource_exhausted|\b429\b/.test(message)) return 'rate'
  if (err.status === 401 || err.status === 403
    || /api_key_invalid|permission_denied|api key not valid|invalid_api_key|authentication|unauthorized/.test(message)) return 'auth'
  if (err.status === 404 || /model_not_found|model_decommissioned|model.*(does not exist|no longer supported)/.test(message)) return 'model'
  return 'transient'
}

export function retryAfterMilliseconds(error: unknown, now = Date.now()): number {
  const headers = (error as ProviderError).headers
  const header = typeof headers?.get === 'function' ? headers.get('retry-after') : headers?.['retry-after']
  if (typeof header !== 'string' || !header.trim()) return 60_000
  const seconds = Number(header)
  const milliseconds = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - now
  return Number.isFinite(milliseconds) && milliseconds > 0
    ? Math.min(86_400_000, Math.max(1000, milliseconds)) : 60_000
}

// Each model visits each eligible key at most once. A new model is tried only
// after the current model's key ring is exhausted; retries never spin forever.
export async function generateWithKeyRotation<T>(
  rotation: Awaited<ReturnType<typeof createKeyRotation>>,
  models: string[],
  generate: (apiKey: string, model: string) => Promise<T>,
  onAttempt: (apiKey: string) => Promise<void> = async () => {},
): Promise<{ result: T; usedKey: string; model: string }> {
  const rejectedKeys = new Set<string>()
  for (const model of [...new Set(models)]) {
    const attempted = new Set<string>()
    while (attempted.size < rotation.keys.length) {
      let apiKey: string
      try {
        apiKey = await rotation.next(attempted)
      } catch (error) {
        if (!(error instanceof KeyPoolExhaustedError)) throw error
        if (rejectedKeys.size === rotation.keys.length) throw new Error('API_KEY_INVALID')
        // A model failure must not hide the next model when all eligible keys
        // have already been attempted on this model.
        if (attempted.size) break
        throw error
      }
      attempted.add(apiKey)
      await onAttempt(apiKey)
      try {
        return { result: await generate(apiKey, model), usedKey: apiKey, model }
      } catch (error) {
        const kind = classifyProviderError(error)
        if (kind === 'safety') throw error
        if (kind === 'rate') await rotation.coolDown(apiKey, retryAfterMilliseconds(error))
        if (kind === 'auth') {
          rejectedKeys.add(apiKey)
          await rotation.coolDown(apiKey, 5 * 60_000)
        }
        if (kind === 'model') break
      }
    }
  }
  // Distinguish an unavailable pool from models that failed on healthy keys.
  // Do not reserve an extra cursor slot just to inspect availability.
  if (rejectedKeys.size === rotation.keys.length) throw new Error('API_KEY_INVALID')
  const available = await rotation.availability()
  if (!available.candidates.length) throw new KeyPoolExhaustedError(available.retryAfterSeconds)
  throw new Error('model_exhausted')
}
