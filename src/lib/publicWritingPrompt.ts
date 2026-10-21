// Learner payloads are built from public fields, never by spreading database rows.
const privateHeading = /^\s*(?:#{1,6}\s*)?(?:\[|【)?(?:ai\s*context|context(?:\s+(?:for|to)\s+(?:ai|grading))?|image\s*description(?:\s*\(.*?\))?|chart\s*extra|grading\s*(?:context|notes)|thông tin (?:cho ai|chấm điểm)|ngữ cảnh (?:cho ai|chấm điểm)|mô tả (?:ảnh|biểu đồ) (?:cho ai|để chấm)|dữ liệu (?:cho ai|chấm điểm))(?:\]|】)?\s*[:：]?\s*$/i
export function learnerText(value: unknown): string {
  if (typeof value !== 'string') return ''
  const lines = value.split(/\r?\n/), output: string[] = []
  for (const line of lines) {
    if (privateHeading.test(line) || /^\s*(?:AI\s*context|Context(?:\s+for\s+AI)?|Image\s*description|Chart\s*extra|Grading\s*notes)\s*[:：]/i.test(line)) break
    output.push(line)
  }
  return output.join('\n').trim()
}
const text = (value: unknown) => typeof value === 'string' ? learnerText(value) : ''
const image = (value: unknown) => typeof value === 'string' && (/^https:\/\//i.test(value) || /^\/(?!\/)/.test(value) || /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)) ? value : undefined
export function learnerPromptContent(content: unknown): string {
  if (typeof content !== 'string') return ''
  let parsed: any
  try { parsed = JSON.parse(content) } catch { return learnerText(content) }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return ''
  if (Array.isArray(parsed.questions)) return JSON.stringify({ title: text(parsed.title), questions: parsed.questions.map((q: any) => ({ id: q.id, imageUrl: image(q.imageUrl), keywords: Array.isArray(q.keywords) ? q.keywords.filter((word: any) => typeof word === 'string') : [] })) })
  if (Array.isArray(parsed.part1) && parsed.part2 && parsed.part3) return JSON.stringify({
    title: text(parsed.title),
    part1: parsed.part1.map((q: any) => ({ id: q.id, words: text(q.words) })),
    part2: { id: parsed.part2.id, keywords: Array.isArray(parsed.part2.keywords) ? parsed.part2.keywords.filter((word: unknown) => typeof word === 'string') : [], requirement: text(parsed.part2.requirement) },
    part3: { id: parsed.part3.id, imageUrl: image(parsed.part3.imageUrl), requirement: text(parsed.part3.requirement) },
  })
  return [parsed.title, parsed.topic, parsed.text || parsed.content || parsed.prompt || parsed.question, parsed.instructions].map(text).filter((value, index, values) => value && values.indexOf(value) === index).join('\n\n')
}
export function learnerPrompt<T extends { id?: unknown; content: string; imageUrl?: unknown }>(row: T) {
  let parsed: any; try { parsed = JSON.parse(row.content) } catch {}
  const source = parsed?.source
  return { ...(typeof row.id === 'string' ? { id: row.id } : {}), content: learnerPromptContent(row.content), imageUrl: image(row.imageUrl) || image(parsed?.imageUrl) || null,
    ...(source && typeof source.url === 'string' ? { source: { title: text(source.title), url: source.url, publisher: text(source.publisher), documentUrl: typeof source.documentUrl === 'string' ? source.documentUrl : undefined, pdfPage: typeof source.pdfPage === 'number' ? source.pdfPage : undefined } } : {}) }
}
export function learnerSharedExam(exam: any) {
  return { id: exam.id, examType: exam.examType, content: learnerPromptContent(exam.content), imageUrl: image(exam.imageUrl) || null,
    requirePhone: !!exam.requirePhone, requireEmail: !!exam.requireEmail, expiresAt: exam.expiresAt }
}

export function learnerHistoryPrompt(value: string): string {
  // Old HSK histories appended a grading-only compiled copy after the JSON set.
  const first = value.split('\n\n')[0]
  try { const parsed = JSON.parse(first); if (parsed?.part1 && parsed?.part3) return learnerPromptContent(first) } catch {}
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return JSON.stringify(parsed.map(row => ({ type: row.type, prompt: learnerPromptContent(row.prompt || '') })))
  } catch {}
  return learnerPromptContent(value)
}

export function learnerGradingResult(value: any): any {
  if (Array.isArray(value)) return value.map(learnerGradingResult)
  if (!value || typeof value !== 'object') return value
  const result: Record<string, any> = {}
  for (const [key, item] of Object.entries(value)) {
    if (['imageDescription', 'chartExtra', 'aiContext', 'context', 'systemPrompt', 'gradingContext'].includes(key)) continue
    if (key === 'sourcePrompts' && item && typeof item === 'object') result[key] = Object.fromEntries(Object.entries(item).map(([type, prompt]) => [type, learnerPrompt(prompt && typeof prompt === 'object' && typeof (prompt as any).content === 'string' ? prompt as any : { content: '' })]))
    else result[key] = learnerGradingResult(item)
  }
  return result
}
