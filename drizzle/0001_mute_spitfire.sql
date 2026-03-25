CREATE TABLE `adImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200),
	`imageUrl` text NOT NULL,
	`linkUrl` text,
	`position` varchar(50) DEFAULT 'sidebar',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `airdropParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`airdropId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`status` enum('pending','distributed','failed') NOT NULL DEFAULT 'pending',
	`txHash` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `airdropParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `airdrops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`tokenSymbol` varchar(20) NOT NULL,
	`totalAmount` decimal(18,2) NOT NULL,
	`distributedAmount` decimal(18,2) DEFAULT '0',
	`perUserAmount` decimal(18,2),
	`maxParticipants` int,
	`currentParticipants` int DEFAULT 0,
	`status` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
	`startDate` timestamp,
	`endDate` timestamp,
	`requirements` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `airdrops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`type` enum('info','warning','success','urgent') NOT NULL DEFAULT 'info',
	`isActive` boolean NOT NULL DEFAULT true,
	`targetRole` enum('all','user','admin') NOT NULL DEFAULT 'all',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`targetType` varchar(50),
	`targetId` int,
	`details` json,
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventBanners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200),
	`imageUrl` text NOT NULL,
	`linkUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventBanners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investmentPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`logoUrl` text,
	`label` varchar(50),
	`dailyRate` decimal(6,4) NOT NULL,
	`minAmount` decimal(18,2) DEFAULT '0',
	`maxAmount` decimal(18,2),
	`duration` int,
	`totalReturn` decimal(8,4),
	`description` text,
	`urlId` varchar(50),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`planType` enum('investment','staking') NOT NULL DEFAULT 'investment',
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investmentPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`dailyEarning` decimal(18,2),
	`totalEarned` decimal(18,2) DEFAULT '0',
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nodeOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nodeId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`totalAmount` decimal(18,2) NOT NULL,
	`txHash` varchar(100),
	`status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nodeOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` decimal(18,2) NOT NULL,
	`color` varchar(30) NOT NULL DEFAULT 'gold',
	`nodeId` int NOT NULL DEFAULT 1,
	`walletAddress` varchar(100),
	`description` text,
	`tags` json,
	`totalSold` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(18,2) NOT NULL DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`isPinned` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredId` int NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`commissionRate` decimal(6,4) DEFAULT '0.05',
	`totalEarned` decimal(18,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`category` varchar(50) DEFAULT 'general',
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`adminReply` text,
	`repliedAt` timestamp,
	`repliedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','sub_admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('pending','approved','rejected','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycData` json;--> statement-breakpoint
ALTER TABLE `users` ADD `totalInvested` decimal(18,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `users` ADD `totalNodes` decimal(18,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);