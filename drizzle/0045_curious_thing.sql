CREATE TABLE `bPointReserveAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`walletAddress` varchar(100),
	`fundedUsdt` decimal(36,18) NOT NULL DEFAULT '0',
	`committedUsdt` decimal(36,18) NOT NULL DEFAULT '0',
	`paidUsdt` decimal(36,18) NOT NULL DEFAULT '0',
	`status` enum('active','paused','closed') NOT NULL DEFAULT 'paused',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bPointReserveAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bPointReserveMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`reserveAccountId` int NOT NULL,
	`movementType` enum('fund','commit','release','payout','adjustment') NOT NULL,
	`amountUsdt` decimal(36,18) NOT NULL,
	`withdrawalRequestId` int,
	`txHash` varchar(100),
	`memo` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bPointReserveMovements_id` PRIMARY KEY(`id`),
	CONSTRAINT `bPointReserveMovements_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `bPointWithdrawalRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amountB` decimal(36,18) NOT NULL,
	`usdtAmount` decimal(36,18) NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`walletAddress` varchar(100) NOT NULL,
	`reserveAccountId` int,
	`status` enum('requested','approved','processing','paid','rejected','failed','cancelled') NOT NULL DEFAULT 'requested',
	`txHash` varchar(100),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedBy` int,
	`approvedAt` timestamp,
	`paidAt` timestamp,
	`rejectedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bPointWithdrawalRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internalPointAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`aAvailable` decimal(36,18) NOT NULL DEFAULT '0',
	`aHeld` decimal(36,18) NOT NULL DEFAULT '0',
	`bAvailable` decimal(36,18) NOT NULL DEFAULT '0',
	`bReserved` decimal(36,18) NOT NULL DEFAULT '0',
	`status` enum('active','frozen','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internalPointAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `internalPointAccounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `internalPointConversionRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversionType` enum('investment_completion','full_usdt_sale') NOT NULL,
	`investmentUseId` int,
	`planId` int,
	`saleAmountUsdt` decimal(36,18),
	`conversionBps` int NOT NULL,
	`requestedAPoints` decimal(36,18) NOT NULL,
	`convertedBPoints` decimal(36,18) NOT NULL,
	`evidenceUrl` text,
	`memo` text,
	`status` enum('requested','approved','rejected','cancelled') NOT NULL DEFAULT 'requested',
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internalPointConversionRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internalPointGrantRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`beneficiaryUserId` int NOT NULL,
	`reasonType` enum('project_failure_join','leg_move','manual') NOT NULL,
	`amountA` decimal(36,18) NOT NULL,
	`sourceProjectName` varchar(160),
	`evidenceUrl` text,
	`memo` text,
	`status` enum('requested','approved','rejected','cancelled') NOT NULL DEFAULT 'requested',
	`requestedBy` int NOT NULL,
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internalPointGrantRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internalPointInvestmentUses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`investmentId` int,
	`nominalUsdtAmount` decimal(36,18) NOT NULL,
	`usdtShareBps` int NOT NULL,
	`aPointShareBps` int NOT NULL,
	`usdtAmount` decimal(36,18) NOT NULL,
	`aPointAmount` decimal(36,18) NOT NULL,
	`status` enum('intent','confirmed','completed','cancelled','refunded') NOT NULL DEFAULT 'intent',
	`completedBy` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internalPointInvestmentUses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `internalPointLedgerEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`idempotencyKey` varchar(160) NOT NULL,
	`userId` int NOT NULL,
	`pointType` enum('A','B') NOT NULL,
	`direction` enum('credit','debit') NOT NULL,
	`actionType` enum('grant','transfer_in','transfer_out','investment_use','investment_refund','conversion_debit','conversion_credit','withdrawal_reserve','withdrawal_release','withdrawal_paid','adjustment') NOT NULL,
	`amount` decimal(36,18) NOT NULL,
	`balanceAfter` decimal(36,18) NOT NULL,
	`relatedUserId` int,
	`referenceType` varchar(50),
	`referenceId` varchar(100),
	`memo` text,
	`metadata` json,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internalPointLedgerEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `internalPointLedgerEntries_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
