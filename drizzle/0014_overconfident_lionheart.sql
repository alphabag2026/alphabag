ALTER TABLE `snsInfluencers` ADD `twitterUserId` varchar(50);--> statement-breakpoint
ALTER TABLE `snsInfluencers` ADD `autoFetchEnabled` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `snsInfluencers` ADD `lastFetchedAt` timestamp;--> statement-breakpoint
ALTER TABLE `snsInfluencers` ADD `snsTelegramChatId` varchar(64);