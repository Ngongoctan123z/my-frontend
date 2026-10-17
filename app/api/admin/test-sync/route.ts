import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { syncBankTransactions } from '@/src/lib/bankhook'
import { getDb } from '@/src/db'
import { bankTransactions, users } from '@/src/db/schema'
import { desc, eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic';

const rootAdmins = ['ngongoctan282005@gmail.com']

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email || !rootAdmins.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const syncRes = await syncBankTransactions()
    const db = await getDb()
    const txs = await db.select().from(bankTransactions).orderBy(desc(bankTransactions.receivedAt)).limit(5)
    
    // Also fetch the specific user to see if their plan is updated
    const userRows = await db.select().from(users).where(eq(users.email, session.user.email))

    // Fetch unmatched IN transactions
    const unmatchedTxs = await db.select().from(bankTransactions).where(
      and(
        eq(bankTransactions.status, 'unmatched'),
        eq(bankTransactions.direction, 'IN')
      )
    )

    const debugLogs: string[] = []
    for (const tx of unmatchedTxs) {
      const memo = (tx.content || '').toLowerCase()
      const cleanMemo = memo.replace(/[^a-z0-9]/g, '')
      const match = cleanMemo.match(/vndocs(plus|pro)(.*)/)
      
      debugLogs.push(`tx: ${tx.id}, content: ${tx.content}, clean: ${cleanMemo}, match: ${!!match}`)

      if (match) {
        const plan = match[1]
        const normId = match[2]
        const requiredAmount = plan === 'pro' ? 149000 : 50000
        debugLogs.push(`  -> plan: ${plan}, normId: ${normId}, amt: ${tx.amount} >= ${requiredAmount}`)

        if (tx.amount >= requiredAmount && normId.length >= 5) {
          const allUsers = await db.select().from(users)
          const matchedUser = allUsers.find(u => {
            if (!u.email) return false
            const normEmail = u.email.replace(/[^a-z0-9]/ig, '').toLowerCase()
            return normEmail === normId || normId.includes(normEmail) || normEmail.startsWith(normId)
          })
          
          if (matchedUser) {
            debugLogs.push(`  -> MATCHED user: ${matchedUser.email}`)
          } else {
            debugLogs.push(`  -> NO USER MATCHED`)
          }
        }
      }
    }

    return NextResponse.json({
      syncRes,
      debugLogs,
      latestTxs: txs,
      user: userRows[0] || null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
