CREATE TABLE `snsInfluencers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`handle` varchar(100) NOT NULL,
	`avatarUrl` text,
	`twitterUrl` text,
	`description` text,
	`category` varchar(50) DEFAULT 'crypto',
	`followerCount` varchar(30),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `snsInfluencers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `snsPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`influencerId` int NOT NULL,
	`content` text NOT NULL,
	`tweetUrl` text,
	`tweetId` varchar(50),
	`likes` int NOT NULL DEFAULT 0,
	`retweets` int NOT NULL DEFAULT 0,
	`replies` int NOT NULL DEFAULT 0,
	`postedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snsPosts_id` PRIMARY KEY(`id`)
);
