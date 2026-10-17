import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { syncBankTransactions } from '@/src/lib/bankhook'
import { getDb } from '@/src/db'
import { users } from '@/src/db/schema'

const rootAdmins = ['ngongoctan282005@gmail.com']

export async function GET() {
  const session = await auth()
  if (!session?.user?.email || !rootAdmins.includes(session.user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await syncBankTransactions()
  const db = await getDb()
  const allUsers = await db.select().from(users)
  return NextResponse.json({ result, usersCount: allUsers.length })
}
