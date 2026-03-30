ALTER TABLE `submissionSettings` ADD `paymentWalletAddress` varchar(100);--> statement-breakpoint
ALTER TABLE `submissionSettings` ADD `paymentNetwork` enum('BSC','TRC20','ERC20') DEFAULT 'BSC';