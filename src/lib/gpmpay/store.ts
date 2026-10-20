import { PAYMENT_PLANS, type PaidPlan } from './plans'
import { PaymentError, type GpmConfig } from './core'
export type PaymentDb = { prepare: (query: string) => any; batch: (statements: any[]) => Promise<any[]> }
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS gpm_payment_order (code TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES user(id),requestId TEXT NOT NULL,plan TEXT NOT NULL CHECK(plan IN ('plus','pro')),amount INTEGER NOT NULL,bank TEXT NOT NULL,accountNumber TEXT NOT NULL,accountName TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',createdAt INTEGER NOT NULL,expiresAt INTEGER NOT NULL,paidAt INTEGER,UNIQUE(userId,requestId))`,
  `CREATE TABLE IF NOT EXISTS gpm_payment_event (id TEXT PRIMARY KEY,gateway TEXT NOT NULL,accountNumber TEXT NOT NULL,referenceCode TEXT NOT NULL,amount INTEGER NOT NULL,content TEXT NOT NULL,transactionAt INTEGER NOT NULL,receivedAt INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'received',orderCode TEXT,UNIQUE(gateway,accountNumber,referenceCode))`,
]
export type GpmOrder = { code: string; userId: string; requestId: string; plan: PaidPlan; amount: number; bank: string; accountNumber: string; accountName: string; status: string; createdAt: number; expiresAt: number; paidAt: number | null }
export class GpmStore {
  db: PaymentDb
  constructor(db: PaymentDb) { this.db = db }
  async ensure() { await this.db.batch(SCHEMA.map(query => this.db.prepare(query))) }
  async config(): Promise<GpmConfig> {
    const row = await this.db.prepare("SELECT value FROM system_config WHERE key='GPMPAY_CONFIG'").first()
    let saved: any = {}; try { saved = JSON.parse(row?.value || '{}') } catch { throw new PaymentError(503, 'Cấu hình GPMPay chưa hợp lệ.') }
    return { enabled: saved.enabled === true, secret: process.env.GPMPAY_WEBHOOK_SECRET?.trim() || saved.secret || '', bank: saved.bank || 'MB', accountNumber: saved.accountNumber || '0565683172', accountName: saved.accountName || 'NGO NGOC TAN' }
  }
  async user(email: string) {
    const user = await this.db.prepare('SELECT id,email,plan,planExpiresAt,status FROM user WHERE email=?').bind(email).first()
    if (!user) throw new PaymentError(404, 'Không tìm thấy tài khoản.')
    if (user.status !== 'active') throw new PaymentError(403, 'Tài khoản chưa được phép thanh toán.')
    return user
  }
  async order(code: string): Promise<GpmOrder | null> { return this.db.prepare('SELECT * FROM gpm_payment_order WHERE code=?').bind(code).first() }
  async owned(code: string, userId: string) { const order = await this.order(code); if (!order || order.userId !== userId) throw new PaymentError(404, 'Không tìm thấy đơn hàng của bạn.'); return order }
  async create(user: any, plan: PaidPlan, requestId: string, config: GpmConfig) {
    const existing = await this.db.prepare('SELECT * FROM gpm_payment_order WHERE userId=? AND requestId=?').bind(user.id, requestId).first() as GpmOrder | null
    if (existing) { if (existing.plan !== plan) throw new PaymentError(409, 'Mã yêu cầu đã được dùng cho gói khác.'); return existing }
    const now = Date.now(), active = user.plan !== 'free' && (!user.planExpiresAt || Number(user.planExpiresAt) > now)
    if (active && (!user.planExpiresAt || (user.plan === 'pro' && plan === 'plus'))) throw new PaymentError(409, 'Tài khoản đang có gói cao hơn hoặc không hết hạn. Vui lòng liên hệ hỗ trợ.')
    const code = 'VD' + crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()
    await this.db.prepare(`INSERT INTO gpm_payment_order(code,userId,requestId,plan,amount,bank,accountNumber,accountName,createdAt,expiresAt) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(userId,requestId) DO NOTHING`)
      .bind(code, user.id, requestId, plan, PAYMENT_PLANS[plan].amount, config.bank, config.accountNumber, config.accountName, now, now + 30 * 60_000).run()
    const order = await this.db.prepare('SELECT * FROM gpm_payment_order WHERE userId=? AND requestId=?').bind(user.id, requestId).first() as GpmOrder
    if (order.plan !== plan) throw new PaymentError(409, 'Mã yêu cầu đã được dùng cho gói khác.')
    return order
  }
  async receive(data: any) {
    const at = Date.parse(data.transactionDate)
    if (typeof data.id !== 'string' || !/^[\w-]{8,100}$/.test(data.id) || typeof data.gateway !== 'string' || !/^[A-Z0-9]{2,12}$/.test(data.gateway) || typeof data.accountNumber !== 'string' || !/^\d{3,30}$/.test(data.accountNumber)
      || typeof data.referenceCode !== 'string' || !data.referenceCode || data.referenceCode.length > 150 || !Number.isSafeInteger(data.transferAmount) || data.transferAmount <= 0
      || typeof data.content !== 'string' || data.content.length > 2000 || !Number.isFinite(at) || at > Date.now() + 300_000) throw new PaymentError(400, 'Giao dịch không hợp lệ.')
    await this.db.prepare(`INSERT OR IGNORE INTO gpm_payment_event(id,gateway,accountNumber,referenceCode,amount,content,transactionAt,receivedAt) VALUES(?,?,?,?,?,?,?,?)`)
      .bind(data.id, data.gateway, data.accountNumber, data.referenceCode, data.transferAmount, data.content, at, Date.now()).run()
    const event = await this.db.prepare('SELECT * FROM gpm_payment_event WHERE id=?').bind(data.id).first()
    if (!event || event.status !== 'received') return { status: 'duplicate' }
    // Reuse the persisted event on retry; never reinterpret a changed payload.
    const codes = [...new Set((event.content.toUpperCase().match(/VD[A-F0-9]{20}(?![A-F0-9])/g) || []) as string[])]
    const order = codes.length === 1 ? await this.order(codes[0]) : null
    if (!order || order.status !== 'pending' || order.bank !== event.gateway || order.accountNumber !== event.accountNumber || order.amount !== event.amount || event.transactionAt < order.createdAt - 120_000 || event.transactionAt > order.expiresAt) {
      await this.db.prepare("UPDATE gpm_payment_event SET status='unmatched' WHERE id=? AND status='received'").bind(data.id).run()
      return { status: 'unmatched' }
    }
    const now = Date.now(), duration = PAYMENT_PLANS[order.plan].days * 86_400_000
    await this.db.batch([
      this.db.prepare(`UPDATE user SET plan=?,planExpiresAt=CASE WHEN plan=? AND planExpiresAt>? THEN planExpiresAt+? ELSE ? END
       WHERE id=? AND status='active' AND (plan='free' OR (planExpiresAt IS NOT NULL AND planExpiresAt<=?) OR (planExpiresAt IS NOT NULL AND NOT (plan='pro' AND ?='plus')))
       AND EXISTS(SELECT 1 FROM gpm_payment_order WHERE code=? AND status='pending') AND EXISTS(SELECT 1 FROM gpm_payment_event WHERE id=? AND status='received')`)
       .bind(order.plan, order.plan, now, duration, now + duration, order.userId, now, order.plan, order.code, data.id),
      this.db.prepare(`UPDATE gpm_payment_order SET status=CASE WHEN changes()=1 THEN 'paid' ELSE 'review' END,paidAt=? WHERE code=? AND status='pending' AND EXISTS(SELECT 1 FROM gpm_payment_event WHERE id=? AND status='received')`).bind(now, order.code, data.id),
      this.db.prepare(`UPDATE gpm_payment_event SET status=(SELECT status FROM gpm_payment_order WHERE code=?),orderCode=? WHERE id=? AND status='received'`).bind(order.code, order.code, data.id),
    ])
    return { status: (await this.order(order.code))!.status }
  }
}
export function publicOrder(order: GpmOrder) { return { code: order.code, plan: order.plan, amount: order.amount, bank: order.bank, accountNumber: order.accountNumber, accountName: order.accountName, status: order.status === 'pending' && order.expiresAt < Date.now() ? 'expired' : order.status, expiresAt: order.expiresAt } }
