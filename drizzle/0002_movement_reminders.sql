CREATE TABLE `classPeriods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`start` timestamp NOT NULL,
	`end` timestamp NOT NULL,
	CONSTRAINT `classPeriods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `movementProfiles` (
	`userId` int NOT NULL,
	`place` enum('desk','hall','home') NOT NULL DEFAULT 'desk',
	`situation` enum('quiet','free') NOT NULL DEFAULT 'quiet',
	`preference` enum('ankle','walk','stretch') NOT NULL DEFAULT 'walk',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `movementProfiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `movementReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`seatId` int NOT NULL,
	`slot` int NOT NULL,
	`mode` enum('fixed','custom') NOT NULL,
	`decision` enum('defer','send','skip') NOT NULL,
	`reason` varchar(100) NOT NULL,
	`exercise` enum('ankle','walk','stretch') NOT NULL,
	`createdAt` timestamp NOT NULL,
	`decidedAt` timestamp NOT NULL,
	`deferredUntil` timestamp,
	`shownAt` timestamp,
	`response` enum('done','dismiss'),
	`respondedAt` timestamp,
	CONSTRAINT `movementReminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `movement_opportunity` UNIQUE(`userId`,`seatId`,`slot`)
);
--> statement-breakpoint
ALTER TABLE `classPeriods` ADD CONSTRAINT `classPeriods_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movementProfiles` ADD CONSTRAINT `movementProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `movementReminders` ADD CONSTRAINT `movementReminders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `class_user_end` ON `classPeriods` (`userId`,`end`);--> statement-breakpoint
CREATE INDEX `movement_history` ON `movementReminders` (`userId`,`createdAt`);