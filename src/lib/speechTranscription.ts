export type SpeechWord = { word: string; start: number; end: number }

export function isEnglishSpeechText(text: string) {
  const letters = text.match(/\p{L}/gu) || [], english = text.match(/[a-z]/gi) || []
  return /[a-z0-9]/i.test(text) && (!letters.length || english.length / letters.length >= 0.9)
}

/** Validate ASR evidence, rather than treating a fluent guess as spoken audio. */
export function inspectSpeechTranscription(result: any): { status: 'ok' | 'silence' | 'invalid'; text: string; words: SpeechWord[] } {
  const empty = (status: 'silence' | 'invalid') => ({ status, text: '', words: [] })
  if (typeof result?.text !== 'string' || result.text.length > 12_000) return empty('invalid')
  const language = String(result.language || '').toLowerCase()
  if (language && !['en', 'english', 'en-us', 'en-gb'].includes(language)) return empty('silence')
  let text = result.text.trim()
  if (!text) return empty('silence')
  // Guard the previously deployed prompt-echo failure without deleting normal
  // spoken words such as "ignore", fillers or genuine repeated phrases.
  if (/retain audible/i.test(text) && /ignore|false starts|self.corrections|non.speech noise/i.test(text)) return empty('invalid')
  const segments: any[] = Array.isArray(result.segments) ? result.segments : []
  const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  const silent = (segment: any) => numeric(segment?.no_speech_prob) && segment.no_speech_prob >= 0.8 && (!numeric(segment.avg_logprob) || segment.avg_logprob < -0.5)
  const unreliable = (segment: any) => silent(segment)
    || (numeric(segment?.avg_logprob) && segment.avg_logprob < -1.5)
    || (numeric(segment?.compression_ratio) && segment.compression_ratio > 2.4 && numeric(segment.avg_logprob) && segment.avg_logprob < -0.8)
  const retained = segments.filter(segment => !unreliable(segment))
  if (segments.length && !retained.length) return empty(segments.every(silent) ? 'silence' : 'invalid')
  if (retained.length !== segments.length) {
    if (retained.some(segment => typeof segment.text !== 'string')) return empty('invalid')
    text = retained.map(segment => segment.text.trim()).filter(Boolean).join(' ')
  }
  if (!isEnglishSpeechText(text)) return empty('silence')
  const words: SpeechWord[] = []
  if (Array.isArray(result.words) && result.words.length <= 3000) {
    for (const item of result.words) {
      if (typeof item?.word !== 'string' || item.word.length > 100 || !isEnglishSpeechText(item.word)
        || !numeric(item.start) || !numeric(item.end) || item.start < 0 || item.end < item.start || item.end > 600) continue
      if (retained.length !== segments.length && !retained.some(segment => numeric(segment.start) && numeric(segment.end) && item.start < segment.end && item.end > segment.start)) continue
      words.push({ word: item.word, start: item.start, end: item.end })
    }
  }
  words.sort((a, b) => a.start - b.start)
  return { status: 'ok', text, words }
}
