CREATE TABLE `planSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicantName` varchar(100) NOT NULL,
	`applicantEmail` varchar(320) NOT NULL,
	`applicantTelegram` varchar(100),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`telegramVerified` boolean NOT NULL DEFAULT false,
	`fileUrl` text,
	`fileType` varchar(20),
	`parsedPlanData` json,
	`finalPlanData` json,
	`listingFeeUsdt` decimal(18,2),
	`feePaymentTxHash` varchar(100),
	`feePaid` boolean NOT NULL DEFAULT false,
	`votingStartAt` timestamp,
	`votingEndAt` timestamp,
	`totalVotes` int NOT NULL DEFAULT 0,
	`approveVotes` int NOT NULL DEFAULT 0,
	`rejectVotes` int NOT NULL DEFAULT 0,
	`status` enum('draft','verified','fee_paid','voting','approved','rejected','listed') NOT NULL DEFAULT 'draft',
	`adminNote` text,
	`listedPlanId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissionFeeDistributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`recipientType` enum('node_voter','platform') NOT NULL,
	`recipientId` int,
	`recipientWallet` varchar(100),
	`amountUsdt` decimal(18,6) NOT NULL,
	`distributionPct` decimal(6,4),
	`status` enum('pending','distributed','failed') NOT NULL DEFAULT 'pending',
	`txHash` varchar(100),
	`distributedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissionFeeDistributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissionSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingFeeUsdt` decimal(18,2) NOT NULL DEFAULT '500',
	`votingPeriodDays` int NOT NULL DEFAULT 7,
	`approvalThresholdPct` int NOT NULL DEFAULT 60,
	`platformFeePct` int NOT NULL DEFAULT 40,
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissionSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissionVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`type` enum('email','telegram') NOT NULL,
	`target` varchar(320) NOT NULL,
	`code` varchar(10) NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissionVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissionVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`voterId` int NOT NULL,
	`voterWallet` varchar(100),
	`vote` enum('approve','reject') NOT NULL,
	`comment` text,
	`nodeCount` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissionVotes_id` PRIMARY KEY(`id`)
);
