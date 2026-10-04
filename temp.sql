CREATE TABLE `api_usage` (
	`userId` text NOT NULL,
	`date` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`userId`, `date`)
);

ALTER TABLE `user` ADD `password` text;
ALTER TABLE `user` ADD `plan` text DEFAULT 'free' NOT NULL;
ALTER TABLE `user` ADD `planExpiresAt` integer;