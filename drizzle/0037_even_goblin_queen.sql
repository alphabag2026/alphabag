CREATE TABLE `userNotificationReads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(100) NOT NULL,
	`notificationId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userNotificationReads_id` PRIMARY KEY(`id`)
);
