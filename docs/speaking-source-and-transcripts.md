# Speaking sources and immutable transcripts

TOEIC timings and task groups are verified against https://www.ets.org/pdfs/toeic/toeic-speaking-writing-sample-tests.pdf : 11 questions; read-aloud 45/45 seconds, picture description 45/30, answers 15/15/30 with 3-second preparation, information tasks with 45-second initial reading, opinion 45/60. Q10 is read twice. Official sample excerpts add the television Q5–7 group and vacation-time Q11, clearly identified as excerpts, not a complete released exam.

IELTS source: https://takeielts.britishcouncil.org/sites/default/files/%5Bdownloads%5D/ielts-speaking-sample-tasks-2023.pdf . Official samples add the important-possession cue card and its linked values/advertising discussion. Part 2 uses 60-second preparation and up to 120-second speaking. Other existing questions remain labelled as practice. The automated IELTS interview uses fixed practice response windows; it is a simulation, not a live examiner's adaptive 11–14 minute interview.

Official rows seed atomically into D1 with `SPEAKING_OFFICIAL_SAMPLES_V1`, preserving later admin edits/deletions. Publisher links appear in the question and admin cards.

After recording, users can replay the Blob and see browser-recognized text, without editing it. On submission, audio is persisted privately in R2 with D1 ownership metadata before provider grading. The server obtains the transcript from that recording; client-supplied transcript fields are ignored. The stored result displays this exact transcript, read-only, next to playback and an optional comparison with provisional browser recognition/pause dots. Feedback contains criterion scores/explanations, supported weaknesses, exact quotes, corrections and a clearly identified improved example. Provider retries use the saved transcript and audio hash.

Groq transcript grading evaluates content, grammar, vocabulary and supported fluency evidence. Pronunciation and a complete Speaking score require an audio-capable assessment provider; text-only fallback displays its actual scope and does not invent pronunciation or an official score. Audio and result history are restricted to the owning account.
