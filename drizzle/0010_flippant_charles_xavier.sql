CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`size` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userFavorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userFavorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `airdrops` ADD `projectName` varchar(100);--> statement-breakpoint
ALTER TABLE `airdrops` ADD `imageUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `airdrops` ADD `participateUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `airdrops` ADD `isHot` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `airdrops` ADD `sortOrder` int DEFAULT 0 NOT NULL;