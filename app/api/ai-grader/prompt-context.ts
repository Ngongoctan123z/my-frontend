import { getDb } from '@/src/db'
import { prompts } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { learnerPromptContent } from '@/src/lib/publicWritingPrompt'
import { TOEIC_PRIVATE_PICTURE_SETS } from '@/src/data/toeicWritingPrivate'

/** Restore reference data inside the server; never rely on a learner caption. */
export async function resolveGradingPrompt(type: string, content: string, promptId?: unknown, imageUrl?: unknown) {
  if (!['IELTS_TASK_1', 'TOPIK_53', 'HSK_5', 'TOEIC_PICTURE'].includes(type)) return null
  const db = await getDb()
  const rows = await db.select().from(prompts).where(eq(prompts.type, type))
  const row = typeof promptId === 'string' && promptId ? rows.find(item => item.id === promptId)
    : rows.find(item => learnerPromptContent(item.content) === learnerPromptContent(content) && (!imageUrl || item.imageUrl === imageUrl))
  if (!row) {
    if (type === 'TOEIC_PICTURE') {
      const fallback = TOEIC_PRIVATE_PICTURE_SETS.find(set => learnerPromptContent(JSON.stringify(set)) === learnerPromptContent(content))
      if (fallback) return { content: JSON.stringify(fallback), imageUrl: undefined, imageDescription: undefined }
    }
    return null
  }
  let parsed: any; try { parsed = JSON.parse(row.content) } catch {}
  return { content: row.content, imageUrl: row.imageUrl || undefined,
    imageDescription: typeof parsed?.imageDescription === 'string' ? parsed.imageDescription : typeof parsed?.context === 'string' ? parsed.context : undefined }
}
