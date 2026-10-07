import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { bankTransactions } from '@/src/db/schema'
import { syncBankTransactions } from '@/src/lib/bankhook'
import { desc } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Trigger sync first
    await syncBankTransactions()

    const db = await getDb()
    const txs = await db.select().from(bankTransactions).orderBy(desc(bankTransactions.receivedAt)).limit(100)

    return NextResponse.json({ success: true, transactions: txs })
  } catch (error: any) {
    console.error('[Admin BankHook API] Lỗi:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
