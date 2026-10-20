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
  authenticationBlocked = false
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

export interface KeyRotationOptions { provider?: string }

export async function createKeyRotation(
  apiKeys: string[], accountId: string, store: KeyRotationStore,
  nowOrOptions: (() => number) | KeyRotationOptions = Date.now, options: KeyRotationOptions = {},
) {
  const now = typeof nowOrOptions === 'function' ? nowOrOptions : Date.now
  const selectedOptions = typeof nowOrOptions === 'function' ? options : nowOrOptions
  const provider = selectedOptions.provider?.trim().toLowerCase() || 'groq'
  const keys = [...new Set(apiKeys.map(key => key.trim()).filter(Boolean))]
  if (!keys.length) throw new Error('GROQ_API_KEY_MISSING')
  if (!accountId.trim()) throw new Error('AI_ACCOUNT_MISSING')

  // Separate providers, without storing credentials, addresses or model names
  // in identifiers. Changed admin key lists receive a fresh atomic ring.
  const providerHash = await sha256Hex(provider)
  const poolHash = await sha256Hex(JSON.stringify([provider, keys]))
  const accountHash = await sha256Hex(accountId.trim().toLowerCase())
  const cursor = `GRADER_KEY_CURSOR_${poolHash}_${accountHash}`
  const indices = keys.map((_, index) => index)
  const keyHashes = await Promise.all(keys.map(key => sha256Hex(key)))
  // V1 cooldowns mixed authentication and model-specific rate limits. They
  // cannot safely be read as credential bans, so V2 starts separate health rows.
  const credentialKeys = keyHashes.map(hash => `AI_CREDENTIAL_COOLDOWN_V2_${providerHash}_${hash}`)
  const modelKeys = new Map<string, Promise<string[]>>()
  const rateKeysFor = (model: string) => {
    let existing = modelKeys.get(model)
    if (!existing) {
      existing = sha256Hex(model).then(hash => keyHashes.map(keyHash => `AI_MODEL_COOLDOWN_V2_${providerHash}_${hash}_${keyHash}`))
      modelKeys.set(model, existing)
    }
    return existing
  }

  await store.initialize(cursor, `GRADER_KEY_ASSIGN_${poolHash}`, keys.length)

  async function availability(excluded: Set<string> = new Set(), model?: string) {
    const rateKeys = model === undefined ? [] : await rateKeysFor(model)
    const cooldowns = await store.cooldowns([...credentialKeys, ...rateKeys])
    const currentTime = now()
    const until = (index: number) => Math.max(cooldowns.get(credentialKeys[index]) || 0,
      rateKeys[index] ? cooldowns.get(rateKeys[index]) || 0 : 0)
    const eligible = indices.filter(index => !excluded.has(keys[index]))
    const candidates = eligible.filter(index => until(index) <= currentTime)
    const waits = eligible.map(index => until(index) - currentTime).filter(wait => wait > 0)
    return {
      candidates,
      retryAfterSeconds: waits.length ? Math.max(1, Math.ceil(Math.min(...waits) / 1000)) : 60,
      authenticationBlocked: eligible.length > 0 && eligible.every(index => (cooldowns.get(credentialKeys[index]) || 0) > currentTime),
    }
  }

  return {
    keys,
    availability,
    async next(excluded: Set<string> = new Set(), model?: string): Promise<string> {
      const { candidates, retryAfterSeconds, authenticationBlocked } = await availability(excluded, model)
      if (!candidates.length) {
        const error = new KeyPoolExhaustedError(retryAfterSeconds)
        error.authenticationBlocked = authenticationBlocked
        throw error
      }
      const index = await store.claim(cursor, candidates[0], candidates)
      return keys[index]
    },
    async coolDown(key: string, milliseconds: number, model?: string) {
      const index = keys.indexOf(key)
      if (index < 0) return
      const cooldownKeys = model === undefined ? credentialKeys : await rateKeysFor(model)
      await store.coolDown(cooldownKeys[index], now() + milliseconds)
    },
  }
}

interface ProviderError {
  status?: number
  statusCode?: number
  code?: unknown
  message?: string
  headers?: { get?: (name: string) => string | null; [name: string]: unknown }
  error?: ProviderError
  response?: ProviderError
  details?: Array<{ retryDelay?: string | { seconds?: number | string; nanos?: number } }>
  retry_after?: number
  retry_after_ms?: number
}

function providerParts(error: unknown): ProviderError[] {
  if (!error || typeof error !== 'object') return [{ message: typeof error === 'string' ? error : '' }]
  const outer = error as ProviderError
  return [outer, outer.error, outer.response, outer.error?.error].filter((part): part is ProviderError => !!part && typeof part === 'object')
}

