# Speaking live transcription and recovery

Microphone recording, waveform analysis and transcription have separate lifecycles. Recording starts without waiting for `AudioContext.resume()`, which can remain pending under browser autoplay rules. Missing Web Audio or a failed browser recognition constructor does not discard the recording.

## Text while speaking

The browser's `SpeechRecognition` service is the fast path, with interim English results shown while the learner speaks. The site also starts a second `MediaRecorder` on the same microphone stream. It closes and recreates this secondary recorder approximately every three seconds, producing independently decodable WebM, MP4 or Ogg files with their own container headers. Arbitrary timeslice blobs from the complete recording are not uploaded as standalone files.

If native recognition is absent, fails, or stops producing words for approximately 4.5 seconds, the recorder switches to authenticated server transcription. Short excerpts are uploaded serially using multipart `transcribe_live`; the UI appends real returned words before the learner presses Stop. This path needs a working network and the configured Groq speech provider. Its delay includes the three-second excerpt and provider/network latency; it is not guaranteed word-by-word streaming. The recent native/server boundary may be reconciled to avoid displaying the same recognized words twice.

The upload queue and consecutive failure budget are bounded. A prolonged service failure stops the secondary transcription path and displays an error while the complete recording continues locally. Silence responses do not generate words. Stopping, cancelling, leaving the recorder or changing its owner aborts pending excerpt requests, detaches recorder handlers and releases microphone tracks. Generation and recording-state checks prevent late responses from updating a different recording.

Before recording starts, the UI explains that audio may be sent in short excerpts to obtain live text. Starting recording is the user action that enables this behavior. Live text and pause markers are provisional, read-only evidence; the learner cannot replace them with an editable essay. Optional waveform analysis estimates pauses independently of recognition availability.

## Complete transcript after stopping

Every newly recorded clip is automatically sent once to `transcribe_audio` after Stop to complete the final sentence and recover words missed by a live excerpt. Clips restored from an earlier session are not automatically uploaded. The learner can explicitly use **Chuyển bản thu thành chữ** or **Nhận dạng lại bản thu** to request another complete transcript. A failed request keeps the recording available for playback and retry; clip changes abort requests and stale results cannot replace another clip's text.

Both live excerpts and complete previews require authentication and remaining Speaking usage eligibility. They do not reserve a grading slot, create a submission or store recordings in R2. Live excerpts have a 600KB maximum and a separate limit of 30 requests per minute per account; complete previews retain the six-per-minute limit and regular 12MB audio validation. An overall multipart parsing limit also applies. The live cadence does not consume the separate allowance used to upload or grade a complete recording.

Both paths use the existing provider key rotation and request accounting. Live provider work has a shorter 15-second budget with at most five seconds per provider attempt, while the complete-recording path retains its existing budget and fallback models. Authentication, MIME validation, bounded request bodies, remaining-usage checks and rate limits happen before provider calls. Provider configuration failures are reported without exposing keys.

## Grading and verification

Grading still derives its own transcript from the submitted audio and stores that server-derived transcript with the result. Live text or preview text is never accepted as trusted replacement grading input. No scoring rubric, admin configuration or database schema is changed by live transcription.

Route tests exercise real Speaking handlers and SQLite, with external providers replaced by fixtures. Coverage includes live audio bytes, short provider timeout, separate rate allowances, authentication, audio size/MIME checks, exhausted usage, silence, provider key fallback and the existing grading flow. Recorder tests cover microphone startup independently of Web Audio, live fallback, cleanup and stale responses. Browser checks exercise actual `MediaRecorder`, responsive layouts and transcription before Stop when native recognition is unavailable. Fixtures do not verify a user's physical microphone, a particular mobile browser or current production provider quota; the deployment checks and a real-device smoke test provide complementary evidence.

