ALTER TABLE `listingRequests` ADD `youtubeUrl` text;--> statement-breakpoint
ALTER TABLE `listingRequests` ADD `revenueModel` text;--> statement-breakpoint
ALTER TABLE `notices` ADD `type` enum('info','warning','success','urgent','meeting') DEFAULT 'info' NOT NULL;--> statement-breakpoint
ALTER TABLE `notices` ADD `meetingPlatform` varchar(50);--> statement-breakpoint
ALTER TABLE `notices` ADD `meetingUrl` text;--> statement-breakpoint
ALTER TABLE `notices` ADD `meetingDate` timestamp;--> statement-breakpoint
ALTER TABLE `notices` ADD `linkUrl` text;