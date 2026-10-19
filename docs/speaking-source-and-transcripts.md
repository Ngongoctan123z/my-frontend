# Speaking sources and immutable transcripts

TOEIC timings and task groups are verified against https://www.ets.org/pdfs/toeic/toeic-speaking-writing-sample-tests.pdf : 11 questions; read-aloud 45/45 seconds, picture description 45/30, answers 15/15/30 with 3-second preparation, information tasks with 45-second initial reading, opinion 45/60. Q10 is read twice. Official sample excerpts add the television Q5–7 group and vacation-time Q11, clearly identified as excerpts, not a complete released exam.

IELTS source: https://takeielts.britishcouncil.org/sites/default/files/%5Bdownloads%5D/ielts-speaking-sample-tasks-2023.pdf . Official samples add the important-possession cue card and its linked values/advertising discussion. Part 2 uses 60-second preparation and up to 120-second speaking. Other existing questions remain labelled as practice. The automated IELTS interview uses fixed practice response windows; it is a simulation, not a live examiner's adaptive 11–14 minute interview.

Official rows seed atomically into D1 with `SPEAKING_OFFICIAL_SAMPLES_V1`, preserving later admin edits/deletions. Publisher links appear in the question and admin cards.

After recording, users can replay the Blob and see browser-recognized text, without editing it. On submission, audio is persisted privately in R2 with D1 ownership metadata before provider grading. The server obtains the transcript from that recording; client-supplied transcript fields are ignored. The stored result displays this exact transcript, read-only, next to playback and an optional comparison with provisional browser recognition/pause dots. Feedback contains criterion scores/explanations, supported weaknesses, exact quotes, corrections and a clearly identified improved example. Provider retries use the saved transcript and audio hash.

Groq transcript grading evaluates content, grammar, vocabulary and supported fluency evidence. Pronunciation and a complete Speaking score require an audio-capable assessment provider; text-only fallback displays its actual scope and does not invent pronunciation or an official score. Audio and result history are restricted to the owning account.


## Publisher-original library

The Speaking page now offers **Đề mẫu chính thức**, and the Speaking admin has the same tab. This references two unchanged publisher PDFs: ETS Speaking/Writing Sample Tests (2025 copyright, 12 PDF pages), and IELTS Speaking Sample Tasks (2023, 7 PDF pages). Eight section references cover all five TOEIC task groups and all three IELTS parts. The documents are publisher sample tasks; neither source establishes that they are previously administered exam papers or complete independent full tests. A PDF containing multiple sample task types is not counted as multiple released tests.

Original photos, information tables, task wording and sample transcripts remain in the publisher PDF. The library provides a source landing-page link, direct PDF link, lazy inline PDF viewer and direct links to exact one-based PDF pages. If the browser cannot display a remote PDF, the direct original link stays available. No reconstructed pictures or invented missing questions are added. No PDF is loaded until the user chooses a section.

The four existing integrated sample groups have **Luyện trên web** shortcuts only when their unedited, published rows exist in the active learner catalog. Opening a document does not create a submission, start recording or call an AI provider. Hidden, deleted or edited samples do not acquire an active shortcut through the source library. Other sections are explicitly original-document access, not claimed to have been imported into the AI workflow. The learner question picker can filter **Chỉ câu mẫu chính thức**.

Source verification date: 2026-10-19. TOEIC references were corrected from printed folios to PDF pages 5 (Q5–7) and 7 (Q11), so both source labels and direct links use the same page numbering. This change does not alter question-bank seeding, grading, provider rotation, quota or private audio storage.
