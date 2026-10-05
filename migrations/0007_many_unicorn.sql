CREATE TABLE `essay_history` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`examType` text NOT NULL,
	`prompt` text NOT NULL,
	`essay` text NOT NULL,
	`result` text NOT NULL,
	`createdAt` integer NOT NULL
);
