CREATE TABLE `investmentPaymentPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`version` int NOT NULL,
	`nominalUsdtAmount` decimal(36,18) NOT NULL,
	`usdtShareBps` int NOT NULL,
	`pointShareBps` int NOT NULL,
	`checkoutPointUsdtRate` decimal(36,18) NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`configId` int,
	`isActive` boolean NOT NULL DEFAULT false,
	`effectiveAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investmentPaymentPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investmentPaymentReceipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`policyId` int NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`usdtAmount` decimal(36,18) NOT NULL,
	`pointAmount` decimal(36,18) NOT NULL,
	`walletAddress` varchar(100) NOT NULL,
	`txHash` varchar(100),
	`status` enum('intent','pending','confirmed','finalized','failed','reverted') NOT NULL DEFAULT 'intent',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investmentPaymentReceipts_id` PRIMARY KEY(`id`),
	CONSTRAINT `investmentPaymentReceipts_txHash_unique` UNIQUE(`txHash`)
);
--> statement-breakpoint
CREATE TABLE `nodeBenefitPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` int NOT NULL,
	`version` int NOT NULL,
	`pointEarnBoostBps` int NOT NULL DEFAULT 0,
	`pointSpendCapPct` int NOT NULL DEFAULT 5,
	`p2pFeeDiscountBps` int NOT NULL DEFAULT 0,
	`dailyP2PVolumeCapUsdt` decimal(36,18) NOT NULL DEFAULT '0',
	`voteWeightMultiplierBps` int NOT NULL DEFAULT 10000,
	`prioritySupport` boolean NOT NULL DEFAULT false,
	`earlyAccess` boolean NOT NULL DEFAULT false,
	`terms` text,
	`isActive` boolean NOT NULL DEFAULT false,
	`effectiveAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nodeBenefitPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pointLedgerEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventKey` varchar(180) NOT NULL,
	`userId` int,
	`walletAddress` varchar(100) NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`direction` enum('credit','debit') NOT NULL,
	`entryType` enum('mint','transfer_in','transfer_out','market_fill','checkout','burn','adjustment') NOT NULL,
	`amount` decimal(36,18) NOT NULL,
	`txHash` varchar(100),
	`blockNumber` varchar(48),
	`logIndex` int,
	`confirmations` int NOT NULL DEFAULT 0,
	`status` enum('pending','confirmed','finalized','reverted','failed') NOT NULL DEFAULT 'pending',
	`metadata` json,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pointLedgerEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `pointLedgerEntries_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
CREATE TABLE `pointMarketFills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chainFillId` varchar(120) NOT NULL,
	`orderId` int NOT NULL,
	`buyerUserId` int,
	`buyerWalletAddress` varchar(100) NOT NULL,
	`pointAmount` decimal(36,18) NOT NULL,
	`grossUsdtAmount` decimal(36,18) NOT NULL,
	`feeUsdtAmount` decimal(36,18) NOT NULL,
	`sellerNetUsdtAmount` decimal(36,18) NOT NULL,
	`txHash` varchar(100) NOT NULL,
	`blockNumber` varchar(48),
	`status` enum('pending','confirmed','finalized','reverted') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pointMarketFills_id` PRIMARY KEY(`id`),
	CONSTRAINT `pointMarketFills_chainFillId_unique` UNIQUE(`chainFillId`)
);
--> statement-breakpoint
CREATE TABLE `pointMarketOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chainOrderId` varchar(100),
	`sellerUserId` int NOT NULL,
	`sellerWalletAddress` varchar(100) NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`configId` int,
	`pointAmount` decimal(36,18) NOT NULL,
	`remainingPointAmount` decimal(36,18) NOT NULL,
	`minFillAmount` decimal(36,18) NOT NULL,
	`priceUsdtPerPoint` decimal(36,18) NOT NULL,
	`feeBpsSnapshot` int NOT NULL,
	`status` enum('draft','open','partially_filled','filled','cancelled','expired','paused','dispute_review') NOT NULL DEFAULT 'draft',
	`orderTxHash` varchar(100),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pointMarketOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `pointMarketOrders_chainOrderId_unique` UNIQUE(`chainOrderId`)
);
--> statement-breakpoint
CREATE TABLE `pointTokenConfigs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`chainId` varchar(32) NOT NULL,
	`pointTokenAddress` varchar(100),
	`usdtTokenAddress` varchar(100),
	`marketEscrowAddress` varchar(100),
	`checkoutAddress` varchar(100),
	`treasuryAddress` varchar(100),
	`pointSymbol` varchar(24) NOT NULL DEFAULT 'ABP',
	`pointDecimals` int NOT NULL DEFAULT 18,
	`minConfirmations` int NOT NULL DEFAULT 12,
	`isActive` boolean NOT NULL DEFAULT true,
	`isLive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pointTokenConfigs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userWallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`network` enum('BSC','ERC20','TRC20') NOT NULL,
	`address` varchar(100) NOT NULL,
	`normalizedAddress` varchar(100) NOT NULL,
	`signatureNonce` varchar(96) NOT NULL,
	`verifiedAt` timestamp,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userWallets_id` PRIMARY KEY(`id`)
);
