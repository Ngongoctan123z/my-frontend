import assert from 'node:assert/strict'
import test from 'node:test'
import { modelList, isGroqTextModel, resolveGroqTextModels, resolveTranscriptionModels, resolveAudioAssessmentModels } from '../src/lib/aiModels.ts'

test('grading visits every compatible configured model in administrator order', () => {
  assert.deepEqual(resolveGroqTextModels({ GRADING_GROQ_MODEL: 'grading-one, shared', ACTIVE_GROQ_MODEL: 'shared\nactive-two,whisper-large-v3,canopylabs/orpheus-v1-english,meta-llama/llama-prompt-guard-2-22m' }), ['grading-one', 'shared', 'active-two'])
  assert.deepEqual(resolveGroqTextModels({ ACTIVE_GROQ_MODEL: 'a,a,b' }), ['a', 'b'])
  assert.deepEqual(modelList(' a, b\na\r\nc '), ['a', 'b', 'c'])
})
test('model defaults remain bounded and known non-chat capabilities are excluded', () => {
  assert.deepEqual(resolveGroqTextModels({}), ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile'])
  for (const model of ['whisper-large-v3', 'openai/gpt-oss-safeguard-20b', 'playai-tts', 'text-embedding-001']) assert.equal(isGroqTextModel(model), false)
  assert.equal(isGroqTextModel('future-compatible-chat-model'), true)
})
test('transcription and audio assessment use models for their own modalities', () => {
  assert.deepEqual(resolveTranscriptionModels({ ACTIVE_GROQ_MODEL: 'chat,whisper-large-v3', SPEAKING_TRANSCRIPTION_MODELS: 'whisper-custom,chat' }), ['whisper-custom', 'whisper-large-v3', 'whisper-large-v3-turbo'])
  assert.deepEqual(resolveAudioAssessmentModels({ SPEAKING_AUDIO_MODEL: 'gemini-3.8-flash,gemini-3.8-live,whisper-large-v3,gemini-3.6-flash' }), ['gemini-3.8-flash', 'gemini-3.6-flash'])
})
