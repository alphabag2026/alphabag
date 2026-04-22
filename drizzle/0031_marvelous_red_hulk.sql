CREATE TABLE `legalDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(20) NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'ko',
	`content` text NOT NULL DEFAULT (''),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legalDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`telegramUrl` varchar(500) DEFAULT 'https://t.me/alphabag_official',
	`twitterUrl` varchar(500) DEFAULT 'https://twitter.com/alphabag_io',
	`youtubeUrl` varchar(500) DEFAULT 'https://youtube.com/@alphabag',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
