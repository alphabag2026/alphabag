DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `referralMessages`;--> statement-breakpoint
ALTER TABLE `announcements` MODIFY COLUMN `type` enum('info','warning','success','urgent') NOT NULL DEFAULT 'info';--> statement-breakpoint
ALTER TABLE `investmentPlans` MODIFY COLUMN `planType` enum('investment','staking') NOT NULL DEFAULT 'investment';--> statement-breakpoint
ALTER TABLE `announcements` DROP COLUMN `meetingUrl`;--> statement-breakpoint
ALTER TABLE `announcements` DROP COLUMN `meetingDate`;--> statement-breakpoint
ALTER TABLE `announcements` DROP COLUMN `meetingPlatform`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `collectionType`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `rating`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `videoUrl`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `docsUrl`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `blogUrl`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `telegramUrl`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `twitterUrl`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `recommendedAmount`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `allocation`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `strategy`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `badgeLabels`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `isHighlight`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `videoUrl2`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `docsUrl2`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `infoweb4Url`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `thumbnailImages`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `ratioInfo`;--> statement-breakpoint
ALTER TABLE `investmentPlans` DROP COLUMN `yieldInfo`;