ALTER TABLE `notices` ADD `category` varchar(50) DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `notices` ADD `viewCount` int DEFAULT 0 NOT NULL;