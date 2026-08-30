ALTER TABLE `pointTokenConfigs` ADD `auditStatus` enum('not_started','in_review','passed') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `pointTokenConfigs` ADD `auditReportUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `pointTokenConfigs` ADD `multisigAddress` varchar(100);