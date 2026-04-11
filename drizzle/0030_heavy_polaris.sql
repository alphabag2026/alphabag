CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`keyPrefix` varchar(12) NOT NULL,
	`partnerName` varchar(100),
	`partnerEmail` varchar(200),
	`isActive` boolean NOT NULL DEFAULT true,
	`callCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `apiLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`endpoint` varchar(200) NOT NULL,
	`method` varchar(10) NOT NULL DEFAULT 'GET',
	`statusCode` int NOT NULL DEFAULT 200,
	`responseTimeMs` int,
	`ip` varchar(45),
	`userAgent` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiLogs_id` PRIMARY KEY(`id`)
);
