CREATE TABLE `telegramSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`channelChatId` varchar(100),
	`filter` json,
	`cronExpression` varchar(100) NOT NULL,
	`timezone` varchar(50) NOT NULL DEFAULT 'Asia/Seoul',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastRunAt` timestamp,
	`lastResult` json,
	`nextRunAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegramSchedules_id` PRIMARY KEY(`id`)
);
