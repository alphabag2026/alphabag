ALTER TABLE `snsInfluencers` ADD `autoTranslate` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `snsInfluencers` ADD `autoTranslateLang` varchar(10) DEFAULT 'ko';