import { eq } from 'drizzle-orm'
import { getDb } from '@/src/db'
import { speakingPrompts } from '@/src/db/schema'
import { canonicalPart, fallbackCatalog, mergeCatalog, SPEAKING_PARTS, type SpeakingCatalog, type SpeakingExam } from '@/src/lib/speaking'

export async function loadSpeakingCatalog(exam: SpeakingExam) {
  const catalog: SpeakingCatalog = {}
  try {
    const db = await getDb()
    const rows = await db.select().from(speakingPrompts).where(eq(speakingPrompts.examType, exam)).limit(300)
    for (const row of rows) {
      if (!row.isPublished) continue
      const part = canonicalPart(row.part)
      if (!SPEAKING_PARTS[exam].includes(part)) continue
      try {
        const parseList = (value: string | null) => {
          const list = value ? JSON.parse(value) : []
          return Array.isArray(list) ? list.filter(v => typeof v === 'string').slice(0, 15) : []
        }
        const prompt = { ...row, part, examType: exam, setId: row.setId || undefined, cueCard: row.cueCard || undefined, imageUrl: row.imageUrl || undefined,
          subQuestions: parseList(row.subQuestions), suggestedVocabulary: parseList(row.suggestedVocabulary), criteria: parseList(row.criteria),
          difficulty: ['easy', 'medium', 'hard'].includes(row.difficulty) ? row.difficulty as 'easy' | 'medium' | 'hard' : 'medium' as const }
        ;(catalog[part] ||= []).push(prompt)
      } catch { /* A malformed admin row must not hide valid fallback prompts. */ }
    }
  } catch { return { catalog: fallbackCatalog(exam), source: 'fallback' } }
  return { catalog: mergeCatalog(exam, catalog), source: Object.keys(catalog).length ? 'database' : 'fallback' }
}
