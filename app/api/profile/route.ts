import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { users, apiUsages } from '@/src/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.email
    const db = await getDb()
    
    const userRows = await db.select().from(users).where(eq(users.email, userId))
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const user = userRows[0]
    
    const today = new Date().toLocaleDateString('en-CA')
    const usages = await db.select().from(apiUsages).where(sql`userId = ${userId} AND date = ${today}`)
    const usageCount = usages[0]?.count || 0
    
    let limit = 2
    if (user.plan === 'pro') limit = 200
    else if (user.plan === 'plus') limit = 50

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      usageCount,
      limit
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
