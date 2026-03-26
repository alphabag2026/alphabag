CREATE TABLE `referralMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`emoji` varchar(10),
	`subtitle` varchar(200),
	`content` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referralMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `announcements` MODIFY COLUMN `type` enum('info','warning','success','urgent','meeting') NOT NULL DEFAULT 'info';--> statement-breakpoint
ALTER TABLE `investmentPlans` MODIFY COLUMN `planType` enum('investment','staking','golden','self','node','leader','meme','influencer') NOT NULL DEFAULT 'investment';--> statement-breakpoint
ALTER TABLE `investmentPlans` MODIFY COLUMN `collectionType` enum('golden','self','node','leader','meme','influencer');--> statement-breakpoint
ALTER TABLE `announcements` ADD `meetingUrl` text;--> statement-breakpoint
ALTER TABLE `announcements` ADD `meetingDate` timestamp;--> statement-breakpoint
ALTER TABLE `announcements` ADD `meetingPlatform` varchar(50);--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `videoUrl2` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `docsUrl2` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `infoweb4Url` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `thumbnailImages` json;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `ratioInfo` varchar(100);--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `yieldInfo` varchar(100);