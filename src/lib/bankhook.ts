import { getDb } from '@/src/db'
import { users, bankTransactions } from '@/src/db/schema'
import { eq, and } from 'drizzle-orm'

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

let lastSyncTimestamp = 0
let isSyncing = false

export async function syncBankTransactions() {
  const now = Date.now()
  // Tránh spam click và quá tải CPU: không chạy lại sync nếu vừa chạy cách đây < 15 giây hoặc đang có sync
  if (now - lastSyncTimestamp < 15000 || isSyncing) {
    return { success: true, throttled: true }
  }

  isSyncing = true
  lastSyncTimestamp = now

  try {
    const bankhookUrl = process.env.BANKHOOK_BASE_URL || 'https://bankhook-backend.onrender.com'
    const bankhookApiKey = process.env.BANKHOOK_API_KEY || ''
    const webhookSecret = process.env.BANKHOOK_WEBHOOK_SECRET || ''
    const timestamp = Date.now()

      // Tạo HMAC signature để bankhook backend xác thực request đến từ mình
      let requestSignature = ''
      if (webhookSecret) {
        requestSignature = await hmacSha256(webhookSecret, `${timestamp}:${bankhookApiKey}`)
      }

      const res = await fetch(`${bankhookUrl}/api/transactions?limit=50&t=${timestamp}`, {
        headers: {
          'x-api-key': bankhookApiKey,
          ...(requestSignature ? { 'x-signature': requestSignature, 'x-timestamp': String(timestamp) } : {})
        },
        cache: 'no-store'
      })
      
      let transactions = []
      
      if (!res.ok) {
        console.error('[BankHook] Sync failed with status:', res.status)
        // Don't return early! Proceed to process unmatched transactions from DB
      } else {
        // Verify response signature nếu server trả về (bảo vệ khỏi MITM)
        const responseSignatureHeader = res.headers.get('x-response-signature')
        const responseBody = await res.text()

        if (webhookSecret && responseSignatureHeader) {
          const expectedSig = await hmacSha256(webhookSecret, responseBody)
          if (expectedSig !== responseSignatureHeader) {
            console.error('[BankHook] ❌ Response signature mismatch! Possible MITM attack. Aborting sync.')
            return { success: false, error: 'Invalid response signature' }
          }
        }

        try {
          const data = JSON.parse(responseBody)
          transactions = data.transactions || []
        } catch {
          console.error('[BankHook] Failed to parse response JSON')
        }
        console.log('[BankHook] Fetched transactions:', transactions.length)
      }

      const db = await getDb()

      for (const tx of transactions) {
        // === STRICT VALIDATION: bỏ qua mọi transaction không hợp lệ ===
        if (
          typeof tx.amount !== 'number' || tx.amount <= 0 ||
          typeof tx.content !== 'string' ||
          !tx.transactionId  // Yêu cầu transactionId thật từ ngân hàng
        ) {
          console.warn('[BankHook] Skipping invalid transaction (missing required fields):', tx)
          continue
        }

        // CHỈ NHẬN GIAO DỊCH TIỀN VÀO (CỘNG TIỀN VÀO / IN), BỎ QUA GIAO DỊCH TRỪ TIỀN (-)
        const dir = String(tx.direction || '').toUpperCase()
        const isIncoming = dir === 'IN' || dir === 'CREDIT' || dir === 'RECEIVE' || dir === 'CR'
        if (!isIncoming) {
          continue
        }

        // Chỉ chấp nhận transaction trong 48h gần nhất (chống replay cũ)
        if (tx.receivedAt) {
          const txAge = Date.now() - new Date(tx.receivedAt).getTime()
          if (txAge > 48 * 60 * 60 * 1000) {
            console.warn('[BankHook] Skipping stale transaction older than 48h:', tx.transactionId)
            continue
          }
        }

        const txId = tx.transactionId
        
        try {
          await db.insert(bankTransactions).values({
            transactionId: txId,
            bank: tx.bank || 'UNKNOWN',
            direction: 'IN',
            amount: Math.abs(tx.amount) || 0,
            currency: tx.currency || 'VND',
            content: tx.content || '',
            referenceCode: tx.referenceCode || null,
            receivedAt: tx.receivedAt ? new Date(tx.receivedAt) : new Date(),
            syncedAt: new Date(),
            status: 'unmatched'
          }).onConflictDoNothing({ target: bankTransactions.transactionId })
        } catch (e) {
          console.error('[BankHook] Insert transaction error:', e)
        }
      }

      const unmatchedTxs = await db.select().from(bankTransactions).where(
        and(
          eq(bankTransactions.status, 'unmatched'),
          eq(bankTransactions.direction, 'IN')
        )
      )

      // Query users một lần duy nhất nếu có transaction chưa khớp (tiết kiệm CPU & D1 queries)
      const allUsers = unmatchedTxs.length > 0 ? await db.select().from(users) : []

      for (const tx of unmatchedTxs) {
        const memo = (tx.content || '').toLowerCase()
        const cleanMemo = memo.replace(/[^a-z0-9]/g, '')
        const match = cleanMemo.match(/vndocs(plus|pro)(.*)/)

        if (match) {
          const plan = match[1] // "plus" hoặc "pro"
          const normId = match[2] // vd: ngongoctangmailcom
          const requiredAmount = plan === 'pro' ? 149000 : 50000

          if (tx.amount >= requiredAmount && normId.length >= 5) {
            const matchedUser = allUsers.find(u => {
              if (!u.email) return false
              const normEmail = u.email.replace(/[^a-z0-9]/ig, '').toLowerCase()
              return normEmail === normId || normId.includes(normEmail) || normEmail.startsWith(normId)
            })
          
          if (matchedUser) {
            const user = matchedUser
            const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000

            // Don't downgrade: nếu user đang là PRO thì không cấp lại PLUS
            const planPriority: Record<string, number> = { free: 0, plus: 1, pro: 2 }
            const currentPriority = planPriority[user.plan || 'free'] ?? 0
            const newPriority = planPriority[plan] ?? 0
            
            if (newPriority >= currentPriority) {
              await db.update(users)
                .set({
                  plan: plan,
                  planExpiresAt: new Date(expiresAt)
                })
                .where(eq(users.id, user.id))
              console.log(`[BankHook] Cấp gói ${plan.toUpperCase()} thành công cho user:`, user.email)
            } else {
              console.log(`[BankHook] Bỏ qua - user ${user.email} đang ở gói cao hơn (${user.plan} > ${plan})`)
            }
            
            await db.update(bankTransactions)
              .set({ status: 'matched', matchedUserId: user.id })
              .where(eq(bankTransactions.id, tx.id))
          }
        }
      }
    }

    return { success: true, count: transactions.length }
  } catch (err: any) {
    console.error('[BankHook] Sync error:', err)
    return { success: false, error: err.message }
  } finally {
    isSyncing = false
  }
}
