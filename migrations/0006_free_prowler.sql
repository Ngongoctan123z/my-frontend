ALTER TABLE `shared_exam_submission` ADD `studentPhone` text;--> statement-breakpoint
ALTER TABLE `shared_exam_submission` ADD `studentEmail` text;--> statement-breakpoint
ALTER TABLE `shared_exam` ADD `requirePhone` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `shared_exam` ADD `requireEmail` integer DEFAULT false NOT NULL;