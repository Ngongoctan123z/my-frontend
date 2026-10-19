# Speaking

Speaking uses a single Writing-style workspace: select an exam/part, record, play back, select feedback language and submit. The result drawer contains criteria, up to three practical improvements and optional transcript/model answer/coach. Recording, playback and re-recording do not call AI.

## Question formats

TOEIC uses the current 11-question format: two read-aloud tasks (45s preparation/45s speech), two picture descriptions (45s/30s), three personal responses (3s preparation and 15/15/30s speech), three information responses (45s information reading, 3s preparation and 15/15/30s speech; question 10 repeated), and one opinion (45s/60s). Existing admin part identifiers are translated into these groups. IELTS full practice has six Part 1 questions, a Part 2 cue card (60s preparation/120s speech), and four Part 3 questions linked by set ID. Practice allows manual stopping; optional full exam mode controls preparation, duration and question advancement.

## Submission and storage

`begin_submission` validates the manifest and atomically reserves one daily Speaking slot per submission using D1 transactions. The client UUID and owner determine the reservation; its immutable fingerprint prevents changing audio or feedback language under the same reservation. Per-recording leases prevent concurrent duplicate processing. Completed results and successful transcriptions are reused on retry. Each provider attempt uses the shared account-offset API key ring and persistent cooldowns.

The new `speaking_submission` and `speaking_recording` tables are created idempotently before use; migration `0009_speaking_v2.sql` documents the same schema. Old `speaking_session` history remains visible. Reports, transcripts and coach messages are account-scoped in D1. Submitted audio is saved to the private `SPEAKING_AUDIO` R2 binding before any provider call, with MIME/size/object metadata in `speaking_audio` (D1). All clips are uploaded before grading begins. Owner-authenticated `/api/speaking/audio/[recordingId]` supports private playback and HTTP byte ranges on another device. Pending submissions can resume from R2 when local clips are absent. Drafts and a local audio cache remain in account-scoped IndexedDB. Older recordings that were never uploaded remain local. Migration `0010_speaking_bank_audio.sql` documents the audio metadata and prompt tables. Wrangler binds the explicit private bucket `vndocs-speaking-audio`. Its build hook runs `scripts/ensure-speaking-r2.mjs` to create the bucket only when missing, using the existing Cloudflare build token, and reuse it on later deploys. This avoids Wrangler inheriting a binding absent from the previous Worker version (error 10057). The browser releases microphone tracks, AudioContext and object URLs when they are no longer used.

## Question administration

`/quan-ly-he-thong-123` → Speaking reads and writes the real D1 `speaking_prompt` table. Idempotent bootstrap seeds the built-in catalog once; the transaction marker prevents deleted prompts from returning. Published database rows are authoritative. Admin edits preserve server IDs and publishing state, validate exam/part compatibility and save grouped follow-up questions. IELTS Parts 2/3 share a set ID. Full tests only use complete groups; an incomplete bank produces an explicit empty-state message. HTTP failures keep the editor open with its contents.

## Assessment providers

Groq Whisper transcribes audio using the existing `GROQ_API_KEY` ring. Content feedback uses `GRADING_GROQ_MODEL` with fallback models. This path cannot evaluate pronunciation or supply a full speaking band; the API forces those values to null and the UI explains the limitation.

Actual-audio assessment is optional. Set `SPEAKING_AUDIO_API_KEY` (comma/newline-separated Google AI keys) and optionally `SPEAKING_AUDIO_MODEL` (default `gemini-3.8-flash`) in system config. Existing `GEMINI_API_KEY`/`GEMINI_API_KEYS` are also recognized. `SPEAKING_AUDIO_ENABLED=false` disables it. Modern Gemini models use the Interactions API with actual audio bytes and `store:false`; older Gemini 1/2 models use `generateContent`. Provider errors fall back to content-only assessment. Keys are sent in headers, never stored in results or returned to clients. All scores are practice estimates; TOEIC raw task totals are not converted to the official 0–200 scale.

## Verification

`npm run test:speaking` executes the actual route and D1 SQL against SQLite, with mocked external AI responses. `npm run test:speaking-ui` bundles the actual client with production CSS and runs Chromium MediaRecorder/IndexedDB tests at 320, 375 and 1280px. Browser tests mock remote assessments, use a synthetic microphone, and do not consume paid AI quota. Existing Writing and API rotation tests remain part of CI.

## Live recognition and pause evidence

On supported browsers, English SpeechRecognition shows provisional words while MediaRecorder saves the complete audio. The live transcript preserves received fillers, repeated words and self-corrections. A pause indicator starts with one dot after 1.5 seconds and adds one dot per second. Recognition is optional; unsupported/interrupted recognition never stops the recording. Browser echo cancellation/noise suppression and an adaptive energy/voice-band gate reduce background-noise timing errors. Raw audio is never cut by this gate; wind/fan rejection and filler recognition are estimates, not guarantees.

Bounded timestamped text and pause events are saved in the D1 manifest, restored with reports and included in Groq grading evidence. The model is told these are browser estimates and must not mistake recognition errors/noise for pronunciation or a medical speech disorder. Groq transcription requests retain fillers and repetitions. Transcript-only assessment still cannot invent a pronunciation or full Speaking score. Browser checks cover interim/final text, pause boundaries, retained hesitations and microphone/recognition cleanup.
