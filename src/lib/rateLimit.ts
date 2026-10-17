/**
 * Lightweight in-memory rate-limiter for Cloudflare Workers / Next.js edge runtime.
 * Protects against rapid button clicking, spam, and prevents Cloudflare Error 1102 (CPU exceeded).
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Periodic cleanup of stale records every 60 seconds
let lastCleanup = Date.now()

function cleanupStaleRecords(now: number) {
  // Bảo vệ bộ nhớ Worker: nếu map vượt quá 1000 keys thì xóa sạch để giải phóng RAM
  if (rateLimitMap.size > 1000) {
    rateLimitMap.clear()
    lastCleanup = now
    return
  }
  if (now - lastCleanup < 30000) return
  lastCleanup = now
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

/**
 * Checks if a key has exceeded maxRequests within windowMs.
 * @returns { allowed: boolean, remaining: number, retryAfterSeconds: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 3000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now()
  cleanupStaleRecords(now)

  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: 0,
    }
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    retryAfterSeconds: 0,
  }
}
