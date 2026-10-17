import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { bankTransactions } from '@/src/db/schema'
import { syncBankTransactions } from '@/src/lib/bankhook'
import { desc, eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const session = await auth()
    const rootAdmins = ['ngongoctan282005@gmail.com']
    if (!session?.user?.email || !rootAdmins.includes(session.user.email)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Trigger sync first
    await syncBankTransactions()

    const db = await getDb()
    // Chỉ lấy những giao dịch tiền vào (cộng vào / IN)
    const txs = await db.select().from(bankTransactions)
      .where(eq(bankTransactions.direction, 'IN'))
      .orderBy(desc(bankTransactions.receivedAt))
      .limit(100)

    return NextResponse.json({ success: true, transactions: txs })
  } catch (error: any) {
    console.error('[Admin BankHook API] Lỗi:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
