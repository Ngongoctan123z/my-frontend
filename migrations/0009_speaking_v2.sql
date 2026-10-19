CREATE TABLE IF NOT EXISTS speaking_submission (
    id TEXT PRIMARY KEY, email TEXT NOT NULL, fingerprint TEXT NOT NULL, examType TEXT NOT NULL,
    mode TEXT NOT NULL, feedbackLang TEXT NOT NULL, manifest TEXT NOT NULL, quotaDate TEXT NOT NULL,
    status TEXT NOT NULL, createdAt INTEGER NOT NULL
  );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS speaking_submission_owner_created ON speaking_submission(email, createdAt);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS speaking_recording (
    id TEXT PRIMARY KEY, submissionId TEXT NOT NULL, itemIndex INTEGER NOT NULL, contentHash TEXT NOT NULL,
    transcript TEXT, result TEXT, status TEXT NOT NULL DEFAULT 'pending', leaseToken TEXT, leaseUntil INTEGER,
    error TEXT, chatLog TEXT, updatedAt INTEGER NOT NULL
  );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS speaking_recording_submission ON speaking_recording(submissionId, itemIndex);
