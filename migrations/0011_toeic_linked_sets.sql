CREATE TABLE IF NOT EXISTS writing_exam_set (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, picturePromptId TEXT NOT NULL,
 email6PromptId TEXT NOT NULL, email7PromptId TEXT NOT NULL, essayPromptId TEXT NOT NULL,
 isPublished INTEGER NOT NULL DEFAULT 1, createdAt INTEGER NOT NULL
);
