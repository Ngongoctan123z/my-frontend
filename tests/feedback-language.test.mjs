import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { normalizeFeedbackLanguage, feedbackLanguageInstruction, assertFeedbackLanguage } from '../src/lib/feedbackLanguage.ts'

for (const value of [undefined, null, '', 'vi', 'Vietnamese', 'Tiếng Việt', 'unknown']) {
  assert.equal(normalizeFeedbackLanguage(value), 'Tiếng Việt')
  assert.match(feedbackLanguageInstruction(value), /ALL learner-facing/)
  assert.match(feedbackLanguageInstruction(value), /Tiếng Việt/)
}
for (const [value, expected] of [['en','English'],['ko','한국어'],['zh','中文'],['ja','日本語']]) {
  assert.equal(normalizeFeedbackLanguage(value), expected)
  assert.ok(feedbackLanguageInstruction(value).includes(expected))
}
const english = 'Your response describes the picture clearly but you need to use both required words in one sentence.'
assert.throws(() => assertFeedbackLanguage({pictureTasks:[{feedback:english}]}, 'Tiếng Việt'), /feedback_language_mismatch/)
assert.throws(() => assertFeedbackLanguage({detailedFeedback:'Bài viết có bố cục rõ ràng.',criteria:{grammar:{reasoning:english}}}, 'vi'), /feedback_language_mismatch/)
assert.throws(() => assertFeedbackLanguage({issues:[{explanation:english}]}, 'Tiếng Việt'), /feedback_language_mismatch/)
assert.doesNotThrow(() => assertFeedbackLanguage({feedback:'Bài viết có bố cục rõ ràng nhưng cần dùng cả hai từ gợi ý trong một câu.',corrections:[{original:english,corrected:english,explanation:'Cần sửa cách chia động từ cho phù hợp với chủ ngữ.'}],modelAnswer:english,evidence:[english]}, 'Tiếng Việt'))
assert.doesNotThrow(() => assertFeedbackLanguage({feedback:english}, 'English'))
assert.doesNotThrow(() => assertFeedbackLanguage({criteria:{grammar:{score:7,label:'Grammar'}}}, 'vi'))
const writing = await readFile(new URL('../app/api/ai-grader/route.ts', import.meta.url), 'utf8')
assert.ok(writing.indexOf('systemPrompt += feedbackLanguageInstruction(feedbackLang)') > writing.indexOf('HƯỚNG DẪN BỔ SUNG TỪ QUẢN TRỊ'))
assert.match(writing, /const feedbackLang = normalizeFeedbackLanguage\(body.feedbackLang\)/)
assert.match(writing, /const parsed = parseModelJson\(text\)\s+assertFeedbackLanguage\(parsed, feedbackLang\)/)
assert.ok(!writing.includes("if (feedbackLang && feedbackLang !== 'Tiếng Việt')"))
const speaking = await readFile(new URL('../app/api/speaking/scoring.ts', import.meta.url), 'utf8')
assert.match(speaking, /\+ feedbackLanguageInstruction\(language\)/)
assert.match(speaking, /assertFeedbackLanguage\(raw, language\)/)
console.log('PASS feedback language defaults, aliases, Vietnamese Writing/picture/Speaking guards, English examples and shared API integration')
