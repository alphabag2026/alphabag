ALTER TABLE `investmentPlans` MODIFY COLUMN `planType` enum('investment','staking','golden','self','node') NOT NULL DEFAULT 'investment';--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `collectionType` enum('golden','self','node');--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `rating` decimal(3,1) DEFAULT '4.0';--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `videoUrl` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `docsUrl` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `blogUrl` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `telegramUrl` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `twitterUrl` text;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `recommendedAmount` decimal(18,2);--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `allocation` varchar(50);--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `strategy` varchar(100);--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `badgeLabels` json;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `isHighlight` boolean DEFAULT false NOT NULL;