# Speaking live transcription and recovery

Microphone recording, waveform analysis and transcription have separate lifecycles. Recording starts without waiting for `AudioContext.resume()`, which can remain pending under browser autoplay rules. Missing Web Audio or a failed browser recognition constructor does not discard the recording.

## Text while speaking

The browser's `SpeechRecognition` service is the fast path, with `en-US` interim results shown while the learner speaks. Capture requests browser echo cancellation, noise suppression and automatic gain control. When Web Audio is running, an 80 Hz high-pass and 8 kHz low-pass also reduce rumble/hiss before both the complete recorder and the live recorder. Supported native engines receive the same processed audio track. No hard audio gate mutes quiet consonants; unsupported/suspended Web Audio falls back to the working microphone stream.

The live path starts a new four-second independent `MediaRecorder` file every three seconds. One second of shared audio protects words crossing recording boundaries, and each WebM, MP4 or Ogg file has its own container headers. Arbitrary timeslice blobs from the complete recording are not uploaded as standalone files. Confidently measured near-silence is not uploaded; missing or suspended analysis never blocks transcription.

If native recognition is absent, fails, or hears over 4.5 seconds of measured speech without producing words, the recorder switches to authenticated server transcription. A natural pause or `no-speech` event does not disable a working native engine. Unfinished native hypotheses are replaced during handoff. Short excerpts are uploaded serially using multipart `transcribe_live`; the UI appends real returned words before the learner presses Stop. This path needs a working network and the configured Groq speech provider. Its delay includes the four-second initial excerpt and provider/network latency; it is not guaranteed word-by-word streaming. Returned word timestamps reconcile shared audio without deleting genuine repeated words. Older responses without timings use text overlap only for overlapping source files.

Server transcription fixes the input language to `en`, uses the transcription endpoint (not translation) and sends no instructional Whisper prompt. Such a prompt caused the reported “Retain audible / Ignore” text on quiet audio. Response validation rejects that legacy echo, explicitly non-English responses, and non-English script. Segment confidence/no-speech metadata removes noise-only segments and retries malformed/unreliable output through existing model rotation. Confident short words, numbers, fillers and genuine repetitions are retained. Language selection and signal filtering improve recognition; they cannot guarantee perfect isolation from another nearby speaker or perfect real-microphone accuracy.

The upload queue and consecutive failure budget are bounded. A prolonged service failure stops the secondary transcription path and displays an error while the complete recording continues locally. Silence responses do not generate words. Stopping, cancelling, leaving the recorder or changing its owner aborts pending excerpt requests, detaches recorder handlers and releases microphone tracks. Generation and recording-state checks prevent late responses from updating a different recording.

Before recording starts, the UI explains that audio may be sent in short excerpts to obtain live text. Starting recording is the user action that enables this behavior. Live text and pause markers are provisional, read-only evidence; the learner cannot replace them with an editable essay. Optional waveform analysis estimates pauses independently of recognition availability.

## Complete transcript after stopping

Every newly recorded clip is automatically sent once to `transcribe_audio` after Stop to complete the final sentence and recover words missed by a live excerpt. Clips restored from an earlier session are not automatically uploaded. The learner can explicitly use **Chuyển bản thu thành chữ** or **Nhận dạng lại bản thu** to request another complete transcript. A failed request keeps the recording available for playback and retry; clip changes abort requests and stale results cannot replace another clip's text.

Both live excerpts and complete previews require authentication and remaining Speaking usage eligibility. They do not reserve a grading slot, create a submission or store recordings in R2. Live excerpts have a 600KB maximum and a separate limit of 30 requests per minute per account; complete previews retain the six-per-minute limit and regular 12MB audio validation. An overall multipart parsing limit also applies. The live cadence does not consume the separate allowance used to upload or grade a complete recording.

Both paths use the existing provider key rotation and request accounting. Live provider work has a shorter 15-second budget with at most five seconds per provider attempt, while the complete-recording path retains its existing budget and fallback models. Authentication, MIME validation, bounded request bodies, remaining-usage checks and rate limits happen before provider calls. Provider configuration failures are reported without exposing keys.

## Grading and verification

Grading still derives its own transcript from the submitted audio and stores that server-derived transcript with the result. Live text or preview text is never accepted as trusted replacement grading input. No scoring rubric, admin configuration or database schema is changed by live transcription.

Route tests exercise real Speaking handlers and SQLite, with external providers replaced by fixtures. Coverage includes live audio bytes, prompt echo, English input language, mixed speech/noise confidence, quiet/short words, word timings, separate rate allowances, authentication, audio size/MIME checks, exhausted usage, provider key fallback and the existing grading flow. Recorder tests cover overlapping files, actual repetitions, silence suppression, natural native pauses, microphone startup independently of Web Audio, live fallback, cleanup and stale responses. Browser checks exercise actual `MediaRecorder`, real filter frequency response/quiet-tone preservation, responsive layouts and transcription before Stop when native recognition is unavailable. Fixtures do not verify a user's physical microphone, a particular mobile browser or current production provider quota; the deployment checks and a real-device smoke test provide complementary evidence.


