const fs = require('fs');
let code = fs.readFileSync('app/api/ai-grader/route.ts', 'utf8');

code = code.replace(
  "import { systemConfigs, prompts as promptsTable, apiUsages } from '@/src/db/schema'\r\nimport { eq, sql } from 'drizzle-orm'",
  "import { systemConfigs, prompts as promptsTable, apiUsages, users } from '@/src/db/schema'\nimport { eq, sql } from 'drizzle-orm'"
).replace(
  "import { systemConfigs, prompts as promptsTable, apiUsages } from '@/src/db/schema'\nimport { eq, sql } from 'drizzle-orm'",
  "import { systemConfigs, prompts as promptsTable, apiUsages, users } from '@/src/db/schema'\nimport { eq, sql } from 'drizzle-orm'"
);

code = code.replace(
  /async function checkAndIncrementRateLimit[\s\S]*?return true\r?\n}/,
  `async function checkAndIncrementRateLimit(userId: string): Promise<{ allowed: boolean, limit: number }> {
  const db = await getDb()
  const today = new Date().toLocaleDateString('en-CA')
  
  let limit = 2
  const userRows = await db.select().from(users).where(eq(users.email, userId))
  if (userRows.length > 0) {
    const plan = userRows[0].plan
    if (plan === 'pro') limit = 200
    else if (plan === 'plus') limit = 50
  }

  const usages = await db.select().from(apiUsages).where(sql\`userId = \${userId} AND date = \${today}\`)
  const usage = usages[0]

  if (!usage) {
    await db.insert(apiUsages).values({ userId, date: today, count: 1 })
    return { allowed: true, limit }
  }

  if (usage.count >= limit) {
    return { allowed: false, limit }
  }

  await db.update(apiUsages).set({ count: usage.count + 1 }).where(sql\`userId = \${userId} AND date = \${today}\`)
  return { allowed: true, limit }
}`
);

code = code.replace(
  /const isAllowed = await checkAndIncrementRateLimit\(userId\)\r?\n[\s\S]*?\}\r?\n/,
  `const { allowed, limit } = await checkAndIncrementRateLimit(userId)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Bạn đã đạt giới hạn ' + limit + ' lần sử dụng AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai!' },
        { status: 429 }
      )
    }
`
);

code = code.replace(
  /export async function GET\(_req: NextRequest\) \{[\s\S]*?\}\r?\n\}/,
  `export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ count: 0, limit: 2, plan: 'free' })
    }

    const userId = session.user.email
    const db = await getDb()
    const today = new Date().toLocaleDateString('en-CA')

    const userRows = await db.select().from(users).where(eq(users.email, userId))
    let limit = 2
    let plan = 'free'
    if (userRows.length > 0) {
      plan = userRows[0].plan
      if (plan === 'pro') limit = 200
      else if (plan === 'plus') limit = 50
    }

    const usages = await db.select().from(apiUsages).where(sql\`userId = \${userId} AND date = \${today}\`)
    const count = usages[0]?.count || 0

    return NextResponse.json({ count, limit, plan })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ count: 0, limit: 2, plan: 'free' })
  }
}`
);

fs.writeFileSync('app/api/ai-grader/route.ts', code);
