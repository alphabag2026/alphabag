CREATE TABLE `listingRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectName` varchar(100) NOT NULL,
	`projectSymbol` varchar(20),
	`projectWebsite` varchar(255),
	`projectDescription` text,
	`category` enum('golden','self','leader','meme','influencer','cbag','airdrop','partner') NOT NULL,
	`contactName` varchar(100) NOT NULL,
	`contactEmail` varchar(255) NOT NULL,
	`contactTelegram` varchar(100),
	`logoUrl` text,
	`whitepaperUrl` text,
	`telegramUrl` text,
	`twitterUrl` text,
	`additionalInfo` text,
	`status` enum('pending','reviewing','approved','rejected') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listingRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`logoUrl` text,
	`website` varchar(255),
	`description` text,
	`category` varchar(50),
	`isHidden` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `isHidden` boolean DEFAULT false NOT NULL;