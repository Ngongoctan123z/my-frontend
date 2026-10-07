CREATE TABLE `bank_transaction` (
	`id` text PRIMARY KEY NOT NULL,
	`transactionId` text,
	`bank` text,
	`direction` text,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'VND' NOT NULL,
	`content` text,
	`referenceCode` text,
	`receivedAt` integer,
	`syncedAt` integer NOT NULL,
	`status` text DEFAULT 'unmatched' NOT NULL,
	`matchedUserId` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bank_transaction_transactionId_unique` ON `bank_transaction` (`transactionId`);