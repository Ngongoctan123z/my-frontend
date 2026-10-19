CREATE TABLE IF NOT EXISTS speaking_prompt (
 id TEXT PRIMARY KEY, examType TEXT NOT NULL, part TEXT NOT NULL, topic TEXT NOT NULL,
 questionEn TEXT NOT NULL, questionVi TEXT NOT NULL, cueCard TEXT, subQuestions TEXT,
 suggestedVocabulary TEXT, imageUrl TEXT, prepTimeSec INTEGER NOT NULL DEFAULT 0,
 speakTimeSec INTEGER NOT NULL DEFAULT 45, startGraceSec INTEGER NOT NULL DEFAULT 0,
 criteria TEXT, difficulty TEXT NOT NULL DEFAULT 'medium', setId TEXT,
 isPublished INTEGER NOT NULL DEFAULT 1, createdAt INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS speaking_prompt_exam_part ON speaking_prompt(examType,part,isPublished);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS speaking_audio (
 recordingId TEXT PRIMARY KEY, objectKey TEXT NOT NULL, mimeType TEXT NOT NULL,
 byteSize INTEGER NOT NULL, createdAt INTEGER NOT NULL
);
