CREATE TABLE `influencerFollows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `influencerFollows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCoinAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`coinSymbol` varchar(20) NOT NULL,
	`priceChangeThreshold` decimal(5,2) NOT NULL DEFAULT '10.00',
	`isEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCoinAlerts_id` PRIMARY KEY(`id`)
);
