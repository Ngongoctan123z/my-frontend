ALTER TABLE `user` ADD `plan` text DEFAULT 'free' NOT NULL;
ALTER TABLE `user` ADD `planExpiresAt` integer;
