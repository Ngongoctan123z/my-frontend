import type { SpeakingDelivery } from './speechDelivery'
import { getPromptsForPart, type SpeakingPrompt, type SpeakingPart } from '../data/speakingPrompts'

export type SpeakingExam = 'IELTS_SPEAKING' | 'TOEIC_SPEAKING'
export type PracticePart = 'PART_1' | 'PART_2' | 'PART_3' | 'Q1_2' | 'Q3_4' | 'Q5_7' | 'Q8_10' | 'Q11'
export type SpeakingTab = PracticePart | 'FULL'
export type SpeakingCatalog = Partial<Record<PracticePart, SpeakingPrompt[]>>
export type SpeakingQuestion = SpeakingPrompt & { part: PracticePart; questionNumber: number }
export type SpeakingMetrics = {
  totalDurationMs: number; speechDurationMs: number; pauseCount: number; longPauseCount: number
  totalPauseSec: number; signalDetected: boolean
}
export type SpeakingIssue = { title: string; explanation: string; original?: string; suggestion?: string }
export type SpeakingFeedback = {
  valid: true; assessmentStatus: 'audio_assessed' | 'content_only'; transcript: string
  feedback: string; strengths: string; issues: SpeakingIssue[]; modelAnswer?: string
  criteria: { id: string; label: string; score: number | null; max: number; explanation: string }[]
  score: { value: number; max: number; unit: string; estimated: true } | null
  fluency: { wordsPerMinute: number; fillerCount: number; repetitionCount: number; longPauseCount: number; speechSeconds: number }
  pronunciationNote: string; modelUsed?: string
}
export type SpeakingClip = { id: string; blob: Blob; metrics: SpeakingMetrics; createdAt: number; delivery?: SpeakingDelivery }
export type SpeakingSubmissionItem = { question: SpeakingQuestion; audioHash: string; metrics: SpeakingMetrics; delivery?: SpeakingDelivery }
export type SpeakingReport = {
  id: string; examType: SpeakingExam; mode: 'practice' | 'exam'; fullTest: boolean
  feedbackLang: string; createdAt: number; status: string
  items: { id: string; question: SpeakingQuestion; result: SpeakingFeedback | null; status: string; audioAvailable?: boolean; metrics?: SpeakingMetrics; delivery?: SpeakingDelivery }[]
}

export const SPEAKING_PARTS: Record<SpeakingExam, PracticePart[]> = {
  IELTS_SPEAKING: ['PART_1', 'PART_2', 'PART_3'],
  TOEIC_SPEAKING: ['Q1_2', 'Q3_4', 'Q5_7', 'Q8_10', 'Q11'],
}
export const PART_LABELS: Record<PracticePart, string> = {
  PART_1: 'Part 1', PART_2: 'Part 2', PART_3: 'Part 3',
  Q1_2: 'Câu 1–2', Q3_4: 'Câu 3–4', Q5_7: 'Câu 5–7', Q8_10: 'Câu 8–10', Q11: 'Câu 11',
}
export function canonicalPart(part: string): PracticePart {
  const aliases: Record<string, PracticePart> = { Q3: 'Q3_4', Q4_6: 'Q5_7', Q7_9: 'Q8_10', Q10_11: 'Q11' }
  return aliases[part] || part as PracticePart
}
export function fallbackCatalog(exam: SpeakingExam): SpeakingCatalog {
  return Object.fromEntries(SPEAKING_PARTS[exam].map(part => [part, getPromptsForPart(exam, part as SpeakingPart)]))
}
export function mergeCatalog(exam: SpeakingExam, remote?: SpeakingCatalog): SpeakingCatalog {
  const fallback = fallbackCatalog(exam)
  return Object.fromEntries(SPEAKING_PARTS[exam].map(part => {
    const rows = (remote?.[part] || []).filter(p => p && typeof p.id === 'string' && typeof p.questionEn === 'string' && p.questionEn.trim())
    return [part, [...rows, ...(fallback[part] || []).filter(p => !rows.some(row => row.id === p.id))]]
  }))
}
const withoutNumber = (text: string) => text.replace(/^(?:Question|Câu)\s*\d+\s*:\s*/i, '').trim()
function expand(prompt: SpeakingPrompt, part: PracticePart, start: number, full: boolean): SpeakingQuestion[] {
  let question = prompt.questionEn
  let informationText = prompt.informationText
  if (part === 'Q5_7' || part === 'Q8_10') {
    const match = question.match(/([\s\S]*?)\bQuestion\s+\d+\s*:\s*([\s\S]+)/i)
    if (match) { if (part === 'Q8_10') informationText = match[1].replace(/\*\*/g, '').trim(); question = match[2].trim() }
  }
  const count = part === 'Q5_7' || part === 'Q8_10' ? 3
    : part === 'PART_1' || part === 'PART_3' ? Math.min(4, 1 + (prompt.subQuestions?.length || 0)) : 1
  const questions = [question, ...(prompt.subQuestions || [])].slice(0, count)
  return questions.map((text, index) => {
    const number = start + index
    const prepTimeSec = part === 'PART_2' ? 60 : part === 'Q1_2' || part === 'Q3_4' || part === 'Q11' ? 45
      : part === 'Q5_7' || part === 'Q8_10' ? 3 : 0
    const speakTimeSec = part === 'PART_2' ? 120 : part === 'PART_3' ? 60 : part === 'PART_1' ? (full ? 40 : 45)
      : part === 'Q1_2' ? 45 : part === 'Q3_4' ? 30 : part === 'Q11' ? 60 : index === 2 ? 30 : 15
    return {
      ...prompt, id: `${prompt.id}:${part}:${number}`, part, questionNumber: number,
      questionEn: withoutNumber(text), questionVi: index === 0 ? prompt.questionVi.replace(/Câu\s*\d+\s*:/g, `Câu ${number}:`) : '',
      informationText, imageUrl: part === 'Q8_10' ? undefined : prompt.imageUrl,
      subQuestions: undefined, prepTimeSec, speakTimeSec, startGraceSec: 0,
      readingTimeSec: part === 'Q8_10' && index === 0 ? 45 : 0,
      repeatQuestion: part === 'Q8_10' && index === 2,
    }
  })
}

