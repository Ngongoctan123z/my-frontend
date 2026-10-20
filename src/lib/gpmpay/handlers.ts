import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { checkAdmin } from '@/src/lib/adminAccess'
import { checkRateLimit } from '@/src/lib/rateLimit'
import { paidPlan, PAYMENT_PLANS } from './plans'
import { PaymentError, parsePaymentJson, rawPaymentBody, validateConfig, verifyWebhook, qrUrl } from './core'
import { GpmStore, publicOrder, type PaymentDb } from './store'

const response = (data: any, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
async function run(work: () => Promise<Response>): Promise<Response> {
  try { return await work() } catch (error: any) {
    if (error instanceof PaymentError) return response({ error: error.message }, error.status)
    if (error?.message === 'Unauthorized') return response({ error: 'Vui lòng đăng nhập.' }, 401)
    if (error?.message === 'Forbidden') return response({ error: 'Bạn không có quyền truy cập.' }, 403)
    console.error('[GPMPay] Payment operation failed')
    return response({ error: 'Chưa xử lý được thanh toán. Vui lòng thử lại sau.' }, 503)
  }
}
async function store() { return new GpmStore((await getDb()).$client as unknown as PaymentDb) }
async function owner() { const session = await auth(); if (!session?.user?.email) throw new PaymentError(401, 'Vui lòng đăng nhập.'); return session.user.email }
function sameOrigin(req: Request) { const origin = req.headers.get('origin'); if (origin && origin !== new URL(req.url).origin) throw new PaymentError(403, 'Yêu cầu không hợp lệ.') }
function rate(key: string, maximum: number) { const result = checkRateLimit(key, maximum, 60_000); if (!result.allowed) throw new PaymentError(429, `Vui lòng thử lại sau ${result.retryAfterSeconds} giây.`) }

export async function getConfig() { return run(async () => { const config = await (await store()).config(); return response({ provider: 'gpmpay', ready: config.enabled && !!config.secret, plans: PAYMENT_PLANS }) }) }
export async function createCheckout(req: Request) {
  return run(async () => {
    sameOrigin(req); const email = await owner(); rate(`gpm:create:${email}`, 6)
    const body = parsePaymentJson(await rawPaymentBody(req, 4096))
    if (!paidPlan(body.plan) || typeof body.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.requestId)) throw new PaymentError(400, 'Gói hoặc mã yêu cầu không hợp lệ.')
    const payments = await store(), config = await payments.config()
    if (!config.enabled || !config.secret) throw new PaymentError(503, 'Thanh toán GPMPay đang được cấu hình. Vui lòng quay lại sau.')
    await payments.ensure(); const user = await payments.user(email), order = await payments.create(user, body.plan, body.requestId, config)
    return response({ order: { ...publicOrder(order), qrUrl: qrUrl(order) } })
  })
}
export async function getStatus(req: Request) {
  return run(async () => {
    const email = await owner(); rate(`gpm:status:${email}`, 30)
    const code = new URL(req.url).searchParams.get('code') || ''
    if (!/^VD[A-F0-9]{20}$/.test(code)) throw new PaymentError(400, 'Mã đơn hàng không hợp lệ.')
    const payments = await store(); await payments.ensure(); const user = await payments.user(email)
    const order = await payments.owned(code, user.id)
    return response({ order: { ...publicOrder(order), qrUrl: qrUrl(order) } })
  })
}
export async function webhookHealth() { return response({ provider: 'gpmpay', authentication: 'HMAC', message: 'Webhook endpoint. POST requires a valid signed request.' }) }
export async function receiveWebhook(req: Request) {
  return run(async () => {
    const raw = await rawPaymentBody(req), payments = await store(), config = await payments.config()
    if (!config.secret) throw new PaymentError(503, 'Chưa lưu Secret GPMPay trong quản trị website.')
    if (!await verifyWebhook(raw, req.headers.get('x-gpmpay-signature'), config.secret)) throw new PaymentError(401, 'Chữ ký webhook không hợp lệ hoặc đã hết hạn.')
    const data = parsePaymentJson(raw)
    if (data.test === true) {
      await payments.db.prepare("INSERT INTO system_config(key,value) VALUES('GPMPAY_LAST_TEST_AT',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(Date.now())).run()
      return response({ success: true, status: 'test' })
    }
    if (data.source !== 'REAL' || data.transferType !== 'in') return response({ success: true, status: 'ignored' })
    // Turning checkout off does not lose signed settlements for existing orders.
    await payments.ensure(); return response({ success: true, ...await payments.receive(data) })
  })
}
export async function adminGet() {
  return run(async () => {
    await checkAdmin(); const payments = await store(), config = await payments.config(); await payments.ensure()
    const [events, orders, test] = await Promise.all([
      payments.db.prepare('SELECT * FROM gpm_payment_event ORDER BY receivedAt DESC LIMIT 100').all(),
      payments.db.prepare('SELECT code,plan,amount,status,createdAt,expiresAt,paidAt FROM gpm_payment_order ORDER BY createdAt DESC LIMIT 100').all(),
      payments.db.prepare("SELECT value FROM system_config WHERE key='GPMPAY_LAST_TEST_AT'").first(),
    ])
    return response({ config: { enabled: config.enabled, bank: config.bank, accountNumber: config.accountNumber, accountName: config.accountName, secretConfigured: !!config.secret, secretFromEnvironment: !!process.env.GPMPAY_WEBHOOK_SECRET }, lastTestAt: Number(test?.value) || null, events: events.results || [], orders: orders.results || [] })
  })
}
export async function adminSave(req: Request) {
  return run(async () => {
    sameOrigin(req); await checkAdmin(); const payments = await store(), current = await payments.config(), body = parsePaymentJson(await rawPaymentBody(req, 4096))
    if (process.env.GPMPAY_WEBHOOK_SECRET && body.secret) throw new PaymentError(409, 'Secret đang lấy từ Cloudflare. Hãy đổi tại Cloudflare để tránh lệch cấu hình.')
    const config = validateConfig(body, current.secret)
    const stored = { ...config, secret: process.env.GPMPAY_WEBHOOK_SECRET ? '' : config.secret }
    await payments.db.prepare("INSERT INTO system_config(key,value) VALUES('GPMPAY_CONFIG',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(stored)).run()
    return response({ success: true, secretConfigured: !!config.secret })
  })
}
