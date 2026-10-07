import { NextResponse } from 'next/server'
import { syncBankTransactions } from '@/src/lib/bankhook'
import { getDb } from '@/src/db'
import { users } from '@/src/db/schema'

export async function GET() {
  const result = await syncBankTransactions()
  const db = await getDb()
  const allUsers = await db.select().from(users)
  return NextResponse.json({ result, users: allUsers })
}
