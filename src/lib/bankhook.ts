import { getDb } from '@/src/db'
import { users, bankTransactions } from '@/src/db/schema'
import { eq, like, and } from 'drizzle-orm'

export async function syncBankTransactions() {
  try {
    const bankhookUrl = process.env.BANKHOOK_BASE_URL || 'https://bankhook-backend.onrender.com'
    const res = await fetch(`${bankhookUrl}/api/transactions?limit=50`, {
      headers: {
        'x-api-key': process.env.BANKHOOK_API_KEY || ''
      },
      next: { revalidate: 15 }
    })
    
    if (!res.ok) {
      console.error('[BankHook] Sync failed with status:', res.status)
      return { success: false, error: 'Failed to fetch from BankHook' }
    }

    const data = await res.json()
    const transactions = data.transactions || []

    const db = await getDb()

    for (const tx of transactions) {
      const txId = tx.transactionId || `fake_${tx.bank}_${tx.amount}_${new Date(tx.receivedAt).getTime()}_${tx.content?.replace(/\s+/g, '')}`
      
      try {
        await db.insert(bankTransactions).values({
          transactionId: txId,
          bank: tx.bank || 'UNKNOWN',
          direction: tx.direction === 'IN' || tx.direction === 'CREDIT' ? 'IN' : 'OUT',
          amount: tx.amount || 0,
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

    for (const tx of unmatchedTxs) {
      const memo = (tx.content || '').toUpperCase()
      const match = memo.match(/VNDOCS\s+(PLUS|PRO)\s+([A-Z0-9_\.\-]+)/)

      if (match) {
        const plan = match[1].toLowerCase() // "plus" hoặc "pro"
        const userPrefix = match[2].toLowerCase()
        const requiredAmount = plan === 'pro' ? 149000 : 50000

        if (tx.amount >= requiredAmount) {
          const userRows = await db.select().from(users).where(like(users.email, `${userPrefix}%`)).limit(1)
          
          if (userRows.length > 0) {
            const user = userRows[0]
            const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000

            await db.update(users)
              .set({
                plan: plan,
                planExpiresAt: new Date(expiresAt)
              })
              .where(eq(users.id, user.id))
            
            await db.update(bankTransactions)
              .set({ status: 'matched', matchedUserId: user.id })
              .where(eq(bankTransactions.id, tx.id))
            
            console.log(`[BankHook] Cấp gói ${plan.toUpperCase()} thành công cho user:`, user.email)
          }
        }
      }
    }

    return { success: true, count: transactions.length }
  } catch (err: any) {
    console.error('[BankHook] Sync error:', err)
    return { success: false, error: err.message }
  }
}
