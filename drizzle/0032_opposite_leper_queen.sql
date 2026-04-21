CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('meetup','expo','conference','webinar') NOT NULL DEFAULT 'meetup',
	`title` varchar(300) NOT NULL,
	`titleKo` varchar(300),
	`description` text,
	`location` varchar(300),
	`onlineUrl` varchar(1000),
	`imageUrl` varchar(1000),
	`bannerUrl` varchar(1000),
	`registrationUrl` varchar(1000),
	`startAt` timestamp NOT NULL,
	`endAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `liveStreams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`streamUrl` varchar(1000),
	`thumbnailUrl` varchar(1000),
	`isLive` boolean NOT NULL DEFAULT false,
	`scheduledAt` timestamp,
	`endedAt` timestamp,
	`viewerCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liveStreams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`titleKo` varchar(300),
	`titleEn` varchar(300),
	`titleZh` varchar(300),
	`url` varchar(1000),
	`category` varchar(50) DEFAULT 'notice',
	`imageUrl` varchar(1000),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsItems_id` PRIMARY KEY(`id`)
);
