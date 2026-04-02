ALTER TABLE `investmentPlans` ADD `isMLM` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `investmentPlans` ADD `onepageUrl` text;--> statement-breakpoint
ALTER TABLE `partners` ADD `isMLM` boolean DEFAULT false NOT NULL;