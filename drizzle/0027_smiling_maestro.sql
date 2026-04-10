CREATE TABLE `travelDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`docType` enum('passport','flight_ticket','hotel_voucher','visa','travel_insurance','other') NOT NULL,
	`title` varchar(200) NOT NULL,
	`fileUrl` text,
	`expiryDate` varchar(20),
	`note` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `travelDocuments_id` PRIMARY KEY(`id`)
);
