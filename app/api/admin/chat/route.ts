import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/src/db'
import { chatMessages, users } from '@/src/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// Helper to check admin
async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) throw new Error('Unauthorized')

  const db = await getDb()
  const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)
  
  if (!user.length || user[0].role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

export async function GET(req: NextRequest) {
  try {
    await checkAdmin()
    const db = await getDb()
    
    // Fetch all messages ordered by time
    const allMessages = await db.select().from(chatMessages).orderBy(chatMessages.createdAt)
    
    // Group by userId
    const conversationsMap: Record<string, any[]> = {}
    allMessages.forEach(msg => {
      if (!conversationsMap[msg.userId]) {
        conversationsMap[msg.userId] = []
      }
      conversationsMap[msg.userId].push(msg)
    })

    // Format as array and sort by latest message time
    const conversations = Object.entries(conversationsMap).map(([userId, messages]) => {
      return {
        userId,
        messages
      }
    }).sort((a, b) => {
      const lastA = a.messages[a.messages.length - 1].createdAt
      const lastB = b.messages[b.messages.length - 1].createdAt
      return lastB - lastA
    })

    return NextResponse.json(conversations)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 })
  }
}
