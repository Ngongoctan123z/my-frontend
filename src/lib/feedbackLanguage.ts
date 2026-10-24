/** Language for explanations is independent of the language being examined. */
const languages: Record<string, string> = {
  'tiếng việt': 'Tiếng Việt', vi: 'Tiếng Việt', vietnamese: 'Tiếng Việt',
  english: 'English', en: 'English', '한국어': '한국어', ko: '한국어',
  '中文': '中文', zh: '中文', '日本語': '日本語', ja: '日本語',
}
export function normalizeFeedbackLanguage(value: unknown): string {
  return typeof value === 'string' ? languages[value.trim().toLowerCase()] || 'Tiếng Việt' : 'Tiếng Việt'
}
export function feedbackLanguageInstruction(value: unknown): string {
  const language = normalizeFeedbackLanguage(value)
  return '\nFEEDBACK LANGUAGE REQUIREMENT (overrides default language in rubrics and examples): ' + language + '.\n'
    + 'Write ALL learner-facing assessments, feedback, detailedFeedback, reasoning, explanations, strengths, weaknesses, improvement advice and issue titles in ' + language + '. '
    + 'For Tiếng Việt, use natural Vietnamese with diacritics. The exam language and the language of the candidate answer do not change this choice. '
    + 'Keep JSON property names, enum values, scores and IDs unchanged. Preserve original/evidence quotations, task requirements used for matching, corrected sentences and model answers in their original or target exam language. '
    + 'Before returning JSON, check every explanatory field against the selected feedback language.\n'
}
const explanationKeys = new Set(['feedback', 'detailedFeedback', 'reasoning', 'explanation', 'strengths', 'weaknesses', 'improvements', 'advice', 'assessmentNote', 'pronunciationNote'])
// Conservative rejection of substantial untranslated prose. Short rubric labels,
// quotations, corrected sentences and model answers are deliberately excluded.
export function assertFeedbackLanguage(result: unknown, value: unknown): void {
  if (normalizeFeedbackLanguage(value) !== 'Tiếng Việt') return
  const vietnamese = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu
  function checkText(text: string) {
    if ((text.match(/\p{L}+/gu) || []).length >= 12 && !vietnamese.test(text)) {
      throw Object.assign(new Error('feedback_language_mismatch'), { code: 'AI_OUTPUT_INVALID' })
    }
  }
  function walk(item: unknown, explanatory = false) {
    if (typeof item === 'string') { if (explanatory) checkText(item); return }
    if (Array.isArray(item)) { for (const row of item) walk(row, explanatory); return }
    if (item && typeof item === 'object') {
      for (const [key, child] of Object.entries(item)) walk(child, explanationKeys.has(key))
    }
  }
  walk(result)
}
