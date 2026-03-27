CREATE TABLE `trendingAlertSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`priceChangeThreshold` decimal(5,2) NOT NULL DEFAULT '10.00',
	`intervalMinutes` int NOT NULL DEFAULT 60,
	`channelChatId` varchar(100),
	`sendToDm` boolean NOT NULL DEFAULT false,
	`filterHasInvestment` boolean NOT NULL DEFAULT false,
	`messageTemplate` text,
	`lastRunAt` timestamp,
	`lastResult` json,
	`nextRunAt` timestamp,
	`lastAlertedTokens` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trendingAlertSettings_id` PRIMARY KEY(`id`)
);