/** Build a real question queue; TOEIC groups expand to 2+2+3+3+1 questions. */
export function buildSpeakingSet(exam: SpeakingExam, tab: SpeakingTab, catalog = fallbackCatalog(exam), selectedId?: string, random = Math.random): SpeakingQuestion[] {
  // A successful database catalog is authoritative, including unpublished/deleted rows.
  const pools = Object.fromEntries(SPEAKING_PARTS[exam].map(part => [part, [...(catalog[part] || [])]])) as SpeakingCatalog
  if (tab === 'FULL') {
    // Individual admin questions remain available in practice; a full test needs
    // complete question groups and linked IELTS discussion topics.
    for (const part of ['PART_1', 'PART_3', 'Q5_7', 'Q8_10'] as PracticePart[]) {
      if (pools[part]) pools[part] = pools[part]!.filter(prompt => (prompt.subQuestions?.length || 0) >= (part === 'PART_1' || part === 'PART_3' ? 3 : 2))
    }
    if (exam === 'IELTS_SPEAKING') pools.PART_2 = pools.PART_2?.filter(prompt => prompt.setId && pools.PART_3?.some(discussion => discussion.setId === prompt.setId))
  }
  const pick = (part: PracticePart, id?: string) => {
    const pool = pools[part] || []
    return pool.find(p => p.id === id) || pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]
  }
  if (tab !== 'FULL') {
    const prompt = pick(tab, selectedId)
    if (!prompt) return []
    if (tab === 'Q1_2' || tab === 'Q3_4') {
      const pool = pools[tab] || []
      const second = pool.find(p => p.id !== prompt.id) || prompt
      return [prompt, second].flatMap((p, i) => expand(p, tab, (tab === 'Q1_2' ? 1 : 3) + i, false))
    }
    return expand(prompt, tab, tab === 'Q5_7' ? 5 : tab === 'Q8_10' ? 8 : tab === 'Q11' ? 11 : 1, false)
  }
  if (SPEAKING_PARTS[exam].some(part => !pools[part]?.length)) return []
  if (exam === 'TOEIC_SPEAKING') {
    const queue: SpeakingQuestion[] = []
    for (const [part, start] of [['Q1_2', 1], ['Q3_4', 3]] as const) {
      const first = pick(part)
      const second = (pools[part] || []).find(p => p.id !== first.id) || first
      queue.push(...expand(first, part, start, true), ...expand(second, part, start + 1, true))
    }
    queue.push(...expand(pick('Q5_7'), 'Q5_7', 5, true), ...expand(pick('Q8_10'), 'Q8_10', 8, true), ...expand(pick('Q11', selectedId), 'Q11', 11, true))
    return queue
  }
  const first = pick('PART_1')
  const second = (pools.PART_1 || []).find(p => p.id !== first.id) || first
  const intro = [...expand(first, 'PART_1', 1, true), ...expand(second, 'PART_1', 5, true)].slice(0, 6)
    .map((p, i) => ({ ...p, questionNumber: i + 1 }))
  const cue = pick('PART_2', selectedId)
  const discussion = (pools.PART_3 || []).find(p => cue.setId && p.setId === cue.setId) || pick('PART_3')
  return [...intro, ...expand(cue, 'PART_2', intro.length + 1, true), ...expand(discussion, 'PART_3', intro.length + 2, true)]
}

export function formatSpeakingTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}
export async function hashSpeakingAudio(blob: Blob): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}
