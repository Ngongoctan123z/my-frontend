export class PaymentError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}
export type GpmConfig = { enabled: boolean; secret: string; bank: string; accountNumber: string; accountName: string }
export async function rawPaymentBody(req: Request, limit = 32_768): Promise<string> {
  if (!req.body) throw new PaymentError(400, 'Thiếu dữ liệu.')
  const reader = req.body.getReader(), chunks: Uint8Array[] = []; let size = 0
  while (true) {
    const next = await reader.read(); if (next.done) break
    size += next.value.length
    if (size > limit) { await reader.cancel(); throw new PaymentError(413, 'Dữ liệu quá lớn.') }
    chunks.push(next.value)
  }
  const bytes = new Uint8Array(size); let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
export function parsePaymentJson(raw: string): any {
  try { const data = JSON.parse(raw); if (!data || typeof data !== 'object' || Array.isArray(data)) throw 0; return data } catch { throw new PaymentError(400, 'JSON không hợp lệ.') }
}
export async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
}
export async function verifyWebhook(raw: string, header: string | null, secret: string, now = Date.now()) {
  if (!secret || !header || header.length > 256) return false
  const fields = header.split(',').map(item => item.trim().split('='))
  if (fields.length !== 2 || fields.some(item => item.length !== 2) || new Set(fields.map(item => item[0])).size !== 2) return false
  const values = Object.fromEntries(fields), timestamp = Number(values.t)
  if (!/^\d{1,12}$/.test(values.t || '') || !Number.isSafeInteger(timestamp) || Math.abs(now / 1000 - timestamp) > 300 || !/^[a-f\d]{64}$/i.test(values.v1 || '')) return false
  const expected = await hmac(secret, `${values.t}.${raw}`)
  let difference = 0; for (let i = 0; i < 64; i++) difference |= expected.charCodeAt(i) ^ values.v1.toLowerCase().charCodeAt(i)
  return difference === 0
}
export function validateConfig(data: any, previousSecret = ''): GpmConfig {
  const secret = typeof data.secret === 'string' && data.secret ? data.secret.trim() : previousSecret
  const bank = String(data.bank || '').trim().toUpperCase(), accountNumber = String(data.accountNumber || '').trim(), accountName = String(data.accountName || '').trim()
  if (!/^[A-Z]{2,12}$/.test(bank) || !/^\d{3,30}$/.test(accountNumber) || !accountName || accountName.length > 100 || /[\r\n]/.test(accountName)) throw new PaymentError(400, 'Kiểm tra mã ngân hàng, số tài khoản và tên người nhận.')
  if (secret && (secret.length < 32 || secret.length > 256)) throw new PaymentError(400, 'Secret cần từ 32 đến 256 ký tự.')
  if (data.enabled === true && !secret) throw new PaymentError(400, 'Cần lưu Secret trước khi bật thanh toán.')
  return { enabled: data.enabled === true, secret, bank, accountNumber, accountName }
}
export function qrUrl(order: { bank: string; accountNumber: string; accountName: string; amount: number; code: string }) {
  return `https://img.vietqr.io/image/${order.bank}-${order.accountNumber}-compact2.png?${new URLSearchParams({ amount: String(order.amount), addInfo: order.code, accountName: order.accountName })}`
}
