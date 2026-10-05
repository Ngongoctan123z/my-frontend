CREATE TABLE `chat_message` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`isAdmin` integer DEFAULT false NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer NOT NULL,
	`isRead` integer DEFAULT false NOT NULL
);
