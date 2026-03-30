CREATE TABLE `rewardWithdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amountUsdt` decimal(18,6) NOT NULL,
	`walletAddress` varchar(100) NOT NULL,
	`network` enum('BSC','TRC20','ERC20') NOT NULL DEFAULT 'BSC',
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`txHash` varchar(100),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rewardWithdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voteRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`submissionId` int NOT NULL,
	`voteId` int NOT NULL,
	`rewardUsdt` decimal(18,6) NOT NULL,
	`rewardReason` varchar(100) DEFAULT 'vote_participation',
	`status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paidAt` timestamp,
	`txHash` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voteRewards_id` PRIMARY KEY(`id`)
);
