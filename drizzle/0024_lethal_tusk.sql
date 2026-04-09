ALTER TABLE `snsInfluencers` ADD `fetchIntervalHours` int DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE `snsInfluencers` ADD `alertOnNewPost` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `snsInfluencers` ADD `estimatedDailyTweets` int DEFAULT 5 NOT NULL;