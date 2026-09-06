CREATE TABLE `stepEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`steps` int unsigned NOT NULL,
	`source` enum('manual','import') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stepEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `stepEntries_user_date_unique` UNIQUE(`userId`,`dateKey`)
);
--> statement-breakpoint
CREATE TABLE `timeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('seat','focus') NOT NULL,
	`label` varchar(120),
	`startedAt` timestamp NOT NULL,
	`endedAt` timestamp,
	`runningStartedAt` timestamp,
	`elapsedSeconds` int unsigned NOT NULL DEFAULT 0,
	`status` enum('running','paused','completed') NOT NULL DEFAULT 'completed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `stepEntries` ADD CONSTRAINT `stepEntries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeEntries` ADD CONSTRAINT `timeEntries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `stepEntries_user_date_idx` ON `stepEntries` (`userId`,`dateKey`);--> statement-breakpoint
CREATE INDEX `timeEntries_user_started_idx` ON `timeEntries` (`userId`,`startedAt`);--> statement-breakpoint
CREATE INDEX `timeEntries_user_status_idx` ON `timeEntries` (`userId`,`status`);