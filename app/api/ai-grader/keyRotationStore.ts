import { eq, inArray, sql } from 'drizzle-orm'
import { getDb } from '@/src/db'
import { systemConfigs } from '@/src/db/schema'
import { claimValueSql, type KeyRotationStore } from '@/src/lib/aiKeyRotation'

export function createDbKeyRotationStore(db: Awaited<ReturnType<typeof getDb>>): KeyRotationStore {
  return {
    async initialize(cursor, assignment, size) {
      const rows = await db.select({ value: systemConfigs.value }).from(systemConfigs).where(eq(systemConfigs.key, cursor))
      if (rows.length) return
      // D1 batch runs as a transaction. Recheck account existence inside it so
      // concurrent first requests cannot consume multiple assignment slots.
      await db.batch([
        db.insert(systemConfigs).values({ key: assignment, value: '0' })
          .onConflictDoUpdate({ target: systemConfigs.key, set: {
            value: sql`CASE WHEN EXISTS (SELECT 1 FROM ${systemConfigs} WHERE ${systemConfigs.key} = ${cursor})
              THEN ${systemConfigs.value} ELSE (CAST(${systemConfigs.value} AS INTEGER) + 1) % ${size} END`,
          } }),
        db.insert(systemConfigs).values({ key: cursor,
          value: sql`(SELECT (CAST(${systemConfigs.value} AS INTEGER) + ${size} - 1) % ${size}
            FROM ${systemConfigs} WHERE ${systemConfigs.key} = ${assignment})`,
        }).onConflictDoNothing(),
      ])
    },
    async claim(key, initial, candidates) {
      // One UPSERT + RETURNING prevents duplicate reservations caused by
      // read-then-write races across requests or Cloudflare Worker instances.
      const rows = await db.insert(systemConfigs).values({ key, value: String(initial) })
        .onConflictDoUpdate({ target: systemConfigs.key, set: { value: sql.raw(claimValueSql(candidates)) } })
        .returning({ value: systemConfigs.value })
      const index = Number(rows[0]?.value)
      if (!candidates.includes(index)) throw new Error('AI_KEY_ROTATION_FAILED')
      return index
    },
    async cooldowns(keys) {
      const rows = await db.select({ key: systemConfigs.key, value: systemConfigs.value })
        .from(systemConfigs).where(inArray(systemConfigs.key, keys))
      return new Map(rows.map(row => [row.key, Number(row.value) || 0]))
    },
    async coolDown(key, until) {
      await db.insert(systemConfigs).values({ key, value: String(until) })
        .onConflictDoUpdate({ target: systemConfigs.key,
          set: { value: sql`MAX(CAST(${systemConfigs.value} AS INTEGER), ${until})` } })
    },
  }
}
