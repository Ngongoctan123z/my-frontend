# Speaking live transcription and recovery

Microphone recording, waveform analysis and transcription have separate lifecycles. Recording starts without waiting for `AudioContext.resume()`, which can remain pending under browser autoplay rules. Missing Web Audio or a failed browser recognition constructor does not discard the recording.

## Text while speaking

Google Chrome's Web Speech service is the primary live recognizer. The controller uses `webkitSpeechRecognition`/`SpeechRecognition`, `en-US`, continuous mode and interim results, with the supported no-argument `start()` microphone path. There is no new Google API key, SDK credential or Cloud Speech project requirement. Other browsers may implement a different service or lack this API; the UI names Google only for Chrome and reports unsupported service/permission/network failures explicitly.

The complete recording always uses the original `getUserMedia` microphone stream with browser echo cancellation, noise suppression and automatic gain control. Web Audio is an analysis-only side branch for the waveform and microphone level meter. Suspending, disconnecting or closing analysis must not silence the saved recording. The experimental recognition audio-track path and the custom destination-stream filter have been removed. Only one MediaRecorder runs while Google recognition works; server excerpt recorders start lazily if the native service is unavailable or fails.

The Google controller keeps interim/final text across natural recognition restarts. It waits for a real `onstart` event before showing the listening state, retries network errors with backoff, and reports failure after three attempts. A natural pause never silently changes providers. The user can retry Google while the original recording continues. On Stop, `recognition.stop()` requests the final sentence; the controller keeps its result listeners for up to 1.5 seconds before cleanup. Cancellation/account changes abort immediately. Final word arrival times are bounded to the recording duration before upload so delayed ASR cannot invalidate a submission.

If Google/browser recognition is unavailable or fails, authenticated server transcription remains a clearly labeled fallback. It starts four-second independent MediaRecorder files every three seconds, sharing one second of audio at boundaries. Files have complete WebM/MP4/Ogg container headers; raw timeslice chunks are not uploaded independently. Measured near-silence is skipped, while missing analysis never blocks fallback audio. Returned word timestamps reconcile shared audio without deleting genuine repetitions. This fallback includes the initial four-second excerpt plus provider/network latency; it is not word-by-word streaming.

Server transcription fixes the input language to `en`, uses the transcription endpoint (not translation) and sends no instructional Whisper prompt. Such a prompt caused the reported “Retain audible / Ignore” text on quiet audio. Response validation rejects that legacy echo, explicitly non-English responses, and non-English script. Segment confidence/no-speech metadata removes noise-only segments and retries malformed/unreliable output through existing model rotation. Confident short words, numbers, fillers and genuine repetitions are retained. Language selection and signal filtering improve recognition; they cannot guarantee perfect isolation from another nearby speaker or perfect real-microphone accuracy.

The upload queue and consecutive failure budget are bounded. A prolonged service failure stops the secondary transcription path and displays an error while the complete recording continues locally. Silence responses do not generate words. Stopping, cancelling, leaving the recorder or changing its owner aborts pending excerpt requests, detaches recorder handlers and releases microphone tracks. Generation and recording-state checks prevent late responses from updating a different recording.

Before recording starts, the UI explains that audio may be sent in short excerpts to obtain live text. Starting recording is the user action that enables this behavior. Live text and pause markers are provisional, read-only evidence; the learner cannot replace them with an editable essay. Optional waveform analysis estimates pauses independently of recognition availability.

## Complete transcript after stopping

Clips containing Google/Web Speech words keep those words and their source in owner-scoped local storage. They do not automatically call server ASR after Stop. An explicit **Nhận dạng lại bằng máy chủ** request displays the server result separately for comparison; a short guess such as "Thank you" cannot replace the Google transcript. Clips without browser words retain automatic full-audio recovery once after Stop. Restored clips never trigger automatic server work.

The learner can request another server transcript explicitly. Failure keeps the recording available for playback and retry. Clip changes abort pending requests, and generation/owner checks prevent stale results from replacing a newer recording.

Both live excerpts and complete previews require authentication and remaining Speaking usage eligibility. They do not reserve a grading slot, create a submission or store recordings in R2. Live excerpts have a 600KB maximum and a separate limit of 30 requests per minute per account; complete previews retain the six-per-minute limit and regular 12MB audio validation. An overall multipart parsing limit also applies. The live cadence does not consume the separate allowance used to upload or grade a complete recording.

Both paths use the existing provider key rotation and request accounting. Live provider work has a shorter 15-second budget with at most five seconds per provider attempt, while the complete-recording path retains its existing budget and fallback models. Authentication, MIME validation, bounded request bodies, remaining-usage checks and rate limits happen before provider calls. Provider configuration failures are reported without exposing keys.

## Grading and verification

Grading still derives its own transcript from the submitted audio and stores that server-derived transcript with the result. Live text or preview text is never accepted as trusted replacement grading input. No scoring rubric, admin configuration or database schema is changed by live transcription.

Route tests exercise real Speaking handlers and SQLite with external providers replaced by fixtures. Recorder tests cover the original microphone stream, no-argument Google startup, interim/final words, reconnect/backoff, final-result draining, bounded timestamps, cancellation, stale results, fallback and prevention of automatic server overwrite. Browser checks use real MediaRecorder and a suspended real AudioContext to verify the original audio still decodes with nonzero samples; fixture Google events verify the complete final sentence and a separate server comparison at mobile/desktop widths. These fixtures do not exercise Google's remote recognition service or a user's physical microphone.

Reference: https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api/
