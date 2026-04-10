CREATE TABLE `cbagSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL DEFAULT 'C-BAG Insurance',
	`subtitle` varchar(200) DEFAULT 'Crypto Bag Insurance Collection',
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`defaultPercent` decimal(5,2) DEFAULT '10.00',
	`minPercent` decimal(5,2) DEFAULT '1.00',
	`maxPercent` decimal(5,2) DEFAULT '50.00',
	`goldenRequired` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cbagSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `investments` ADD `cbagPlanId` int;--> statement-breakpoint
ALTER TABLE `investments` ADD `cbagPercent` decimal(5,2);--> statement-breakpoint
ALTER TABLE `investments` ADD `cbagAmount` decimal(18,2);