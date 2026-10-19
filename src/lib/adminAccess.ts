import { auth } from '@/auth'
import { getDb } from '@/src/db'
import { users } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }
  
  const rootAdmins = [
    'ngongoctan282005@gmail.com',
    'ngotan1911@gmail.com',
    'ngongoctan432005@gmail.com',
    'admin@vndocs.net'
  ]
  if (rootAdmins.includes(session.user.email)) {
    return true
  }

  const db = await getDb()
  const userList = await db.select().from(users).where(eq(users.email, session.user.email))
  if (userList.length > 0 && userList[0].role === 'admin') {
    return true
  }

  throw new Error('Forbidden')
}

