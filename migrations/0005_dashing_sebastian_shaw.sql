CREATE TABLE `shared_exam_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`sharedExamId` text NOT NULL,
	`studentName` text NOT NULL,
	`studentEssay` text NOT NULL,
	`gradingResult` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shared_exam` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text NOT NULL,
	`examType` text NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`imageDescription` text,
	`createdAt` integer NOT NULL,
	`expiresAt` integer NOT NULL
);