export function classifyProviderError(error: unknown): 'safety' | 'rate' | 'auth' | 'model' | 'transient' {
  const parts = providerParts(error)
  const message = parts.map(part => `${part.message || ''} ${typeof part.code === 'string' ? part.code : ''}`).join(' ').toLowerCase()
  const statuses = parts.flatMap(part => [part.status, part.statusCode, typeof part.code === 'number' ? part.code : undefined])
  if (/safety|blocked by|content_policy/.test(message)) return 'safety'
  if (/ai_output_invalid|json_validate_failed|json_generation_failed|model_not_found|model_decommissioned|model_permission_denied|model_access_denied|model.*(does not exist|no longer supported|not supported|not available|not permitted|not allowed|not authorized|not enabled|access denied)/.test(message)
    || statuses.includes(404)) return 'model'
  if (statuses.includes(429) || /quota|rate.?limit|resource_exhausted|\b429\b/.test(message)) return 'rate'
  if (statuses.includes(401) || statuses.includes(403)
    || /api_key_invalid|permission_denied|api key not valid|invalid_api_key|authentication|unauthorized/.test(message)) return 'auth'
  return 'transient'
}

export function retryAfterMilliseconds(error: unknown, now = Date.now()): number {
  const parts = providerParts(error)
  const clamp = (milliseconds: number) => Number.isFinite(milliseconds) && milliseconds > 0
    ? Math.min(86_400_000, Math.max(1000, milliseconds)) : 60_000
  for (const part of parts) {
    const headers = part.headers
    const header = typeof headers?.get === 'function' ? headers.get('retry-after')
      : headers && Object.entries(headers).find(([name]) => name.toLowerCase() === 'retry-after')?.[1]
    if ((typeof header === 'string' && header.trim()) || typeof header === 'number') {
      const seconds = Number(header)
      return clamp(Number.isFinite(seconds) ? seconds * 1000 : Date.parse(String(header)) - now)
    }
    if (typeof part.retry_after_ms === 'number') return clamp(part.retry_after_ms)
    if (typeof part.retry_after === 'number') return clamp(part.retry_after * 1000)
    for (const detail of Array.isArray(part.details) ? part.details : []) {
      const delay = detail?.retryDelay
      if (typeof delay === 'string' && /^\d+(?:\.\d+)?s$/.test(delay)) return clamp(Number(delay.slice(0, -1)) * 1000)
      if (delay && typeof delay === 'object') return clamp(Number(delay.seconds || 0) * 1000 + Number(delay.nanos || 0) / 1_000_000)
    }
    const hint = /try again in\s+([\d.]+)\s*(ms|s|m(?:in)?|h)\b/i.exec(part.message || '')
    if (hint) {
      const units: Record<string, number> = { ms: 1, s: 1000, m: 60_000, min: 60_000, h: 3_600_000 }
      return clamp(Number(hint[1]) * (units[hint[2].toLowerCase()] || 1000))
    }
  }
  return 60_000
}

// Every model may visit each eligible credential once. Rate limits belong to
// that provider/model pair; only invalid credentials block unrelated models.
export async function generateWithKeyRotation<T>(
  rotation: Awaited<ReturnType<typeof createKeyRotation>>,
  models: string[],
  generate: (apiKey: string, model: string) => Promise<T>,
  onAttempt: (apiKey: string) => Promise<void> = async () => {},
): Promise<{ result: T; usedKey: string; model: string }> {
  const selectedModels = [...new Set(models.map(model => model.trim()).filter(Boolean))]
  const rejectedKeys = new Set<string>()
  for (const model of selectedModels) {
    const attempted = new Set<string>()
    while (attempted.size < rotation.keys.length) {
      let apiKey: string
      try {
        apiKey = await rotation.next(attempted, model)
      } catch (error) {
        if (!(error instanceof KeyPoolExhaustedError)) throw error
        if (error.authenticationBlocked || rejectedKeys.size === rotation.keys.length) throw new Error('API_KEY_INVALID')
        // All credentials can be limited on one model while another model is
        // healthy. Continue even when this model began fully cooled down.
        break
      }
      attempted.add(apiKey)
      await onAttempt(apiKey)
      try {
        return { result: await generate(apiKey, model), usedKey: apiKey, model }
      } catch (error) {
        if (error && typeof error === 'object' && (error as { retryable?: boolean }).retryable === false) throw error
        const kind = classifyProviderError(error)
        if (kind === 'safety') throw error
        if (kind === 'rate') await rotation.coolDown(apiKey, retryAfterMilliseconds(error), model)
        if (kind === 'auth') {
          rejectedKeys.add(apiKey)
          await rotation.coolDown(apiKey, 5 * 60_000)
        }
        if (kind === 'model') break
      }
    }
  }
  if (rejectedKeys.size === rotation.keys.length) throw new Error('API_KEY_INVALID')
  // Inspect each eligible model without claiming an extra cursor slot. A
  // healthy-but-failing model is a provider/model failure, not a rate limit.
  const states = await Promise.all(selectedModels.map(model => rotation.availability(new Set(), model)))
  if (states.length && states.every(state => !state.candidates.length)) {
    if (states.every(state => state.authenticationBlocked)) throw new Error('API_KEY_INVALID')
    throw new KeyPoolExhaustedError(Math.min(...states.map(state => state.retryAfterSeconds)))
  }
  throw new Error('model_exhausted')
}
