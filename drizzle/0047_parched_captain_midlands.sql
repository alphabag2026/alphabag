ALTER TABLE `internalPointInvestmentUses` ADD `paymentNetwork` enum('BSC','ERC20','TRC20');--> statement-breakpoint
ALTER TABLE `internalPointInvestmentUses` ADD `usdtTxHash` varchar(100);--> statement-breakpoint
ALTER TABLE `internalPointInvestmentUses` ADD `paymentConfirmedBy` int;--> statement-breakpoint
ALTER TABLE `internalPointInvestmentUses` ADD `paymentConfirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `internalPointInvestmentUses` ADD CONSTRAINT `internalPointInvestmentUses_usdtTxHash_unique` UNIQUE(`usdtTxHash`);