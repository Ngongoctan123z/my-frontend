// Capability routing is shared by grading and the authenticated admin model UI.
// Preserve administrator order; never send an audio/guard model to chat grading.
export type AiModelConfig = Record<string, string | undefined>

export function modelList(value?: string): string[] {
  return [...new Set((value || '').split(/[,\n\r]+/).map(value => value.trim()).filter(Boolean))]
}

export function isGroqTextModel(model: string): boolean {
  return !!model.trim() && !/(?:whisper|orpheus|playai|tts|speech|transcrib|embedding|embed-|prompt-guard|safeguard|moderation)/i.test(model)
}

export const DEFAULT_GROQ_TEXT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.3-70b-versatile']

export function resolveGroqTextModels(config: AiModelConfig, forGrading = true): string[] {
  const values = forGrading
    ? [config.GRADING_GROQ_MODEL, config.ACTIVE_GROQ_MODEL]
    : [config.ACTIVE_GROQ_MODEL, config.GRADING_GROQ_MODEL]
  const configured = [...new Set(values.flatMap(modelList))].filter(isGroqTextModel)
  return configured.length ? configured : [...DEFAULT_GROQ_TEXT_MODELS]
}

export function resolveTranscriptionModels(config: AiModelConfig): string[] {
  const configured = modelList(config.SPEAKING_TRANSCRIPTION_MODELS || config.SPEAKING_TRANSCRIPTION_MODEL)
    .concat(modelList(config.ACTIVE_GROQ_MODEL).filter(model => /whisper/i.test(model)))
  return [...new Set([...configured.filter(model => /whisper/i.test(model)), 'whisper-large-v3-turbo', 'whisper-large-v3'])]
}

export function resolveAudioAssessmentModels(config: AiModelConfig): string[] {
  const configured = modelList(config.SPEAKING_AUDIO_MODEL).filter(model => /^gemini-/i.test(model)
    && !/(?:tts|live|transcrib|image|embedding|robotics)/i.test(model))
  return configured.length ? configured : ['gemini-3.8-flash']
}
